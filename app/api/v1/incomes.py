"""Incomes API routes."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.income import (
    IncomeCreate, IncomeFilters, IncomeResponse, IncomeUpdate, PaginatedIncomes,
)
from app.services.income import IncomeService

router = APIRouter(prefix="/incomes", tags=["Incomes"])


@router.get(
    "",
    response_model=PaginatedIncomes,
    summary="List income entries with filtering, sorting, and pagination",
)
async def list_incomes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    # Filters
    date_from: Optional[date] = Query(None, description="On or after this date"),
    date_to: Optional[date] = Query(None, description="On or before this date"),
    source_search: Optional[str] = Query(None, description="Search source name (case-insensitive)"),
    min_amount: Optional[Decimal] = Query(None, description="Minimum amount"),
    max_amount: Optional[Decimal] = Query(None, description="Maximum amount"),
    # Sorting
    sort_by: str = Query("income_date", description="Sort field: income_date | amount | source | created_at"),
    sort_order: str = Query("desc", description="asc or desc"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedIncomes:
    service = IncomeService(session)
    filters = IncomeFilters(
        date_from=date_from,
        date_to=date_to,
        source_search=source_search,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await service.list_incomes(current_user.id, filters, page, page_size)


@router.post(
    "",
    response_model=IncomeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an income entry",
)
async def create_income(
    body: IncomeCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    service = IncomeService(session)
    return await service.create_income(current_user.id, body)  # type: ignore[return-value]


@router.get(
    "/{income_id}",
    response_model=IncomeResponse,
    summary="Get a single income entry",
)
async def get_income(
    income_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    service = IncomeService(session)
    return await service.get_income(income_id, current_user.id)  # type: ignore[return-value]


@router.patch(
    "/{income_id}",
    response_model=IncomeResponse,
    summary="Partially update an income entry",
)
async def update_income(
    income_id: int,
    body: IncomeUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    service = IncomeService(session)
    return await service.update_income(income_id, current_user.id, body)  # type: ignore[return-value]


@router.delete(
    "/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an income entry",
)
async def delete_income(
    income_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = IncomeService(session)
    await service.delete_income(income_id, current_user.id)
