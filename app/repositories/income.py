"""Income repository: all DB access for incomes."""
from __future__ import annotations

from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income import Income


class IncomeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Income], int]:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        base = select(Income).where(Income.user_id == user_id)
        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = base.order_by(Income.income_date.desc()).offset(offset).limit(page_size)
        items = list((await self._session.execute(items_stmt)).scalars().all())

        return items, total

    async def get_by_id(self, income_id: int, user_id: int) -> Income | None:
        result = await self._session.execute(
            select(Income).where(
                Income.id == income_id,
                Income.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, **kwargs: Any) -> Income:
        income = Income(user_id=user_id, **kwargs)
        self._session.add(income)
        await self._session.flush()
        await self._session.refresh(income)
        return income

    async def update(self, income: Income, **kwargs: Any) -> Income:
        for key, value in kwargs.items():
            if value is not None:
                setattr(income, key, value)
        await self._session.flush()
        await self._session.refresh(income)
        return income

    async def delete(self, income: Income) -> None:
        await self._session.delete(income)
        await self._session.flush()

    async def total_by_user(self, user_id: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Income.amount), Decimal("0"))).where(
                Income.user_id == user_id
            )
        )
        return result.scalar_one()

    async def monthly_total(self, user_id: int, year: int, month: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Income.amount), Decimal("0"))).where(
                Income.user_id == user_id,
                func.extract("year", Income.income_date) == year,
                func.extract("month", Income.income_date) == month,
            )
        )
        return result.scalar_one()
