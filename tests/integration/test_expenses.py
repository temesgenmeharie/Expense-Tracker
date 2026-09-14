"""Integration tests for expense CRUD, filtering, and authorization."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import register_and_login


class TestExpenseCRUD:
    async def test_create_expense(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_create@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={
                "title": "Coffee",
                "amount": "5.50",
                "currency": "USD",
                "expense_date": "2026-09-01",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Coffee"
        assert data["amount"] == "5.50"

    async def test_get_expense(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_get@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Lunch", "amount": "12.00", "currency": "USD", "expense_date": "2026-09-01"},
        )
        expense_id = create_resp.json()["id"]
        resp = await client.get(f"/api/v1/expenses/{expense_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == expense_id

    async def test_update_expense(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_upd@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Old Title", "amount": "10.00", "currency": "USD", "expense_date": "2026-09-01"},
        )
        expense_id = create_resp.json()["id"]
        resp = await client.patch(
            f"/api/v1/expenses/{expense_id}",
            headers=headers,
            json={"title": "New Title", "amount": "15.00"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"
        assert resp.json()["amount"] == "15.00"

    async def test_delete_expense(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_del@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "To Delete", "amount": "7.00", "currency": "USD", "expense_date": "2026-09-01"},
        )
        expense_id = create_resp.json()["id"]
        del_resp = await client.delete(f"/api/v1/expenses/{expense_id}", headers=headers)
        assert del_resp.status_code == 204
        get_resp = await client.get(f"/api/v1/expenses/{expense_id}", headers=headers)
        assert get_resp.status_code == 404

    async def test_list_expenses_pagination(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_list@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        for i in range(5):
            await client.post(
                "/api/v1/expenses",
                headers=headers,
                json={"title": f"Expense {i}", "amount": "10.00", "currency": "USD", "expense_date": "2026-09-01"},
            )
        resp = await client.get("/api/v1/expenses?page=1&page_size=3", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 3
        assert data["total"] == 5
        assert data["total_pages"] == 2


class TestExpenseAuthorization:
    async def test_cannot_access_other_users_expense(self, client: AsyncClient) -> None:
        token_a = await register_and_login(client, "user_a_exp@test.com")
        token_b = await register_and_login(client, "user_b_exp@test.com")

        # User A creates an expense
        create_resp = await client.post(
            "/api/v1/expenses",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "A's expense", "amount": "100.00", "currency": "USD", "expense_date": "2026-09-01"},
        )
        expense_id = create_resp.json()["id"]

        # User B tries to access it
        resp = await client.get(
            f"/api/v1/expenses/{expense_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp.status_code == 404

    async def test_unauthenticated_request_returns_401(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/expenses")
        assert resp.status_code == 401


class TestExpenseFiltering:
    async def test_filter_by_min_amount(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_filter@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        for amount in ["10.00", "50.00", "200.00"]:
            await client.post(
                "/api/v1/expenses",
                headers=headers,
                json={"title": f"Exp {amount}", "amount": amount, "currency": "USD", "expense_date": "2026-09-01"},
            )
        resp = await client.get("/api/v1/expenses?min_amount=50", headers=headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(float(i["amount"]) >= 50 for i in items)

    async def test_filter_by_payment_method(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "exp_pm@test.com")
        headers = {"Authorization": f"Bearer {token}"}
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Cash buy", "amount": "5.00", "currency": "USD", "expense_date": "2026-09-01", "payment_method": "cash"},
        )
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Card buy", "amount": "5.00", "currency": "USD", "expense_date": "2026-09-01", "payment_method": "credit_card"},
        )
        resp = await client.get("/api/v1/expenses?payment_method=cash", headers=headers)
        items = resp.json()["items"]
        assert all(i["payment_method"] == "cash" for i in items)
