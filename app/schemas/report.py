"""Report schemas."""
from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    balance: Decimal
    largest_expense: Decimal
    average_expense: Decimal


class CategorySummaryItem(BaseModel):
    category_id: int | None
    category_name: str
    amount: Decimal
    percentage: float


class MonthlyReportResponse(BaseModel):
    year: int
    month: int
    month_name: str
    income: Decimal
    expenses: Decimal
    balance: Decimal
    categories: list[CategorySummaryItem]


class CategorySummaryResponse(BaseModel):
    categories: list[CategorySummaryItem]
    total_expenses: Decimal
