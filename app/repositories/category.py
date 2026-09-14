"""Category repository: all DB access for categories."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category


class CategoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, category_id: int, user_id: int) -> Category | None:
        result = await self._session.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str, user_id: int) -> Category | None:
        result = await self._session.execute(
            select(Category).where(
                Category.name == name,
                Category.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int) -> list[Category]:
        result = await self._session.execute(
            select(Category).where(Category.user_id == user_id).order_by(Category.name)
        )
        return list(result.scalars().all())

    async def create(self, user_id: int, name: str) -> Category:
        category = Category(user_id=user_id, name=name)
        self._session.add(category)
        await self._session.flush()
        await self._session.refresh(category)
        return category

    async def update(self, category: Category, name: str) -> Category:
        category.name = name
        await self._session.flush()
        await self._session.refresh(category)
        return category

    async def delete(self, category: Category) -> None:
        await self._session.delete(category)
        await self._session.flush()

    async def has_expenses(self, category_id: int, user_id: int) -> bool:
        """Return True if any expenses reference this category."""
        from app.models.expense import Expense

        result = await self._session.execute(
            select(Expense.id).where(
                Expense.category_id == category_id,
                Expense.user_id == user_id,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None
