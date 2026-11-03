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
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert checked_in.status_code == 201
    duplicate = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
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


def test_admin_can_filter_attendance_by_date_and_employee(client):
    from datetime import date

    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert checked_in.status_code == 201

    response = test_client.get(
        "/api/v1/attendance",
        headers=admin_headers,
        params={
            "date": date.today().isoformat(),
            "employee_id": data["employee_id"],
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["employeeId"] == data["employee_id"]


def test_admin_can_clear_resolved_corrections_without_hiding_pending(client):
    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    assert test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    ).status_code == 201
    assert test_client.post(
        "/api/v1/me/attendance/check-out", headers=employee_headers
    ).status_code == 200
    correction = test_client.post(
        "/api/v1/me/attendance/corrections",
        headers=employee_headers,
        json={"event": "check_out", "reason": "Correct checkout time please"},
    )
    assert correction.status_code == 201
    correction_id = correction.json()["id"]

    pending_clear = test_client.post(
        "/api/v1/attendance/corrections/clear", headers=admin_headers
    )
    assert pending_clear.status_code == 200
    assert pending_clear.json()["archivedCount"] == 0
    assert len(
        test_client.get(
            "/api/v1/attendance/corrections", headers=admin_headers
        ).json()
    ) == 1

    approval = test_client.post(
        f"/api/v1/attendance/corrections/{correction_id}/approve",
        headers=admin_headers,
        json={"reviewReason": "Reviewed"},
    )
    assert approval.status_code == 200
    archived = test_client.post(
        "/api/v1/attendance/corrections/clear", headers=admin_headers
    )

    assert archived.status_code == 200
    assert archived.json()["archivedCount"] == 1
    assert test_client.get(
        "/api/v1/attendance/corrections", headers=admin_headers
    ).json() == []
    assert test_client.get(
        f"/api/v1/attendance/corrections/{correction_id}",
        headers=admin_headers,
    ).status_code == 200


def test_employee_is_marked_absent_after_grace_then_late_on_checkin(client, monkeypatch):
    from datetime import date, datetime, time, timedelta, timezone

    import app.services.attendance as attendance_service

    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    target_date = date.today()
    policy = {
        "workStartTime": "09:00",
        "gracePeriodMinutes": 15,
        "workingDays": [target_date.strftime("%A")],
    }
    clock = [datetime.combine(target_date, time(9, 15), tzinfo=timezone.utc)]
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (clock[0], policy),
    )

    at_deadline = test_client.get(
        "/api/v1/me/attendance", headers=employee_headers
    )
    assert at_deadline.status_code == 200
    assert at_deadline.json()["today"] is None

    clock[0] += timedelta(seconds=1)
    after_deadline = test_client.get(
        "/api/v1/me/attendance", headers=employee_headers
    )
    assert after_deadline.status_code == 200
    assert after_deadline.json()["today"]["status"] == "Absent"
    assert after_deadline.json()["today"]["checkIn"] is None

    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert checked_in.status_code == 201
    assert checked_in.json()["status"] == "Late"
    assert checked_in.json()["checkIn"] is not None


def test_checkin_at_grace_deadline_is_present(client, monkeypatch):
    from datetime import date, datetime, time, timezone

    import app.services.attendance as attendance_service

    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    target_date = date.today()
    policy = {
        "workStartTime": "09:00",
        "gracePeriodMinutes": 15,
        "workingDays": [target_date.strftime("%A")],
    }
    clock = datetime.combine(target_date, time(9, 15), tzinfo=timezone.utc)
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (clock, policy),
    )

    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )

    assert checked_in.status_code == 201
    assert checked_in.json()["status"] == "Present"


def test_checkin_requires_location_inside_an_active_office(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])

    outside = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=headers,
        json={"latitude": 12.98, "longitude": 77.6, "accuracy": 5},
    )
    assert outside.status_code == 403
    assert "geofence" in outside.json()["detail"]

    inside = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert inside.status_code == 201


