"""Savings Goal repository: all DB access for savings goals."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.savings_goal import SavingsGoal


class SavingsGoalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(self, user_id: int) -> list[SavingsGoal]:
        result = await self._session.execute(
            select(SavingsGoal)
            .where(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, goal_id: int, user_id: int) -> SavingsGoal | None:
        result = await self._session.execute(
            select(SavingsGoal).where(
                SavingsGoal.id == goal_id,
                SavingsGoal.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, **kwargs: Any) -> SavingsGoal:
        goal = SavingsGoal(user_id=user_id, **kwargs)
        self._session.add(goal)
        await self._session.flush()
        await self._session.refresh(goal)
        return goal

    async def update(self, goal: SavingsGoal, **kwargs: Any) -> SavingsGoal:
        for key, value in kwargs.items():
            if value is not None:
                setattr(goal, key, value)
        await self._session.flush()
        await self._session.refresh(goal)
        return goal

    async def delete(self, goal: SavingsGoal) -> None:
        await self._session.delete(goal)
        await self._session.flush()
