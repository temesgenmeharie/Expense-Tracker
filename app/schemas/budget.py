"""Budget schemas."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    year:  int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    limit_amount: Decimal = Field(..., gt=Decimal("0"), decimal_places=2)


class BudgetUpdate(BaseModel):
    limit_amount: Decimal = Field(..., gt=Decimal("0"), decimal_places=2)


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category_id: Optional[int]
    year:  int
    month: int
    limit_amount: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetWithSpend(BudgetResponse):
    """Budget response enriched with current spend and category name."""
    category_name: str
    spent: Decimal
    remaining: Decimal
    percentage: float            # 0–100+
    is_over: bool