def test_checkin_requires_an_active_office_location(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    location = test_client.get(
        "/api/v1/settings/work-locations", headers=admin_headers
    ).json()[0]
    deactivated = test_client.patch(
        f"/api/v1/settings/work-locations/{location['id']}/status",
        headers=admin_headers,
        json={"status": "Inactive"},
    )
    assert deactivated.status_code == 200

    response = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=headers,
        json={"latitude": 12.9716, "longitude": 77.5946, "accuracy": 5},
    )
    assert response.status_code == 409


def test_checkin_accepts_a_different_active_office(client):
    test_client, data = client
    headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    original = test_client.get(
        "/api/v1/settings/work-locations", headers=admin_headers
    ).json()[0]
    new_office = test_client.post(
        "/api/v1/settings/work-locations",
        headers=admin_headers,
        json={
            "name": "Second Office",
            "address": "Pune Office",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "radiusMeters": 200,
            "primary": False,
        },
    )
    assert new_office.status_code == 201
    deactivated = test_client.patch(
        f"/api/v1/settings/work-locations/{original['id']}/status",
        headers=admin_headers,
        json={"status": "Inactive"},
    )
    assert deactivated.status_code == 200

    check_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=headers,
        json={"latitude": 18.5204, "longitude": 73.8567, "accuracy": 5},
    )
    assert check_in.status_code == 201


def test_hybrid_remote_days_do_not_require_gps(client, monkeypatch):
    from datetime import datetime, timezone

    import app.services.attendance as attendance_service

    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={
            "workMode": "Hybrid",
            "location": "Main Office",
            "hybridOfficeDays": ["Monday"],
        },
    )
    assert updated.status_code == 200, updated.text
    local_now = datetime(2026, 11, 3, 8, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (
            local_now,
            {"workStartTime": "09:00", "workingDays": ["Tuesday"]},
        ),
    )

    history = test_client.get("/api/v1/me/attendance", headers=employee_headers)
    assert history.status_code == 200
    assert history.json()["checkInRequiresLocation"] is False
    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={},
    )
    assert checked_in.status_code == 201


def test_hybrid_office_days_still_require_the_office_geofence(client, monkeypatch):
    from datetime import datetime, timezone

    import app.services.attendance as attendance_service

    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={
            "workMode": "Hybrid",
            "location": "Main Office",
            "hybridOfficeDays": ["Monday"],
        },
    )
    assert updated.status_code == 200, updated.text
    local_now = datetime(2026, 11, 2, 8, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(
        attendance_service,
        "attendance_context",
        lambda _db, _organization_id, now=None: (
            local_now,
            {"workStartTime": "09:00", "workingDays": ["Monday"]},
        ),
    )
    history = test_client.get("/api/v1/me/attendance", headers=employee_headers)
    assert history.status_code == 200
    assert history.json()["checkInRequiresLocation"] is True
    denied = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={"latitude": 12.98, "longitude": 77.6, "accuracy": 5},
    )
    assert denied.status_code == 403


def test_remote_employee_can_check_in_without_location(client):
    test_client, data = client
    employee_headers = _login(test_client, data["employee_email"], data["password"])
    admin_headers = _login(test_client, data["admin_email"], data["password"])
    updated = test_client.patch(
        f"/api/v1/employees/{data['employee_id']}",
        headers=admin_headers,
        json={"workMode": "Remote", "location": "Remote"},
    )
    assert updated.status_code == 200, updated.text

    history = test_client.get("/api/v1/me/attendance", headers=employee_headers)
    assert history.status_code == 200
    assert history.json()["checkInRequiresLocation"] is False
    checked_in = test_client.post(
        "/api/v1/me/attendance/check-in",
        headers=employee_headers,
        json={},
    )
    assert checked_in.status_code == 201


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
    assert response.json()["unmarked"] == 0
