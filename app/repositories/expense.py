"""Expense repository: all DB access for expenses."""
from __future__ import annotations

import math
from datetime import date
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense


class ExpenseFilters:
    """Value object for expense query filters."""

    def __init__(
        self,
        category_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        payment_method: Optional[str] = None,
        sort_by: str = "expense_date",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> None:
        self.category_id = category_id
        self.date_from = date_from
        self.date_to = date_to
        self.min_amount = min_amount
        self.max_amount = max_amount
        self.payment_method = payment_method
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), 100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class ExpenseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _apply_filters(self, stmt: Any, user_id: int, filters: ExpenseFilters) -> Any:
        stmt = stmt.where(Expense.user_id == user_id)
        if filters.category_id is not None:
            stmt = stmt.where(Expense.category_id == filters.category_id)
        if filters.date_from is not None:
            stmt = stmt.where(Expense.expense_date >= filters.date_from)
        if filters.date_to is not None:
            stmt = stmt.where(Expense.expense_date <= filters.date_to)
        if filters.min_amount is not None:
            stmt = stmt.where(Expense.amount >= filters.min_amount)
        if filters.max_amount is not None:
            stmt = stmt.where(Expense.amount <= filters.max_amount)
        if filters.payment_method is not None:
            stmt = stmt.where(Expense.payment_method == filters.payment_method)
        return stmt

    def _apply_sort(self, stmt: Any, filters: ExpenseFilters) -> Any:
        sort_col_map = {
            "expense_date": Expense.expense_date,
            "amount": Expense.amount,
            "created_at": Expense.created_at,
        }
        col = sort_col_map.get(filters.sort_by, Expense.expense_date)
        return stmt.order_by(col.desc() if filters.sort_order == "desc" else col.asc())

    async def list_paginated(
        self, user_id: int, filters: ExpenseFilters
    ) -> tuple[list[Expense], int]:
        """Return (items, total_count) for the given filters."""
        base = select(Expense)
        base = self._apply_filters(base, user_id, filters)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = self._apply_sort(base, filters)
        items_stmt = items_stmt.offset(filters.offset).limit(filters.page_size)
        items = list((await self._session.execute(items_stmt)).scalars().all())

        return items, total

    async def list_all_for_export(self, user_id: int, filters: ExpenseFilters) -> list[Expense]:
        base = select(Expense)
        base = self._apply_filters(base, user_id, filters)
        items_stmt = self._apply_sort(base, filters)
        result = await self._session.execute(items_stmt)
        return list(result.scalars().all())

    async def get_by_id(self, expense_id: int, user_id: int) -> Expense | None:
        result = await self._session.execute(
            select(Expense).where(
                Expense.id == expense_id,
                Expense.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, **kwargs: Any) -> Expense:
        expense = Expense(user_id=user_id, **kwargs)
        self._session.add(expense)
        await self._session.flush()
        await self._session.refresh(expense)
        return expense

    async def update(self, expense: Expense, **kwargs: Any) -> Expense:
        for key, value in kwargs.items():
            if value is not None:
                setattr(expense, key, value)
        await self._session.flush()
        await self._session.refresh(expense)
        return expense

    async def delete(self, expense: Expense) -> None:
        await self._session.delete(expense)
        await self._session.flush()

    # ── Aggregates ────────────────────────────────────────────────────────────

    async def total_by_user(self, user_id: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Expense.amount), Decimal("0"))).where(
                Expense.user_id == user_id
            )
        )
        return result.scalar_one()

    async def largest_by_user(self, user_id: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.max(Expense.amount), Decimal("0"))).where(
                Expense.user_id == user_id
            )
        )
        return result.scalar_one()

    async def average_by_user(self, user_id: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.avg(Expense.amount), Decimal("0"))).where(
                Expense.user_id == user_id
            )
        )
        return result.scalar_one()

    async def monthly_total(self, user_id: int, year: int, month: int) -> Decimal:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Expense.amount), Decimal("0"))).where(
                Expense.user_id == user_id,
                func.extract("year", Expense.expense_date) == year,
                func.extract("month", Expense.expense_date) == month,
            )
        )
        return result.scalar_one()

    async def monthly_by_category(
        self, user_id: int, year: int, month: int
    ) -> list[tuple[int | None, Decimal]]:
        """Return list of (category_id, total_amount) for the given month."""
        result = await self._session.execute(
            select(Expense.category_id, func.sum(Expense.amount).label("total"))
            .where(
                Expense.user_id == user_id,
                func.extract("year", Expense.expense_date) == year,
                func.extract("month", Expense.expense_date) == month,
            )
            .group_by(Expense.category_id)
        )
        return [(row.category_id, row.total) for row in result.all()]

    async def all_by_category(self, user_id: int) -> list[tuple[int | None, Decimal]]:
        """Return list of (category_id, total_amount) for all time."""
        result = await self._session.execute(
            select(Expense.category_id, func.sum(Expense.amount).label("total"))
            .where(Expense.user_id == user_id)
            .group_by(Expense.category_id)
        )
        return [(row.category_id, row.total) for row in result.all()]
