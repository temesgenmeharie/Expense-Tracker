"""Unit tests for expense and income schemas (validation logic)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.expense import ExpenseCreate
from app.schemas.income import IncomeCreate
from app.schemas.user import UserCreate


class TestExpenseValidation:
    def _valid_payload(self) -> dict:
        return {
            "title": "Lunch",
            "amount": "25.50",
            "currency": "USD",
            "expense_date": "2026-09-01",
        }

    def test_valid_expense(self) -> None:
        e = ExpenseCreate(**self._valid_payload())
        assert e.amount == Decimal("25.50")
        assert e.currency == "USD"

    def test_amount_must_be_positive(self) -> None:
        with pytest.raises(ValidationError, match="greater than 0"):
            ExpenseCreate(**{**self._valid_payload(), "amount": "0"})

    def test_negative_amount_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ExpenseCreate(**{**self._valid_payload(), "amount": "-1"})

    def test_invalid_currency_rejected(self) -> None:
        with pytest.raises(ValidationError, match="Unsupported currency"):
            ExpenseCreate(**{**self._valid_payload(), "currency": "XYZ"})

    def test_currency_normalized_to_upper(self) -> None:
        e = ExpenseCreate(**{**self._valid_payload(), "currency": "usd"})
        assert e.currency == "USD"

    def test_invalid_payment_method_rejected(self) -> None:
        with pytest.raises(ValidationError, match="Invalid payment method"):
            ExpenseCreate(**{**self._valid_payload(), "payment_method": "bitcoin"})

    def test_valid_payment_method(self) -> None:
        e = ExpenseCreate(**{**self._valid_payload(), "payment_method": "cash"})
        assert e.payment_method == "cash"

    def test_title_required(self) -> None:
        with pytest.raises(ValidationError):
            ExpenseCreate(**{**self._valid_payload(), "title": ""})


class TestIncomeValidation:
    def _valid_payload(self) -> dict:
        return {
            "source": "Salary",
            "amount": "5000.00",
            "currency": "USD",
            "income_date": "2026-09-01",
        }

    def test_valid_income(self) -> None:
        i = IncomeCreate(**self._valid_payload())
        assert i.amount == Decimal("5000.00")

    def test_amount_must_be_positive(self) -> None:
        with pytest.raises(ValidationError):
            IncomeCreate(**{**self._valid_payload(), "amount": "0"})


class TestUserValidation:
    def test_password_must_contain_digit(self) -> None:
        with pytest.raises(ValidationError, match="digit"):
            UserCreate(email="a@b.com", full_name="Alice", password="nodigitshere")

    def test_password_minimum_length(self) -> None:
        with pytest.raises(ValidationError):
            UserCreate(email="a@b.com", full_name="Alice", password="abc1")

    def test_valid_user(self) -> None:
        u = UserCreate(email="a@b.com", full_name="Alice", password="password1")
        assert u.email == "a@b.com"
