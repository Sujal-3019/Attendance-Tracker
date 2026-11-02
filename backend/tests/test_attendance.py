def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_attendance_state_transitions_and_audited_reset(client):
    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])

    before_checkin = test_client.post(
        "/api/v1/me/attendance/check-out", headers=employee_headers
    )
    assert before_checkin.status_code == 409
    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in", headers=employee_headers
    )
    assert checked_in.status_code == 201
    duplicate = test_client.post(
        "/api/v1/me/attendance/check-in", headers=employee_headers
    )
    assert duplicate.status_code == 409
    checked_out = test_client.post(
        "/api/v1/me/attendance/check-out", headers=employee_headers
    )
    assert checked_out.status_code == 200
    assert checked_out.json()["checkOut"] is not None

    request = test_client.post(
        "/api/v1/me/attendance/corrections",
        headers=employee_headers,
        json={"event": "check_out", "reason": "I made an incorrect checkout"},
    )
    assert request.status_code == 201
    correction_id = request.json()["id"]
    admin_notifications = test_client.get(
        "/api/v1/notifications", headers=admin_headers
    )
    assert admin_notifications.status_code == 200
    correction_notification = next(
        item
        for item in admin_notifications.json()["items"]
        if item["category"] == "ATTENDANCE_CORRECTION"
    )
    assert correction_notification["title"] == "Attendance correction request"
    assert correction_notification["actionUrl"] == (
        f"/attendance?correction={correction_id}"
    )
    assert correction_notification["status"] == "Unread"
    pending = test_client.get(
        "/api/v1/me/attendance", headers=employee_headers
    )
    assert pending.status_code == 200
    assert pending.json()["pendingCorrection"]["id"] == correction_id
    assert pending.json()["today"]["checkOut"] is not None
    duplicate_request = test_client.post(
        "/api/v1/me/attendance/corrections",
        headers=employee_headers,
        json={"event": "check_out", "reason": "Please reset checkout again"},
    )
    assert duplicate_request.status_code == 409
    approval = test_client.post(
        f"/api/v1/attendance/corrections/{correction_id}/approve",
        headers=admin_headers,
        json={"reviewReason": "Verified and corrected"},
    )
    assert approval.status_code == 200
    history = test_client.get("/api/v1/me/attendance", headers=employee_headers)
    assert history.status_code == 200
    assert history.json()["today"]["checkOut"] is None
    assert history.json()["pendingCorrection"] is None


def test_employee_attendance_is_scoped_to_authenticated_employee(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])
    response = test_client.get("/api/v1/me/attendance", headers=headers)
    assert response.status_code == 200
    assert response.json()["today"] is None
    assert response.json()["history"] == []


def test_attendance_summary_uses_organization_local_date(client, monkeypatch):
    from datetime import datetime
    from zoneinfo import ZoneInfo

    import app.services.attendance as attendance_service

    test_client, data = client
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    local_now = datetime(2026, 1, 2, 0, 30, tzinfo=ZoneInfo("Asia/Tokyo"))
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (
            local_now if now is None else now.astimezone(ZoneInfo("Asia/Tokyo")),
            {"workingDays": ["Friday"]},
        ),
    )

    response = test_client.get("/api/v1/attendance/summary", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["date"] == "2026-01-02"
    assert response.json()["unmarked"] == 1
