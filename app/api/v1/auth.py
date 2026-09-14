"""Auth API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.core.exceptions import AuthenticationError
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserResponse, RefreshTokenRequest
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
    summary="Obtain a JWT access token and refresh token",
)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate and receive a JWT bearer token and refresh token."""
    service = AuthService(session)
    user = await service.authenticate(body.email, body.password)
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh an access token using a refresh token",
)
async def refresh(
    body: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Obtain a new access token using a valid refresh token."""
    try:
        user_id_str = decode_refresh_token(body.refresh_token)
        user_id = int(user_id_str)
    except Exception:
        raise AuthenticationError("Invalid or expired refresh token.")
    
    service = AuthService(session)
    user = await service.get_by_id(user_id)
    if user is None:
        raise AuthenticationError("User account not found or inactive.")
        
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id)) # Rotate token
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile of the authenticated user."""
    return current_user
