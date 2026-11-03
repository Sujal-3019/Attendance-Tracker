def _login(client, email, password):
    response = client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_attendance_chart_uses_persisted_records(client):
    test_client, data = client
    employee_headers = _login(
        test_client, data["employee_email"], data["password"]
    )
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    check_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert check_in.status_code == 201

    response = test_client.get(
        "/api/v1/dashboard/attendance-chart", headers=admin_headers
    )

    assert response.status_code == 200
    chart = response.json()
    assert len(chart["items"]) == 7
    today = next(item for item in chart["items"] if item["date"] == check_in.json()["date"])
    assert today["present"] == 1
    assert today["late"] == 0
    assert today["absent"] is None


def test_dashboard_absent_count_waits_for_grace_period(client, monkeypatch):
    from datetime import date, datetime, time, timezone

    import app.api.v1.endpoints.dashboard as dashboard_endpoint

    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    target_date = date.today()
    fixed_now = datetime.combine(target_date, time(9, 15), tzinfo=timezone.utc)
    monkeypatch.setattr(
        dashboard_endpoint,
        "attendance_context",
        lambda _db, _organization_id: (
            fixed_now,
            {
                "workingDays": [target_date.strftime("%A")],
                "workStartTime": "09:00",
                "gracePeriodMinutes": 15,
            },
        ),
    )

    before_workday_end = test_client.get(
        "/api/v1/dashboard/summary", headers=admin_headers
    )
    assert before_workday_end.status_code == 200
    assert before_workday_end.json()["absentToday"] is None

    fixed_now = datetime.combine(
        target_date, time(9, 15, 1), tzinfo=timezone.utc
    )
    response = test_client.get("/api/v1/dashboard/summary", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["absentToday"] == 1
