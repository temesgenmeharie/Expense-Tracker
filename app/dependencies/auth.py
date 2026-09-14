"""Auth dependency — extracts and validates JWT from bearer token."""
from __future__ import annotations

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.core.security import decode_access_token
from app.models.user import User
from app.services.auth import AuthService

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that resolves the authenticated user from a JWT bearer token.

    Raises AuthenticationError (401) if the token is missing, invalid, or the user
    no longer exists.
    """
    if credentials is None:
        raise AuthenticationError("Bearer token is required.")

    try:
        user_id_str = decode_access_token(credentials.credentials)
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise AuthenticationError("Invalid or expired token.")

    service = AuthService(session)
    user = await service.get_by_id(user_id)
    if user is None:
        raise AuthenticationError("User account not found or inactive.")

    return user
