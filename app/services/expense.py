"""Expense service — business logic."""
from __future__ import annotations

import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CategoryNotFoundError, ExpenseNotFoundError
from app.models.expense import Expense
from app.repositories.category import CategoryRepository
from app.repositories.expense import ExpenseFilters, ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, PaginatedExpenses


class ExpenseService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ExpenseRepository(session)
        self._cat_repo = CategoryRepository(session)

    async def list_expenses(
        self, user_id: int, filters: ExpenseFilters
    ) -> PaginatedExpenses:
        items, total = await self._repo.list_paginated(user_id, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 1
        return PaginatedExpenses(
            items=items,  # type: ignore[arg-type]
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )

    async def get_expense(self, expense_id: int, user_id: int) -> Expense:
        expense = await self._repo.get_by_id(expense_id, user_id)
        if expense is None:
            raise ExpenseNotFoundError()
        return expense

    async def create_expense(self, user_id: int, data: ExpenseCreate) -> Expense:
        if data.category_id is not None:
            cat = await self._cat_repo.get_by_id(data.category_id, user_id)
            if cat is None:
                raise CategoryNotFoundError()
        return await self._repo.create(
            user_id=user_id,
            title=data.title,
            description=data.description,
            amount=data.amount,
            currency=data.currency,
            category_id=data.category_id,
            expense_date=data.expense_date,
            payment_method=data.payment_method,
            notes=data.notes,
        )

    async def update_expense(
        self, expense_id: int, user_id: int, data: ExpenseUpdate
    ) -> Expense:
        expense = await self._repo.get_by_id(expense_id, user_id)
        if expense is None:
            raise ExpenseNotFoundError()
        if data.category_id is not None:
            cat = await self._cat_repo.get_by_id(data.category_id, user_id)
            if cat is None:
                raise CategoryNotFoundError()
        updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        return await self._repo.update(expense, **updates)

    async def delete_expense(self, expense_id: int, user_id: int) -> None:
        expense = await self._repo.get_by_id(expense_id, user_id)
        if expense is None:
            raise ExpenseNotFoundError()
        await self._repo.delete(expense)
