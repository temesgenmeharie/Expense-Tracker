from __future__ import annotations
import pytest
from httpx import AsyncClient

class TestRefreshToken:
    async def test_refresh_token_success(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/auth/register",
            json={"email": "refresh@test.com", "full_name": "R User", "password": "password1"},
        )
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "refresh@test.com", "password": "password1"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()
        assert "refresh_token" in resp.json()

    async def test_refresh_token_invalid(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "not_a_valid_token"},
        )
        assert resp.status_code == 401
