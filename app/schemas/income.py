"""Income schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.expense import VALID_CURRENCIES


class IncomeCreate(BaseModel):
    source: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=Decimal("0"), decimal_places=2)
    currency: str = Field("USD", min_length=3, max_length=3)
    income_date: date
    description: Optional[str] = Field(None, max_length=1000)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        upper = v.upper()
        if upper not in VALID_CURRENCIES:
            raise ValueError(f"Unsupported currency code: {v!r}")
        return upper

    @field_validator("income_date")
    @classmethod
    def validate_income_date(cls, v: date) -> date:
        if v.year < 1900 or v.year > 2100:
            raise ValueError("Income date is out of acceptable range.")
        return v


class IncomeUpdate(BaseModel):
    source: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[Decimal] = Field(None, gt=Decimal("0"), decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    income_date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=1000)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper = v.upper()
            if upper not in VALID_CURRENCIES:
                raise ValueError(f"Unsupported currency code: {v!r}")
            return upper
        return v


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    amount: Decimal
    currency: str
    income_date: date
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedIncomes(BaseModel):
    items: list[IncomeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
