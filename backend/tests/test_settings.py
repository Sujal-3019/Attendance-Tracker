def _login(client, email, password):
    response = client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_payroll_policy_returns_complete_defaults_and_persists_updates(client):
    test_client, data = client
    headers = _login(test_client, data["admin_email"], data["password"])

    defaults = test_client.get(
        "/api/v1/settings/payroll-policy", headers=headers
    )

    assert defaults.status_code == 200
    assert defaults.json()["wageModel"] == "Monthly"
    assert defaults.json()["defaultWage"] == 0
    assert defaults.json()["lateDeductionType"] == "Per Minute"
    assert defaults.json()["halfDayDeductionType"] == "Half Day Wage"
    assert defaults.json()["absenceDeductionType"] == "Full Day Wage"
    assert defaults.json()["overtimeMultiplier"] == 1
    assert all(
        value is False
        for key, value in defaults.json().items()
        if key.endswith("Enabled") or key.endswith("Deduction")
    )

    updated = {**defaults.json(), "wageModel": "Hourly", "defaultWage": 125}
    saved = test_client.put(
        "/api/v1/settings/payroll-policy", headers=headers, json=updated
    )
    assert saved.status_code == 200
    assert saved.json()["wageModel"] == "Hourly"
    assert saved.json()["defaultWage"] == 125

    fetched = test_client.get(
        "/api/v1/settings/payroll-policy", headers=headers
    )
    assert fetched.json() == saved.json()


def test_employee_cannot_read_payroll_policy(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])

    response = test_client.get(
        "/api/v1/settings/payroll-policy", headers=headers
    )

    assert response.status_code == 403


def test_employee_cannot_generate_company_code(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])

    response = test_client.post(
        "/api/v1/settings/company-code",
        headers=headers,
    )

    assert response.status_code == 403


def test_organization_state_and_country_can_be_completed_for_existing_company(client):
    test_client, data = client
    headers = _login(test_client, data["admin_email"], data["password"])
    settings = test_client.get("/api/v1/settings/organization", headers=headers)
    assert settings.status_code == 200
    assert settings.json()["country"] == ""

    saved = test_client.patch(
        "/api/v1/settings/organization",
        headers=headers,
        json={
            **settings.json(),
            "country": "India",
            "state": "Karnataka",
            "organizationEmail": "admin@example.com",
            "phone": "+91 9876543210",
            "address": "Bengaluru",
            "timezone": "Asia/Kolkata",
            "currency": "INR",
            "dateFormat": "DD/MM/YYYY",
        },
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["country"] == "India"
    assert saved.json()["state"] == "Karnataka"


def test_attendance_policy_can_be_saved_and_read_back(client):
    test_client, data = client
    headers = _login(test_client, data["admin_email"], data["password"])
    policy = {
        "workStartTime": "09:00",
        "workEndTime": "17:00",
        "gracePeriodMinutes": 5,
        "lateThresholdMinutes": 15,
        "minimumWorkingHours": 8,
        "halfDayHours": 4,
        "earlyCheckoutAllowed": False,
        "overtimeEnabled": False,
        "overtimeAfterMinutes": 0,
        "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    }

    saved = test_client.put(
        "/api/v1/settings/attendance-policy",
        headers=headers,
        json=policy,
    )

    assert saved.status_code == 200
    assert saved.json() == policy
    fetched = test_client.get(
        "/api/v1/settings/attendance-policy",
        headers=headers,
    )
    assert fetched.status_code == 200
    assert fetched.json() == policy
