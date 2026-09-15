"""Income service — business logic."""
from __future__ import annotations

import math
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import IncomeNotFoundError
from app.models.income import Income
from app.repositories.income import IncomeRepository
from app.schemas.income import IncomeCreate, IncomeFilters, IncomeUpdate, PaginatedIncomes


class IncomeService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = IncomeRepository(session)

    async def list_incomes(
        self,
        user_id: int,
        filters: Optional[IncomeFilters] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedIncomes:
        f = filters or IncomeFilters()
        items, total = await self._repo.list_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            date_from=f.date_from,
            date_to=f.date_to,
            source_search=f.source_search,
            min_amount=f.min_amount,
            max_amount=f.max_amount,
            sort_by=f.sort_by,
            sort_order=f.sort_order,
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return PaginatedIncomes(
            items=items,  # type: ignore[arg-type]
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_income(self, income_id: int, user_id: int) -> Income:
        income = await self._repo.get_by_id(income_id, user_id)
        if income is None:
            raise IncomeNotFoundError()
        return income

    async def create_income(self, user_id: int, data: IncomeCreate) -> Income:
        return await self._repo.create(
            user_id=user_id,
            source=data.source,
            amount=data.amount,
            currency=data.currency,
            income_date=data.income_date,
            description=data.description,
        )

    async def update_income(
        self, income_id: int, user_id: int, data: IncomeUpdate
    ) -> Income:
        income = await self._repo.get_by_id(income_id, user_id)
        if income is None:
            raise IncomeNotFoundError()
        updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        return await self._repo.update(income, **updates)

    async def delete_income(self, income_id: int, user_id: int) -> None:
        income = await self._repo.get_by_id(income_id, user_id)
        if income is None:
            raise IncomeNotFoundError()
        await self._repo.delete(income)
