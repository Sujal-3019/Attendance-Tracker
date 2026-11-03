from datetime import date
from decimal import Decimal
from types import SimpleNamespace

from pydantic import SecretStr


def _token(client, email, password):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def test_login_current_user_and_failed_login(client):
    test_client, data = client
    token = _token(test_client, data["admin_email"], data["password"])
    profile = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile.status_code == 200
    assert profile.json()["role"] == "admin"
    assert "password_hash" not in profile.json()

    failed = test_client.post(
        "/api/v1/auth/login",
        json={"email": data["admin_email"], "password": "wrong-password"},
    )
    assert failed.status_code == 401


def test_employee_cannot_access_admin_employee_api(client):
    test_client, data = client
    token = _token(test_client, data["employee_email"], data["password"])
    response = test_client.get(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_employee_list_is_organization_scoped(client):
    test_client, data = client
    token = _token(test_client, data["admin_email"], data["password"])
    response = test_client.get(
        "/api/v1/employees",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["employeeCode"] == "EMP-TEST"

    missing = test_client.get(
        "/api/v1/employees/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert missing.status_code == 404


def test_admin_employee_creation_provisions_login_credentials(client):
    test_client, data = client
    admin_token = _token(test_client, data["admin_email"], data["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    employee_payload = {
        "employeeCode": "EMP-NEW",
        "name": "New Employee",
        "email": "new.employee@example.com",
        "password": "employee-login-password",
        "phone": "9876543212",
        "department": "Engineering",
        "designation": "Developer",
        "manager": "Test Admin",
        "employmentType": "Full-time",
        "workMode": "Office",
        "location": "Main Office",
        "joiningDate": date.today().isoformat(),
        "status": "Active",
    }

    created = test_client.post(
        "/api/v1/employees", headers=admin_headers, json=employee_payload
    )

    assert created.status_code == 201
    employee = created.json()
    assert employee["email"] == employee_payload["email"]
    assert "password" not in employee
    assert "passwordHash" not in employee

    login = test_client.post(
        "/api/v1/auth/login",
        json={
            "email": employee_payload["email"],
            "password": employee_payload["password"],
        },
    )
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "employee"
    assert login.json()["user"]["employeeId"] == employee["id"]
    assert "passwordHash" not in login.json()["user"]

    employee_token = login.json()["accessToken"]
    projection = test_client.get(
        "/api/v1/me/payroll/projection",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert projection.status_code == 200
    assert projection.json()["available"] is False
    assert projection.json()["reason"]

    check_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert check_in.status_code == 201
    listed = test_client.get("/api/v1/employees", headers=admin_headers)
    assert listed.status_code == 200
    new_employee = next(
        item for item in listed.json()["items"] if item["id"] == employee["id"]
    )
    assert new_employee["attendance"] == {"present": 1, "late": 0}

    changed_email = "new.email@example.com"
    updated = test_client.patch(
        f"/api/v1/employees/{employee['id']}",
        headers=admin_headers,
        json={"email": changed_email},
    )
    assert updated.status_code == 200
    updated_login = test_client.post(
        "/api/v1/auth/login",
        json={"email": changed_email, "password": employee_payload["password"]},
    )
    assert updated_login.status_code == 200

    inactive = test_client.patch(
        f"/api/v1/employees/{employee['id']}/status",
        headers=admin_headers,
        json={"status": "Inactive"},
    )
    assert inactive.status_code == 200
    inactive_login = test_client.post(
        "/api/v1/auth/login",
        json={"email": changed_email, "password": employee_payload["password"]},
    )
    assert inactive_login.status_code == 401

    activated = test_client.patch(
        f"/api/v1/employees/{employee['id']}/status",
        headers=admin_headers,
        json={"status": "Active"},
    )
    assert activated.status_code == 200
    assert activated.json()["status"] == "Active"
    activated_login = test_client.post(
        "/api/v1/auth/login",
        json={"email": changed_email, "password": employee_payload["password"]},
    )
    assert activated_login.status_code == 200


def test_employee_self_registration_requires_company_code_and_notifies_admin(client):
    test_client, data = client
    admin_headers = {
        "Authorization": f"Bearer {_token(test_client, data['admin_email'], data['password'])}"
    }

    generated = test_client.post(
        "/api/v1/settings/company-code",
        headers=admin_headers,
    )
    assert generated.status_code == 200
    company_code = generated.json()["companyCode"]
    assert len(company_code) >= 12

    old_code_registration = test_client.post(
        "/api/v1/auth/register/employee",
        json={
            "organizationCode": "test-enrollment-code",
            "fullName": "Self Registered Employee",
            "email": "self.registered@example.com",
            "phone": "9876543213",
            "password": "employee-login-password",
        },
    )
    assert old_code_registration.status_code == 400

    registered = test_client.post(
        "/api/v1/auth/register/employee",
        json={
            "organizationCode": company_code,
            "fullName": "Self Registered Employee",
            "email": "self.registered@example.com",
            "phone": "9876543213",
            "password": "employee-login-password",
        },
    )
    assert registered.status_code == 201
    assert registered.json()["user"]["profileComplete"] is False
    assert registered.json()["user"]["name"] == "Self Registered Employee"
    employee_id = registered.json()["user"]["employeeId"]

    phone_login = test_client.post(
        "/api/v1/auth/login",
        json={"email": "9876543213", "password": "employee-login-password"},
    )
    assert phone_login.status_code == 200
    assert phone_login.json()["user"]["employeeId"] == employee_id
    self_name_change = test_client.patch(
        "/api/v1/me/profile",
        headers={"Authorization": f"Bearer {phone_login.json()['accessToken']}"},
        json={"fullName": "Changed Name"},
    )
    assert self_name_change.status_code == 403
    email_login = test_client.post(
        "/api/v1/auth/login",
        json={
            "email": "self.registered@example.com",
            "password": "employee-login-password",
        },
    )
    assert email_login.status_code == 200
    assert email_login.json()["user"]["employeeId"] == employee_id
    own_leave_balances = test_client.get(
        "/api/v1/me/leaves",
        headers={"Authorization": f"Bearer {phone_login.json()['accessToken']}"},
    )
    assert own_leave_balances.status_code == 200
    assert Decimal(own_leave_balances.json()["balances"][0]["allowance"]) == 0

    notifications = test_client.get(
        "/api/v1/notifications",
        headers=admin_headers,
    )
    onboarding = next(
        item
        for item in notifications.json()["items"]
        if item["type"] == "EMPLOYEE_ONBOARDING"
    )
    assert onboarding["actionRequired"] is True
    assert onboarding["actionUrl"] == f"/employees/{employee_id}/edit"

    name_change = test_client.patch(
        f"/api/v1/employees/{employee_id}",
        headers=admin_headers,
        json={"name": "Name Changed By Admin"},
    )
    assert name_change.status_code == 422

    leave_type = test_client.get("/api/v1/leave-types", headers=admin_headers).json()[0]
    completed = test_client.patch(
        f"/api/v1/employees/{employee_id}",
        headers=admin_headers,
        json={
            "employeeCode": "EMP-SELF-1",
            "department": "Engineering",
            "designation": "Developer",
            "manager": "Test Admin",
            "employmentType": "Full-time",
            "workMode": "Office",
            "location": "Main Office",
            "joiningDate": date.today().isoformat(),
            "wageModel": "Monthly",
            "baseWage": 50000,
            "leaveAllocations": [
                {
                    "leaveTypeId": leave_type["id"],
                    "allocatedDays": leave_type["annualAllocation"],
                }
            ],
        },
    )
    assert completed.status_code == 200
    assert completed.json()["profileComplete"] is True

    refreshed_notifications = test_client.get(
        "/api/v1/notifications",
        headers=admin_headers,
    )
    updated_onboarding = next(
        item
        for item in refreshed_notifications.json()["items"]
        if item["type"] == "EMPLOYEE_ONBOARDING"
    )
    assert updated_onboarding["actionRequired"] is False
    assert updated_onboarding["actionUrl"] is None


def test_first_admin_can_register_once_with_server_setup_code(empty_client, monkeypatch):
    import app.services.auth as auth_service

    setup_code = "local-test-admin-setup-code-with-more-than-32-chars"
    monkeypatch.setattr(
        auth_service,
        "get_settings",
        lambda: SimpleNamespace(admin_setup_code=SecretStr(setup_code)),
    )
    payload = {
        "setupCode": setup_code,
        "organizationName": "New Organization",
        "organizationType": "office",
        "country": "India",
        "state": "Karnataka",
        "fullName": "First Admin",
        "email": "first-admin@example.com",
        "phone": "9876543212",
        "password": "a-secure-test-password",
        "confirmPassword": "a-secure-test-password",
    }

    status = empty_client.get("/api/v1/auth/admin-registration/status")
    assert status.status_code == 200
    assert status.json() == {"available": True}

    registered = empty_client.post("/api/v1/auth/register/admin", json=payload)
    assert registered.status_code == 201
    result = registered.json()
    assert result["user"]["role"] == "admin"
    assert result["organization"]["name"] == "New Organization"
    assert result["organization"]["country"] == "India"
    assert result["organization"]["state"] == "Karnataka"
    assert len(result["employeeEnrollmentCode"]) > 20
    assert "password_hash" not in result

    closed_status = empty_client.get("/api/v1/auth/admin-registration/status")
    assert closed_status.json() == {"available": False}
    second_attempt = empty_client.post("/api/v1/auth/register/admin", json=payload)
    assert second_attempt.status_code == 409

    profile = empty_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {result['accessToken']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["role"] == "admin"


def test_first_admin_registration_rejects_wrong_setup_code(empty_client, monkeypatch):
    import app.services.auth as auth_service

    monkeypatch.setattr(
        auth_service,
        "get_settings",
        lambda: SimpleNamespace(
            admin_setup_code=SecretStr("local-test-admin-setup-code-with-more-than-32-chars")
        ),
    )
    response = empty_client.post(
        "/api/v1/auth/register/admin",
        json={
            "setupCode": "wrong-setup-code-that-is-long-enough-to-validate",
            "organizationName": "New Organization",
            "organizationType": "office",
            "country": "India",
            "state": "Karnataka",
            "fullName": "First Admin",
            "email": "first-admin@example.com",
            "phone": "9876543212",
            "password": "a-secure-test-password",
        },
    )
    assert response.status_code == 403
    assert empty_client.get("/api/v1/auth/admin-registration/status").json() == {
        "available": True
    }
