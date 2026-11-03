from decimal import Decimal
from datetime import date, datetime, UTC
from uuid import UUID

from app.api.deps import get_db
from app.main import app
from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveType
from app.models.payroll import OvertimeRequest, SalaryAdvance, AdvanceRepayment
from app.models.user import User


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_salary_advance_repayment_is_idempotent_and_capped(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    advance = test_client.post(
        "/api/v1/advances",
        headers=admin_headers,
        json={
            "employeeId": data["employee_id"],
            "originalAmount": "1000.00",
            "monthlyDeduction": "100.00",
            "startMonth": "2099-04",
            "reason": "Emergency support",
        },
    )
    assert advance.status_code == 201
    advance_id = advance.json()["id"]

    repayment_payload = {
        "amount": "400.00",
        "date": "2099-04-15",
        "method": "Direct repayment",
        "note": "Partial repayment",
    }
    headers = {**admin_headers, "Idempotency-Key": "repayment-test-key-1"}
    first = test_client.post(
        f"/api/v1/advances/{advance_id}/repayments",
        headers=headers,
        json=repayment_payload,
    )
    retried = test_client.post(
        f"/api/v1/advances/{advance_id}/repayments",
        headers=headers,
        json=repayment_payload,
    )
    assert first.status_code == 200
    assert retried.status_code == 200
    assert Decimal(retried.json()["outstandingBalance"]) == Decimal("600.00")
    assert len(retried.json()["repayments"]) == 1

    too_large = test_client.post(
        f"/api/v1/advances/{advance_id}/repayments",
        headers={**admin_headers, "Idempotency-Key": "repayment-test-key-2"},
        json={**repayment_payload, "amount": "700.00"},
    )
    assert too_large.status_code == 422


def test_employee_can_view_admin_assigned_base_salary(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )

    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={"baseWage": "73500.00", "wageModel": "Monthly"},
    )
    assert updated.status_code == 200

    salary = test_client.get(
        "/api/v1/me/payroll/projection", headers=employee_headers
    )
    assert salary.status_code == 200
    assert salary.json()["baseWage"] == "73500.00"
    assert salary.json()["wageModel"] == "Monthly"
    assert salary.json()["available"] is True


def test_payroll_estimate_and_advance_installment_are_idempotent(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    db_generator = app.dependency_overrides[get_db]()
    db = next(db_generator)
    employee_id = UUID(data["employee_id"])
    organization_id = UUID(data["organization_id"])
    unpaid_type = LeaveType(
        organization_id=organization_id,
        name="Unpaid leave",
        code="UL",
        description="Unpaid test leave",
        annual_allocation=0,
        paid=False,
        carry_forward=False,
        max_consecutive_days=10,
        is_active=True,
    )
    db.add(unpaid_type)
    db.flush()
    db.add_all(
        [
            AttendanceRecord(
                organization_id=organization_id,
                employee_id=employee_id,
                attendance_date=date(2024, 1, 1),
                check_in=datetime(2024, 1, 1, 9, tzinfo=UTC),
                check_out=datetime(2024, 1, 1, 17, tzinfo=UTC),
                worked_hours=Decimal("8"),
                status="Present",
            ),
            LeaveRequest(
                organization_id=organization_id,
                employee_id=employee_id,
                leave_type_id=db.query(LeaveType).filter_by(code="AL").one().id,
                start_date=date(2024, 1, 3),
                end_date=date(2024, 1, 3),
                requested_days=Decimal("1"),
                reason="Test paid leave",
                status="Approved",
            ),
            LeaveRequest(
                organization_id=organization_id,
                employee_id=employee_id,
                leave_type_id=unpaid_type.id,
                start_date=date(2024, 1, 4),
                end_date=date(2024, 1, 4),
                requested_days=Decimal("1"),
                reason="Test unpaid leave",
                status="Approved",
            ),
            OvertimeRequest(
                organization_id=organization_id,
                employee_id=employee_id,
                attendance_date=date(2024, 1, 1),
                hours=Decimal("2"),
                status="Approved",
                reason="Approved overtime",
            ),
            SalaryAdvance(
                organization_id=organization_id,
                employee_id=employee_id,
                original_amount=Decimal("1000"),
                monthly_deduction=Decimal("500"),
                start_month=date(2024, 1, 1),
                reason="Test advance",
                status="Active",
            ),
        ]
    )
    employee = db.get(Employee, employee_id)
    employee.joining_date = date(2024, 1, 1)
    employee.base_wage = Decimal("2300")
    db.commit()
    db.close()
    db_generator.close()

    first = test_client.post(
        f"/api/v1/payroll/employees/{employee_id}/finalize?month=1&year=2024",
        headers=admin_headers,
    )
    assert first.status_code == 200, first.text
    result = first.json()
    assert result["daysWorked"] == 1
    assert result["paidLeaveDays"] == 1
    assert result["unpaidLeaveDays"] == 1
    assert result["absentDays"] == 20
    assert Decimal(str(result["overtimePay"])) == Decimal("37.50")
    assert Decimal(str(result["advanceDeductions"])) == Decimal("237.50")
    assert Decimal(str(result["netPay"])) == Decimal("0.00")
    assert result["statutoryTaxesCalculated"] is False

    retried = test_client.post(
        f"/api/v1/payroll/employees/{employee_id}/finalize?month=1&year=2024",
        headers=admin_headers,
    )
    assert retried.status_code == 200
    assert retried.json()["id"] == result["id"]
    assert Decimal(str(retried.json()["advanceDeductions"])) == Decimal("237.50")

    db_generator = app.dependency_overrides[get_db]()
    db = next(db_generator)
    repayments = db.query(AdvanceRepayment).all()
    assert len(repayments) == 1
    assert repayments[0].payroll_period == "2024-01"
    db.close()
    db_generator.close()


def test_employee_can_save_tax_regime_choice_while_tds_is_unavailable(client):
    test_client, data = client
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )
    response = test_client.patch(
        "/api/v1/me/payroll/tax-regime",
        headers=employee_headers,
        json={"taxRegime": "old"},
    )
    assert response.status_code == 200
    assert response.json() == {"taxRegime": "old", "taxStatus": "Not calculated"}


def test_open_payroll_period_cannot_be_finalized(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    response = test_client.post(
        f"/api/v1/payroll/employees/{data['employee_id']}/finalize?month=12&year=2099",
        headers=admin_headers,
    )
    assert response.status_code == 409
    assert "period is still open" in response.json()["detail"]
