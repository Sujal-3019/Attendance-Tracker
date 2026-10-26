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
        "/api/v1/me/attendance/check-in", headers=employee_headers
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
