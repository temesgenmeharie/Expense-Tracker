from __future__ import annotations
import pytest
from httpx import AsyncClient

class TestExpenseExport:
    async def test_export_csv_success(self, client: AsyncClient) -> None:
        # 1. Register and login
        reg_resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "export@test.com", "full_name": "Export User", "password": "password1"},
        )
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "export@test.com", "password": "password1"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add some expenses
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Coffee", "amount": "4.50", "currency": "USD", "expense_date": "2026-09-01"},
        )
        await client.post(
            "/api/v1/expenses",
            headers=headers,
            json={"title": "Laptop", "amount": "1200.00", "currency": "USD", "expense_date": "2026-09-02"},
        )

        # 3. Export
        resp = await client.get("/api/v1/expenses/export", headers=headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "text/csv; charset=utf-8"
        
        csv_content = resp.text
        assert "ID,Date,Title,Amount,Currency,Category ID,Payment Method,Description,Notes" in csv_content
        assert "Coffee" in csv_content
        assert "4.50" in csv_content
        assert "Laptop" in csv_content
        assert "1200.00" in csv_content
