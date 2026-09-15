"""Authentication service."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def register(self, data: UserCreate) -> User:
        """Create a new user account."""
        existing = await self._session.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none() is not None:
            raise UserAlreadyExistsError()

        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)

        # Create default categories for the new user
        await self._create_default_categories(user.id)

        return user

    async def authenticate(self, email: str, password: str) -> User:
        """Verify credentials and return the user."""
        result = await self._session.execute(
            select(User).where(User.email == email, User.is_active == True)  # noqa: E712
        )
        user = result.scalar_one_or_none()
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def update_profile(self, user: User, full_name: str) -> User:
        """Update user's display name."""
        user.full_name = full_name
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        """Verify current password then update to new one."""
        if not verify_password(current_password, user.hashed_password):
            raise InvalidCredentialsError("Current password is incorrect.")
        user.hashed_password = hash_password(new_password)
        await self._session.flush()
        from app.models.category import Category

        default_names = [
            "Food",
            "Transportation",
            "Housing",
            "Utilities",
            "Healthcare",
            "Education",
            "Entertainment",
            "Shopping",
            "Travel",
            "Other",
        ]
        for name in default_names:
            self._session.add(Category(user_id=user_id, name=name))
        await self._session.flush()
