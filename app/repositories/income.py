"""Income repository: all DB access for incomes."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import asc, desc, func, select
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
        # Filtering
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        source_search: Optional[str] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        # Sorting
        sort_by: str = "income_date",
        sort_order: str = "desc",
    ) -> tuple[list[Income], int]:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        base = select(Income).where(Income.user_id == user_id)

        # Filters
        if date_from:
            base = base.where(Income.income_date >= date_from)
        if date_to:
            base = base.where(Income.income_date <= date_to)
        if source_search:
            base = base.where(Income.source.ilike(f"%{source_search}%"))
        if min_amount is not None:
            base = base.where(Income.amount >= min_amount)
        if max_amount is not None:
            base = base.where(Income.amount <= max_amount)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        # Sorting
        sort_col = {
            "income_date": Income.income_date,
            "amount":      Income.amount,
            "source":      Income.source,
            "created_at":  Income.created_at,
        }.get(sort_by, Income.income_date)
        order = asc(sort_col) if sort_order == "asc" else desc(sort_col)

        items_stmt = base.order_by(order).offset(offset).limit(page_size)
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
