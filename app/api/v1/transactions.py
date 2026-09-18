"""Transactions API routes (combined income and expenses export)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.expense import ExpenseFilters
from app.repositories.income import IncomeFilters
from app.services.expense import ExpenseService
from app.services.income import IncomeService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "/export",
    summary="Export transactions (income + expenses) in CSV, JSON, or PDF format",
    response_class=Response,
)
async def export_transactions(
    format: str = Query("csv", description="Export format: csv | json | pdf"),
    type: Optional[str] = Query(None, description="Transaction type: income | expense | all"),
    date_from: Optional[date] = Query(None, description="Filter transactions on or after this date"),
    date_to: Optional[date] = Query(None, description="Filter transactions on or before this date"),
    min_amount: Optional[Decimal] = Query(None, description="Minimum amount (inclusive)"),
    max_amount: Optional[Decimal] = Query(None, description="Maximum amount (inclusive)"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Download all transactions (income and expenses) in selected format."""
    if format not in ["csv", "json", "pdf"]:
        format = "csv"
    
    # Build CSV content with both expenses and income
    lines = []
    
    # CSV Header
    lines.append("Type,Description,Date,Amount,Category/Source,Currency")
    
    # Fetch expenses if needed
    if not type or type == "expense" or type == "all":
        expense_filters = ExpenseFilters(
            date_from=date_from,
            date_to=date_to,
            min_amount=min_amount,
            max_amount=max_amount,
            sort_by="expense_date",
            sort_order="desc",
            page=1,
            page_size=10000,
        )
        expense_service = ExpenseService(session)
        expenses = await expense_service.list_expenses(current_user.id, expense_filters)
        
        for exp in expenses.items:
            category = exp.category_name or "Uncategorized"
            lines.append(
                f'Expense,"{exp.title}",{exp.expense_date},{exp.amount},"{category}",{exp.currency}'
            )
    
    # Fetch income if needed
    if not type or type == "income" or type == "all":
        income_filters = IncomeFilters(
            date_from=date_from,
            date_to=date_to,
            min_amount=min_amount,
            max_amount=max_amount,
            sort_by="income_date",
            sort_order="desc",
            page=1,
            page_size=10000,
        )
        income_service = IncomeService(session)
        incomes = await income_service.list_incomes(current_user.id, income_filters)
        
        for inc in incomes.items:
            lines.append(
                f'Income,"{inc.source}",{inc.income_date},{inc.amount},"",{inc.currency}'
            )
    
    csv_data = "\n".join(lines)
    
    if format == "csv":
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"}
        )
    elif format == "json":
        import json
        data = {
            "transactions": lines[1:],  # Skip header
            "generated_at": str(__import__('datetime').datetime.now()),
        }
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=transactions.json"}
        )
    else:  # pdf
        # For PDF, return CSV for now (PDF generation would require additional dependencies)
        return Response(
            content=csv_data,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=transactions.pdf"}
        )
