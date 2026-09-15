"""Budget service — business logic."""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BudgetAlreadyExistsError, BudgetNotFoundError
from app.models.budget import Budget
from app.repositories.budget import BudgetRepository
from app.repositories.category import CategoryRepository
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetWithSpend


class BudgetService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo     = BudgetRepository(session)
        self._cat_repo = CategoryRepository(session)

    async def list_budgets(self, user_id: int, year: int, month: int) -> list[BudgetWithSpend]:
        """Return all budgets for a given month, enriched with spend data."""
        budgets = await self._repo.list_by_period(user_id, year, month)

        # Fetch all user categories for name lookup
        cats = await self._cat_repo.list_by_user(user_id)
        cat_map = {c.id: c.name for c in cats}

        result: list[BudgetWithSpend] = []
        for b in budgets:
            spent = await self._repo.get_spend(user_id, year, month, b.category_id)
            remaining = b.limit_amount - spent
            pct = float((spent / b.limit_amount) * 100) if b.limit_amount else 0.0
            cat_name = cat_map.get(b.category_id, "Uncategorised") if b.category_id else "Overall"
            result.append(
                BudgetWithSpend(
                    id=b.id,
                    user_id=b.user_id,
                    category_id=b.category_id,
                    year=b.year,
                    month=b.month,
                    limit_amount=b.limit_amount,
                    created_at=b.created_at,
                    updated_at=b.updated_at,
                    category_name=cat_name,
                    spent=spent,
                    remaining=remaining,
                    percentage=round(pct, 1),
                    is_over=spent > b.limit_amount,
                )
            )
        return result

    async def create_budget(self, user_id: int, data: BudgetCreate) -> Budget:
        # Prevent duplicates for same user/category/period
        existing = await self._repo.list_by_period(user_id, data.year, data.month)
        for b in existing:
            if b.category_id == data.category_id:
                raise BudgetAlreadyExistsError()
        return await self._repo.create(
            user_id=user_id,
            category_id=data.category_id,
            year=data.year,
            month=data.month,
            limit_amount=data.limit_amount,
        )

    async def update_budget(self, budget_id: int, user_id: int, data: BudgetUpdate) -> Budget:
        budget = await self._repo.get_by_id(budget_id, user_id)
        if budget is None:
            raise BudgetNotFoundError()
        return await self._repo.update(budget, limit_amount=data.limit_amount)

    async def delete_budget(self, budget_id: int, user_id: int) -> None:
        budget = await self._repo.get_by_id(budget_id, user_id)
        if budget is None:
            raise BudgetNotFoundError()
        await self._repo.delete(budget)
