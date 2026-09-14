"""Category service — business logic."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CategoryAlreadyExistsError,
    CategoryInUseError,
    CategoryNotFoundError,
)
from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = CategoryRepository(session)

    async def list_categories(self, user_id: int) -> list[Category]:
        return await self._repo.list_by_user(user_id)

    async def create_category(self, user_id: int, data: CategoryCreate) -> Category:
        existing = await self._repo.get_by_name(data.name, user_id)
        if existing is not None:
            raise CategoryAlreadyExistsError()
        return await self._repo.create(user_id=user_id, name=data.name)

    async def update_category(
        self, category_id: int, user_id: int, data: CategoryUpdate
    ) -> Category:
        category = await self._repo.get_by_id(category_id, user_id)
        if category is None:
            raise CategoryNotFoundError()
        # Ensure new name doesn't collide with another existing category
        duplicate = await self._repo.get_by_name(data.name, user_id)
        if duplicate is not None and duplicate.id != category_id:
            raise CategoryAlreadyExistsError()
        return await self._repo.update(category, name=data.name)

    async def delete_category(self, category_id: int, user_id: int) -> None:
        category = await self._repo.get_by_id(category_id, user_id)
        if category is None:
            raise CategoryNotFoundError()
        if await self._repo.has_expenses(category_id, user_id):
            raise CategoryInUseError()
        await self._repo.delete(category)
