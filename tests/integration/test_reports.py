"""Integration tests for reports endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import register_and_login


class TestReports:
    async def test_dashboard_empty(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "report_empty@test.com")
        resp = await client.get(
            "/api/v1/reports/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert float(data["total_income"]) == 0.0
        assert float(data["total_expenses"]) == 0.0
        assert float(data["balance"]) == 0.0

    async def test_dashboard_with_data(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "report_data@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Add income
        await client.post(
            "/api/v1/incomes",
            headers=headers,
            json={"source": "Salary", "amount": "5000.00", "currency": "USD", "income_date": "2026-09-01"},
        )
        # Add expenses
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Rent", "amount": "1500.00", "currency": "USD", "expense_date": "2026-09-01"},
        )
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Food", "amount": "300.00", "currency": "USD", "expense_date": "2026-09-05"},
        )

        resp = await client.get("/api/v1/reports/dashboard", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert float(data["total_income"]) == 5000.0
        assert float(data["total_expenses"]) == 1800.0
        assert float(data["balance"]) == 3200.0
        assert float(data["largest_expense"]) == 1500.0

    async def test_monthly_report(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "report_monthly@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Sep expense", "amount": "200.00", "currency": "USD", "expense_date": "2026-09-10"},
        )
        await client.post(
            "/api/v1/incomes",
            headers=headers,
            json={"source": "Freelance", "amount": "1000.00", "currency": "USD", "income_date": "2026-09-15"},
        )

        resp = await client.get(
            "/api/v1/reports/monthly?year=2026&month=9", headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["month_name"] == "September"
        assert float(data["expenses"]) == 200.0
        assert float(data["income"]) == 1000.0
        assert float(data["balance"]) == 800.0

    async def test_monthly_report_invalid_month(self, client: AsyncClient) -> None:
        token = await register_and_login(client, "report_badmonth@test.com")
        resp = await client.get(
            "/api/v1/reports/monthly?year=2026&month=13",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422
