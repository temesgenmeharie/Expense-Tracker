"""Integration tests for categories."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import register_and_login


class TestCategories:
    async def test_default_categories_created_on_register(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_default@test.com")
        resp = await client.get(
            "/api/v1/categories", headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        names = [c["name"] for c in resp.json()]
        assert "Food" in names
        assert "Transportation" in names
        assert len(names) == 10  # 10 default categories

    async def test_create_custom_category(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_create@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.post(
            "/api/v1/categories", headers=headers, json={"name": "Pets"}
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Pets"

    async def test_duplicate_category_rejected(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_dup@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        await client.post("/api/v1/categories", headers=headers, json={"name": "Gym"})
        resp = await client.post(
            "/api/v1/categories", headers=headers, json={"name": "Gym"}
        )
        assert resp.status_code == 409

    async def test_rename_category(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_rename@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post(
            "/api/v1/categories", headers=headers, json={"name": "Old"}
        )
        cat_id = create_resp.json()["id"]
        resp = await client.patch(
            f"/api/v1/categories/{cat_id}", headers=headers, json={"name": "New"}
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New"

    async def test_delete_empty_category(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_del@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post(
            "/api/v1/categories", headers=headers, json={"name": "Temp"}
        )
        cat_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/v1/categories/{cat_id}", headers=headers)
        assert resp.status_code == 204

    async def test_cannot_delete_category_with_expenses(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "cat_inuse@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        cat_resp = await client.post(
            "/api/v1/categories", headers=headers, json={"name": "InUse"}
        )
        cat_id = cat_resp.json()["id"]
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={
                "title": "Linked expense",
                "amount": "10.00",
                "currency": "USD",
                "expense_date": "2026-09-01",
                "category_id": cat_id,
            },
        )
        resp = await client.delete(f"/api/v1/categories/{cat_id}", headers=headers)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "CATEGORY_IN_USE"
