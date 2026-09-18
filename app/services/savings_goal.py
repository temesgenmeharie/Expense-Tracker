"""Savings Goal service — business logic."""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import SavingsGoalNotFoundError
from app.models.savings_goal import SavingsGoal
from app.repositories.savings_goal import SavingsGoalRepository
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate


class SavingsGoalService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = SavingsGoalRepository(session)

    async def list_goals(self, user_id: int) -> list[SavingsGoal]:
        return await self._repo.list_by_user(user_id)

    async def get_goal(self, goal_id: int, user_id: int) -> SavingsGoal:
        goal = await self._repo.get_by_id(goal_id, user_id)
        if goal is None:
            raise SavingsGoalNotFoundError()
        return goal

    async def create_goal(self, user_id: int, data: SavingsGoalCreate) -> SavingsGoal:
        return await self._repo.create(
            user_id=user_id,
            name=data.name,
            description=data.description,
            target_amount=data.target_amount,
            current_amount=data.current_amount,
            target_date=data.target_date,
        )

    async def update_goal(
        self, goal_id: int, user_id: int, data: SavingsGoalUpdate
    ) -> SavingsGoal:
        goal = await self._repo.get_by_id(goal_id, user_id)
        if goal is None:
            raise SavingsGoalNotFoundError()
        updates = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        return await self._repo.update(goal, **updates)

    async def contribute(
        self, goal_id: int, user_id: int, amount: Decimal
    ) -> SavingsGoal:
        """Add funds to a savings goal (positive) or withdraw (negative)."""
        goal = await self._repo.get_by_id(goal_id, user_id)
        if goal is None:
            raise SavingsGoalNotFoundError()
        new_amount = goal.current_amount + amount
        if new_amount < Decimal("0"):
            new_amount = Decimal("0")
        return await self._repo.update(goal, current_amount=new_amount)

    async def delete_goal(self, goal_id: int, user_id: int) -> None:
        goal = await self._repo.get_by_id(goal_id, user_id)
        if goal is None:
            raise SavingsGoalNotFoundError()
        await self._repo.delete(goal)
