"""Categories API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="List all categories for the current user",
)
async def list_categories(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryResponse]:
    service = CategoryService(session)
    return await service.list_categories(current_user.id)  # type: ignore[return-value]


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category",
)
async def create_category(
    body: CategoryCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    service = CategoryService(session)
    return await service.create_category(current_user.id, body)  # type: ignore[return-value]


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Rename a category",
)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    service = CategoryService(session)
    return await service.update_category(category_id, current_user.id, body)  # type: ignore[return-value]


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category (fails if expenses are linked)",
)
async def delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = CategoryService(session)
    await service.delete_category(category_id, current_user.id)
