from decimal import Decimal


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
    assert salary.json()["available"] is False
