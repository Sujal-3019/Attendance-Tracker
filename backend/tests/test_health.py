from fastapi.testclient import TestClient

from app.main import app


def test_health_is_available_without_database() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_localhost_and_loopback_origins_are_allowed() -> None:
    with TestClient(app) as client:
        for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
            response = client.options(
                "/api/v1/me/attendance",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "authorization",
                },
            )
            assert response.status_code == 200
            assert response.headers["access-control-allow-origin"] == origin
