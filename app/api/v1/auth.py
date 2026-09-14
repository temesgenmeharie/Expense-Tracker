"""Auth API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    body: UserCreate,
    session: AsyncSession = Depends(get_db),
) -> User:
    """
    Create a new user account.

    Default expense categories are automatically created for the new user.
    """
    service = AuthService(session)
    return await service.register(body)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Obtain a JWT access token",
)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate and receive a JWT bearer token."""
    service = AuthService(session)
    user = await service.authenticate(body.email, body.password)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile of the authenticated user."""
    return current_user
