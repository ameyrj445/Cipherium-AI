import pytest

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_login_default_student(client):
    response = client.post(
        "/auth/login",
        json={"email": "student@cipherium.ai", "password": "cipherium123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "student@cipherium.ai"

def test_login_invalid_password(client):
    response = client.post(
        "/auth/login",
        json={"email": "student@cipherium.ai", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_register_and_login_new_user(client):
    reg_response = client.post(
        "/auth/register",
        json={
            "name": "Jane Developer",
            "email": "jane@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    assert reg_data["email"] == "jane@example.com"
    assert "access_token" in reg_data

    # Verify login works
    login_response = client.post(
        "/auth/login",
        json={"email": "jane@example.com", "password": "SecurePassword123!"}
    )
    assert login_response.status_code == 200

def test_duplicate_registration_fails(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Alex Duplicate",
            "email": "student@cipherium.ai",
            "password": "somepassword"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_get_current_user_profile(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student@cipherium.ai"
    assert data["role"] == "student"

def test_get_profile_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code in [401, 403]
