"""Reports API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.report import (
    CategorySummaryResponse,
    DashboardResponse,
    MonthlyReportResponse,
)
from app.services.report import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Financial dashboard overview",
)
async def dashboard(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    """
    Returns an all-time financial summary:
    - Total income, total expenses, balance
    - Largest and average expense
    """
    service = ReportService(session)
    return await service.get_dashboard(current_user.id)


@router.get(
    "/monthly",
    response_model=MonthlyReportResponse,
    summary="Monthly financial report",
)
async def monthly_report(
    year: int = Query(..., ge=1900, le=2100, description="Year, e.g. 2026"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthlyReportResponse:
    """
    Returns a financial summary for the given month:
    - Income and expenses totals
    - Balance
    - Breakdown by category with percentages
    """
    service = ReportService(session)
    return await service.get_monthly_report(current_user.id, year, month)


@router.get(
    "/category-summary",
    response_model=CategorySummaryResponse,
    summary="All-time expense breakdown by category",
)
async def category_summary(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategorySummaryResponse:
    """Returns all-time expense totals grouped by category, with percentage share."""
    service = ReportService(session)
    return await service.get_category_summary(current_user.id)
