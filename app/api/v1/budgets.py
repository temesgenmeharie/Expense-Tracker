"""Budgets API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate, BudgetWithSpend
from app.services.budget import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get(
    "",
    response_model=list[BudgetWithSpend],
    summary="List budgets for a given month with spend data",
)
async def list_budgets(
    year:  int = Query(..., ge=2000, le=2100, description="Year"),
    month: int = Query(..., ge=1,    le=12,   description="Month (1-12)"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BudgetWithSpend]:
    service = BudgetService(session)
    return await service.list_budgets(current_user.id, year, month)


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a budget for a category and month",
)
async def create_budget(
    body: BudgetCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    service = BudgetService(session)
    return await service.create_budget(current_user.id, body)  # type: ignore[return-value]


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Update a budget limit",
)
async def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    service = BudgetService(session)
    return await service.update_budget(budget_id, current_user.id, body)  # type: ignore[return-value]


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a budget",
)
async def delete_budget(
    budget_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = BudgetService(session)
    await service.delete_budget(budget_id, current_user.id)
