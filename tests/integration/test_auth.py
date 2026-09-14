"""Integration tests for authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRegistration:
    async def test_register_success(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "newuser@test.com", "full_name": "New User", "password": "password1"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@test.com"
        assert "hashed_password" not in data
        assert "password" not in data

    async def test_register_duplicate_email(self, client: AsyncClient) -> None:
        payload = {"email": "dup@test.com", "full_name": "Dup", "password": "password1"}
        await client.post("/api/v1/auth/register", json=payload)
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "USER_ALREADY_EXISTS"

    async def test_register_weak_password(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "weak@test.com", "full_name": "Weak", "password": "nodigit"},
        )
        assert resp.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "full_name": "X", "password": "pass1234"},
        )
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={"email": "login@test.com", "full_name": "Login User", "password": "password1"},
        )
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "login@test.com", "password": "password1"},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()
        assert resp.json()["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={"email": "wrongpass@test.com", "full_name": "X", "password": "password1"},
        )
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "wrongpass@test.com", "password": "badpassword1"},
        )
        assert resp.status_code == 401
        assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"

    async def test_login_nonexistent_user(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "password1"},
        )
        assert resp.status_code == 401


class TestMe:
    async def test_me_returns_user(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={"email": "me@test.com", "full_name": "Me User", "password": "password1"},
        )
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "me@test.com", "password": "password1"},
        )
        token = login_resp.json()["access_token"]

        resp = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@test.com"

    async def test_me_without_token_returns_401(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401
