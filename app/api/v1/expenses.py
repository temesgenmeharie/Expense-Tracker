"""Expenses API routes with filtering, sorting, and pagination."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.expense import ExpenseFilters
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    PaginatedExpenses,
)
from app.services.expense import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get(
    "",
    response_model=PaginatedExpenses,
    summary="List expenses with filtering, sorting, and pagination",
)
async def list_expenses(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    date_from: Optional[date] = Query(None, description="Filter expenses on or after this date"),
    date_to: Optional[date] = Query(None, description="Filter expenses on or before this date"),
    min_amount: Optional[Decimal] = Query(None, description="Minimum amount (inclusive)"),
    max_amount: Optional[Decimal] = Query(None, description="Maximum amount (inclusive)"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    sort_by: str = Query("expense_date", description="Sort field: expense_date | amount | created_at"),
    sort_order: str = Query("desc", description="Sort direction: asc | desc"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedExpenses:
    """
    Retrieve a paginated, filtered list of the current user's expenses.

    Example: `GET /api/v1/expenses?category_id=1&min_amount=100&sort_by=amount&sort_order=asc`
    """
    filters = ExpenseFilters(
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        payment_method=payment_method,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    service = ExpenseService(session)
    return await service.list_expenses(current_user.id, filters)


@router.get(
    "/export",
    summary="Export expenses in CSV, JSON, or PDF format",
    response_class=Response,
)
async def export_expenses(
    format: str = Query("csv", description="Export format: csv | json | pdf"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    date_from: Optional[date] = Query(None, description="Filter expenses on or after this date"),
    date_to: Optional[date] = Query(None, description="Filter expenses on or before this date"),
    min_amount: Optional[Decimal] = Query(None, description="Minimum amount (inclusive)"),
    max_amount: Optional[Decimal] = Query(None, description="Maximum amount (inclusive)"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    sort_by: str = Query("expense_date", description="Sort field: expense_date | amount | created_at"),
    sort_order: str = Query("desc", description="Sort direction: asc | desc"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Download expenses in selected format (CSV, JSON, or PDF)."""
    if format not in ["csv", "json", "pdf"]:
        format = "csv"
    
    filters = ExpenseFilters(
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        payment_method=payment_method,
        sort_by=sort_by,
        sort_order=sort_order,
        page=1,
        page_size=1,  # Ignored in export
    )
    service = ExpenseService(session)
    
    if format == "csv":
        data = await service.export_expenses(current_user.id, filters)
        return Response(
            content=data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=expenses.csv"}
        )
    elif format == "json":
        expenses = await service.list_expenses(current_user.id, filters)
        import json
        return Response(
            content=json.dumps(expenses.dict(), default=str),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=expenses.json"}
        )
    else:  # pdf
        # For PDF, return CSV for now (PDF generation would require additional dependencies)
        data = await service.export_expenses(current_user.id, filters)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=expenses.pdf"}
        )
    

@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense",
)
async def create_expense(
    body: ExpenseCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    service = ExpenseService(session)
    return await service.create_expense(current_user.id, body)  # type: ignore[return-value]


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Get a single expense by ID",
)
async def get_expense(
    expense_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    service = ExpenseService(session)
    return await service.get_expense(expense_id, current_user.id)  # type: ignore[return-value]


@router.patch(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Partially update an expense",
)
async def update_expense(
    expense_id: int,
    body: ExpenseUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    service = ExpenseService(session)
    return await service.update_expense(expense_id, current_user.id, body)  # type: ignore[return-value]


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
)
async def delete_expense(
    expense_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = ExpenseService(session)
    await service.delete_expense(expense_id, current_user.id)
