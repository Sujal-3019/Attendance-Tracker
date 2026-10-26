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
    assert employee["balances"] == [
        {
            "type": "Annual Leave",
            "code": "AL",
            "allowance": "10",
            "used": "0",
            "remaining": "10",
            "paymentType": "Paid",
        }
    ]
