"""Report service — financial calculations."""
from __future__ import annotations

import calendar
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.repositories.expense import ExpenseRepository
from app.repositories.income import IncomeRepository
from app.schemas.report import (
    CategorySummaryItem,
    CategorySummaryResponse,
    DashboardResponse,
    MonthlyReportResponse,
)


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._expense_repo = ExpenseRepository(session)
        self._income_repo = IncomeRepository(session)
        self._session = session

    async def get_dashboard(self, user_id: int) -> DashboardResponse:
        total_income = await self._income_repo.total_by_user(user_id)
        total_expenses = await self._expense_repo.total_by_user(user_id)
        largest = await self._expense_repo.largest_by_user(user_id)
        average = await self._expense_repo.average_by_user(user_id)

        return DashboardResponse(
            total_income=total_income,
            total_expenses=total_expenses,
            balance=total_income - total_expenses,
            largest_expense=largest,
            average_expense=average,
        )

    async def get_monthly_report(
        self, user_id: int, year: int, month: int
    ) -> MonthlyReportResponse:
        income = await self._income_repo.monthly_total(user_id, year, month)
        expenses = await self._expense_repo.monthly_total(user_id, year, month)
        by_category = await self._expense_repo.monthly_by_category(user_id, year, month)

        categories = await self._build_category_items(by_category, user_id, expenses)

        return MonthlyReportResponse(
            year=year,
            month=month,
            month_name=calendar.month_name[month],
            income=income,
            expenses=expenses,
            balance=income - expenses,
            categories=categories,
        )

    async def get_category_summary(self, user_id: int) -> CategorySummaryResponse:
        by_category = await self._expense_repo.all_by_category(user_id)
        total = await self._expense_repo.total_by_user(user_id)
        categories = await self._build_category_items(by_category, user_id, total)

        return CategorySummaryResponse(
            categories=categories,
            total_expenses=total,
        )

    async def _build_category_items(
        self,
        by_category: list[tuple[int | None, Decimal]],
        user_id: int,
        total: Decimal,
    ) -> list[CategorySummaryItem]:
        """Resolve category names and compute percentages."""
        if not by_category:
            return []

        # Fetch category names in one query
        cat_ids = [cid for cid, _ in by_category if cid is not None]
        cat_map: dict[int, str] = {}
        if cat_ids:
            result = await self._session.execute(
                select(Category.id, Category.name).where(
                    Category.id.in_(cat_ids), Category.user_id == user_id
                )
            )
            cat_map = {row.id: row.name for row in result.all()}

        items: list[CategorySummaryItem] = []
        for cat_id, amount in by_category:
            name = cat_map.get(cat_id, "Uncategorized") if cat_id is not None else "Uncategorized"
            pct = float(amount / total * 100) if total > 0 else 0.0
            items.append(
                CategorySummaryItem(
                    category_id=cat_id,
                    category_name=name,
                    amount=amount,
                    percentage=round(pct, 2),
                )
            )

        return sorted(items, key=lambda x: x.amount, reverse=True)
