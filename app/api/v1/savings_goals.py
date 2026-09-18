"""Savings Goals API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.savings_goal import (
    SavingsGoalContribute,
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)
from app.services.savings_goal import SavingsGoalService

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


@router.get(
    "",
    response_model=list[SavingsGoalResponse],
    summary="List all savings goals",
)
async def list_goals(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SavingsGoalResponse]:
    service = SavingsGoalService(session)
    return await service.list_goals(current_user.id)  # type: ignore[return-value]


@router.post(
    "",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a savings goal",
)
async def create_goal(
    body: SavingsGoalCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsGoalResponse:
    service = SavingsGoalService(session)
    return await service.create_goal(current_user.id, body)  # type: ignore[return-value]


@router.get(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="Get a savings goal by ID",
)
async def get_goal(
    goal_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsGoalResponse:
    service = SavingsGoalService(session)
    return await service.get_goal(goal_id, current_user.id)  # type: ignore[return-value]


@router.patch(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="Update a savings goal",
)
async def update_goal(
    goal_id: int,
    body: SavingsGoalUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsGoalResponse:
    service = SavingsGoalService(session)
    return await service.update_goal(goal_id, current_user.id, body)  # type: ignore[return-value]


@router.post(
    "/{goal_id}/contribute",
    response_model=SavingsGoalResponse,
    summary="Add or withdraw funds from a savings goal",
)
async def contribute_to_goal(
    goal_id: int,
    body: SavingsGoalContribute,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsGoalResponse:
    service = SavingsGoalService(session)
    return await service.contribute(goal_id, current_user.id, body.amount)  # type: ignore[return-value]


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a savings goal",
)
async def delete_goal(
    goal_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = SavingsGoalService(session)
    await service.delete_goal(goal_id, current_user.id)
