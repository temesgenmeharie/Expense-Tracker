"""Expense schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

# ISO 4217 subset — extend as needed
VALID_CURRENCIES = {
    "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "BRL",
    "MXN", "SGD", "HKD", "NOK", "SEK", "DKK", "NZD", "ZAR", "RUB", "KRW",
    "TRY", "AED", "SAR", "ETB",
}

VALID_PAYMENT_METHODS = {
    "cash", "credit_card", "debit_card", "bank_transfer", "mobile_payment", "other"
}


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    amount: Decimal = Field(..., gt=Decimal("0"), decimal_places=2)
    currency: str = Field("USD", min_length=3, max_length=3)
    category_id: Optional[int] = None
    expense_date: date
    payment_method: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        upper = v.upper()
        if upper not in VALID_CURRENCIES:
            raise ValueError(f"Unsupported currency code: {v!r}")
        return upper

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PAYMENT_METHODS:
            raise ValueError(
                f"Invalid payment method. Choose from: {', '.join(sorted(VALID_PAYMENT_METHODS))}"
            )
        return v

    @field_validator("expense_date")
    @classmethod
    def validate_expense_date(cls, v: date) -> date:
        if v.year < 1900 or v.year > 2100:
            raise ValueError("Expense date is out of acceptable range.")
        return v


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    amount: Optional[Decimal] = Field(None, gt=Decimal("0"), decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    category_id: Optional[int] = None
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper = v.upper()
            if upper not in VALID_CURRENCIES:
                raise ValueError(f"Unsupported currency code: {v!r}")
            return upper
        return v

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PAYMENT_METHODS:
            raise ValueError(
                f"Invalid payment method. Choose from: {', '.join(sorted(VALID_PAYMENT_METHODS))}"
            )
        return v


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    category_id: Optional[int]
    title: str
    description: Optional[str]
    amount: Decimal
    currency: str
    expense_date: date
    payment_method: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedExpenses(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
