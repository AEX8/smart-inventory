import pytest


def test_register_success(client):
    res = client.post("/auth/register", json={
        "email": "newuser@test.com",
        "password": "password123",
        "role": "warehouse_staff",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "warehouse_staff"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client, admin_user):
    res = client.post("/auth/register", json={
        "email": "admin@test.com",
        "password": "password123",
        "role": "warehouse_staff",
    })
    assert res.status_code == 409


def test_register_invalid_role(client):
    res = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "password123",
        "role": "superuser",
    })
    assert res.status_code == 422


def test_register_password_too_long(client):
    res = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "a" * 73,
        "role": "warehouse_staff",
    })
    assert res.status_code == 422


def test_login_success(client, admin_user):
    res = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "password123",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"


def test_login_wrong_password(client, admin_user):
    res = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_nonexistent_user(client):
    res = client.post("/auth/login", json={
        "email": "nobody@test.com",
        "password": "password123",
    })
    assert res.status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_me_unauthenticated(client):
    res = client.get("/auth/me")
    assert res.status_code == 403


def test_me_invalid_token(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert res.status_code == 401