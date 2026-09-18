"""Savings Goal schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class SavingsGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_amount: Decimal = Field(..., gt=Decimal("0"), decimal_places=2)
    current_amount: Decimal = Field(Decimal("0.00"), ge=Decimal("0"), decimal_places=2)
    target_date: Optional[date] = None


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_amount: Optional[Decimal] = Field(None, gt=Decimal("0"), decimal_places=2)
    current_amount: Optional[Decimal] = Field(None, ge=Decimal("0"), decimal_places=2)
    target_date: Optional[date] = None


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    target_amount: Decimal
    current_amount: Decimal
    target_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SavingsGoalContribute(BaseModel):
    """Add or withdraw funds from a savings goal."""
    amount: Decimal = Field(..., decimal_places=2)
