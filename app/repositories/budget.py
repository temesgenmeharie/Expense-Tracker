"""Budget repository: all DB access for budgets."""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.expense import Expense


class BudgetRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(self, user_id: int) -> list[Budget]:
        result = await self._session.execute(
            select(Budget)
            .where(Budget.user_id == user_id)
            .order_by(Budget.year.desc(), Budget.month.desc(), Budget.id.asc())
        )
        return list(result.scalars().all())

    async def list_by_period(self, user_id: int, year: int, month: int) -> list[Budget]:
        result = await self._session.execute(
            select(Budget).where(
                Budget.user_id == user_id,
                Budget.year == year,
                Budget.month == month,
            )
        )
        return list(result.scalars().all())

    async def get_by_id(self, budget_id: int, user_id: int) -> Budget | None:
        result = await self._session.execute(
            select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, **kwargs: Any) -> Budget:
        budget = Budget(user_id=user_id, **kwargs)
        self._session.add(budget)
        await self._session.flush()
        await self._session.refresh(budget)
        return budget

    async def update(self, budget: Budget, **kwargs: Any) -> Budget:
        for key, value in kwargs.items():
            setattr(budget, key, value)
        await self._session.flush()
        await self._session.refresh(budget)
        return budget

    async def delete(self, budget: Budget) -> None:
        await self._session.delete(budget)
        await self._session.flush()

    async def get_spend(self, user_id: int, year: int, month: int, category_id: int | None) -> Decimal:
        """Sum of expenses for this user/period/category."""
        stmt = select(
            func.coalesce(func.sum(Expense.amount), Decimal("0"))
        ).where(
            Expense.user_id == user_id,
            func.extract("year",  Expense.expense_date) == year,
            func.extract("month", Expense.expense_date) == month,
        )
        if category_id is not None:
            stmt = stmt.where(Expense.category_id == category_id)
        result = await self._session.execute(stmt)
        return result.scalar_one()
