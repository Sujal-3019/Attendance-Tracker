from datetime import date, timedelta
from decimal import Decimal


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_leave_approval_updates_balance_once(client):
    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    leave_date = (date.today() + timedelta(days=30)).isoformat()
    created = test_client.post(
        "/api/v1/me/leaves",
        headers=employee_headers,
        json={
            "type": "Annual Leave",
            "startDate": leave_date,
            "endDate": leave_date,
            "reason": "Personal appointment",
        },
    )
    assert created.status_code == 201
    request_id = created.json()["id"]
    approved = test_client.post(
        f"/api/v1/leaves/requests/{request_id}/approve",
        headers=admin_headers,
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Approved"

    retried = test_client.post(
        f"/api/v1/leaves/requests/{request_id}/approve",
        headers=admin_headers,
    )
    assert retried.status_code == 409
    balances = test_client.get("/api/v1/me/leaves", headers=employee_headers)
    assert balances.status_code == 200
    assert Decimal(balances.json()["balances"][0]["remaining"]) == Decimal("9")


def test_leave_overlap_and_past_dates_are_rejected(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])
    start_date = (date.today() + timedelta(days=30)).isoformat()
    end_date = (date.today() + timedelta(days=31)).isoformat()
    first = test_client.post(
        "/api/v1/me/leaves",
        headers=headers,
        json={
            "type": "Annual Leave",
            "startDate": start_date,
            "endDate": end_date,
            "reason": "Planned personal leave",
        },
    )
    assert first.status_code == 201
    overlap = test_client.post(
        "/api/v1/me/leaves",
        headers=headers,
        json={
            "type": "Annual Leave",
            "startDate": end_date,
            "endDate": (date.today() + timedelta(days=32)).isoformat(),
            "reason": "Another personal leave",
        },
    )
    assert overlap.status_code == 409


