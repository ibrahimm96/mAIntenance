import pytest
from app import create_app, db


@pytest.fixture()
def client():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "JWT_SECRET_KEY": "test-secret"})
    with app.test_client() as client:
        yield client


def auth_headers(client):
    response = client.post("/api/auth/register", json={"name": "Test User", "email": "test@example.com", "password": "password123"})
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_vehicle(client, headers):
    response = client.post(
        "/api/vehicles",
        json={"year": 2014, "make": "BMW", "model": "328i", "current_mileage": 82000, "monthly_mileage": 900},
        headers=headers,
    )
    assert response.status_code == 201
    return response.get_json()["vehicle"]


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_register_login_and_me(client):
    headers = auth_headers(client)
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert "password_hash" not in response.get_json()["user"]

    bad_login = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert bad_login.status_code == 401


def test_vehicle_service_and_forecast_flow(client):
    headers = auth_headers(client)
    vehicle = create_vehicle(client, headers)
    forecast = client.get(f"/api/vehicles/{vehicle['id']}/forecast", headers=headers)
    assert forecast.status_code == 200
    assert any(item["status"] == "Needs history" for item in forecast.get_json()["items"])

    service = client.post(
        f"/api/vehicles/{vehicle['id']}/services",
        json={"service_type": "Oil change", "service_date": "2026-03-15", "service_mileage": 78000, "cost": 95},
        headers=headers,
    )
    assert service.status_code == 201
    updated = client.get(f"/api/vehicles/{vehicle['id']}/forecast", headers=headers).get_json()
    oil = next(item for item in updated["items"] if item["service_type"] == "Oil change")
    assert oil["due_mileage"] == 85500


def test_ownership_is_enforced(client):
    headers = auth_headers(client)
    vehicle = create_vehicle(client, headers)
    second = client.post("/api/auth/register", json={"name": "Other", "email": "other@example.com", "password": "password123"})
    other_headers = {"Authorization": f"Bearer {second.get_json()['access_token']}"}
    response = client.get(f"/api/vehicles/{vehicle['id']}", headers=other_headers)
    assert response.status_code == 403