def test_invalid_leave_type_status_is_rejected(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    leave_types = test_client.get("/api/v1/leave-types", headers=admin_headers)
    assert leave_types.status_code == 200
    leave_type_id = leave_types.json()[0]["id"]

    response = test_client.patch(
        f"/api/v1/leave-types/{leave_type_id}/status",
        headers=admin_headers,
        json={"status": "Archived"},
    )

    assert response.status_code == 422


def test_admin_leave_balances_include_configured_leave_types(client):
    test_client, data = client
    headers = _login(test_client, data["admin_email"], data["password"])

    response = test_client.get("/api/v1/leaves/balances", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    employee = response.json()[0]
    assert employee["employeeId"] == data["employee_id"]
    assert employee["balances"][0]["type"] == "Annual Leave"
    assert employee["balances"][0]["allowance"] == "10"
    assert employee["balances"][0]["available"] == "10"


def test_admin_can_allocate_different_annual_leave_balances_per_employee(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )
    sick_leave = test_client.post(
        "/api/v1/leave-types",
        headers=admin_headers,
        json={
            "name": "Sick Leave",
            "code": "SL",
            "description": "Annual sick leave allowance",
            "annualAllocation": 12,
            "paid": True,
            "carryForward": False,
            "maxConsecutiveDays": 10,
        },
    )
    assert sick_leave.status_code == 201

    annual_leave = test_client.get(
        "/api/v1/leave-types", headers=admin_headers
    ).json()
    by_code = {item["code"]: item for item in annual_leave}
    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={
            "leaveAllocations": [
                {
                    "leaveTypeId": by_code["AL"]["id"],
                    "allocatedDays": 5,
                },
                {
                    "leaveTypeId": by_code["SL"]["id"],
                    "allocatedDays": 3,
                },
            ]
        },
    )
    assert updated.status_code == 200

    balances = test_client.get("/api/v1/me/leaves", headers=employee_headers)
    assert balances.status_code == 200
    allocations = {
        item["code"]: Decimal(item["allowance"])
        for item in balances.json()["balances"]
    }
    assert allocations == {"AL": Decimal("5"), "SL": Decimal("3")}


def test_employee_leave_types_and_requests_follow_admin_allocations(client):
    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )
    created_type = test_client.post(
        "/api/v1/leave-types",
        headers=admin_headers,
        json={
            "name": "Unpaid Personal Leave",
            "code": "UPL",
            "description": "Unpaid personal leave allocation",
            "annualAllocation": 8,
            "paid": False,
            "carryForward": False,
            "maxConsecutiveDays": 3,
        },
    )
    assert created_type.status_code == 201
    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={
            "leaveAllocations": [
                {
                    "leaveTypeId": created_type.json()["id"],
                    "allocatedDays": 2,
                }
            ]
        },
    )
    assert updated.status_code == 200

    balances = test_client.get(
        "/api/v1/me/leaves", headers=employee_headers
    ).json()["balances"]
    unpaid_balance = next(item for item in balances if item["code"] == "UPL")
    assert Decimal(unpaid_balance["allowance"]) == Decimal("2")
    assert Decimal(unpaid_balance["available"]) == Decimal("2")
    assert unpaid_balance["maxConsecutiveDays"] == 3

    leave_date = (date.today() + timedelta(days=30)).isoformat()
    exceeds_consecutive_limit = test_client.post(
        "/api/v1/me/leaves",
        headers=employee_headers,
        json={
            "type": "Unpaid Personal Leave",
            "startDate": leave_date,
            "endDate": (date.today() + timedelta(days=33)).isoformat(),
            "reason": "Extended personal matters",
        },
    )
    assert exceeds_consecutive_limit.status_code == 422

    request = test_client.post(
        "/api/v1/me/leaves",
        headers=employee_headers,
        json={
            "type": "Unpaid Personal Leave",
            "startDate": leave_date,
            "endDate": (date.today() + timedelta(days=31)).isoformat(),
            "reason": "Personal matters",
        },
    )
    assert request.status_code == 201

    exhausted = test_client.post(
        "/api/v1/me/leaves",
        headers=employee_headers,
        json={
            "type": "Unpaid Personal Leave",
            "startDate": (date.today() + timedelta(days=40)).isoformat(),
            "endDate": (date.today() + timedelta(days=40)).isoformat(),
            "reason": "Another personal day",
        },
    )
    assert exhausted.status_code == 409
    assert exhausted.json()["detail"] == "Insufficient leave balance"

    approved = test_client.post(
        f"/api/v1/leaves/requests/{request.json()['id']}/approve",
        headers=admin_headers,
    )
    assert approved.status_code == 200
    updated_balance = next(
        item
        for item in test_client.get(
            "/api/v1/me/leaves", headers=employee_headers
        ).json()["balances"]
        if item["code"] == "UPL"
    )
    assert Decimal(updated_balance["used"]) == Decimal("2")
    assert Decimal(updated_balance["available"]) == Decimal("0")

    deactivated = test_client.patch(
        f"/api/v1/leave-types/{created_type.json()['id']}/status",
        headers=admin_headers,
        json={"status": "Inactive"},
    )
    assert deactivated.status_code == 200
    employee_types = test_client.get(
        "/api/v1/leave-types", headers=employee_headers
    )
    assert employee_types.status_code == 200
    assert all(item["status"] == "Active" for item in employee_types.json())


def test_approved_leave_clears_an_absence_record(client, monkeypatch):
    from datetime import datetime, time, timezone

    import app.services.attendance as attendance_service

    test_client, data = client
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    target_date = date.today() + timedelta(days=1)
    clock = datetime.combine(target_date, time(9, 16), tzinfo=timezone.utc)
    policy = {
        "workStartTime": "09:00",
        "gracePeriodMinutes": 15,
        "workingDays": [target_date.strftime("%A")],
    }
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (clock, policy),
    )

    absent = test_client.get("/api/v1/me/attendance", headers=employee_headers)
    assert absent.status_code == 200
    assert absent.json()["today"]["status"] == "Absent"

    leave = test_client.post(
        "/api/v1/me/leaves",
        headers=employee_headers,
        json={
            "type": "Annual Leave",
            "startDate": target_date.isoformat(),
            "endDate": target_date.isoformat(),
            "reason": "Approved personal leave",
        },
    )
    assert leave.status_code == 201
    approved = test_client.post(
        f"/api/v1/leaves/requests/{leave.json()['id']}/approve",
        headers=admin_headers,
    )
    assert approved.status_code == 200

    attendance = test_client.get(
        "/api/v1/me/attendance", headers=employee_headers
    )
    assert attendance.status_code == 200
    assert attendance.json()["today"]["status"] == "On Leave"
