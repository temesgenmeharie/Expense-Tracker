"""Domain-specific exception hierarchy."""
from __future__ import annotations


class AppError(Exception):
    """Base class for all application-level errors."""

    status_code: int = 500
    code: str = "INTERNAL_SERVER_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.message
        super().__init__(self.message)


# ── Auth ──────────────────────────────────────────────────────────────────────
class AuthenticationError(AppError):
    status_code = 401
    code = "AUTHENTICATION_FAILED"
    message = "Authentication failed."


class InvalidCredentialsError(AppError):
    status_code = 401
    code = "INVALID_CREDENTIALS"
    message = "Incorrect email or password."


class TokenExpiredError(AppError):
    status_code = 401
    code = "TOKEN_EXPIRED"
    message = "Access token has expired."


class PermissionDeniedError(AppError):
    status_code = 403
    code = "PERMISSION_DENIED"
    message = "You do not have permission to perform this action."


# ── Users ─────────────────────────────────────────────────────────────────────
class UserNotFoundError(AppError):
    status_code = 404
    code = "USER_NOT_FOUND"
    message = "User not found."


class UserAlreadyExistsError(AppError):
    status_code = 409
    code = "USER_ALREADY_EXISTS"
    message = "A user with that email already exists."


# ── Expenses ──────────────────────────────────────────────────────────────────
class ExpenseNotFoundError(AppError):
    status_code = 404
    code = "EXPENSE_NOT_FOUND"
    message = "Expense not found."


# ── Incomes ───────────────────────────────────────────────────────────────────
class IncomeNotFoundError(AppError):
    status_code = 404
    code = "INCOME_NOT_FOUND"
    message = "Income not found."


# ── Categories ────────────────────────────────────────────────────────────────
class CategoryNotFoundError(AppError):
    status_code = 404
    code = "CATEGORY_NOT_FOUND"
    message = "Category not found."


class CategoryInUseError(AppError):
    status_code = 409
    code = "CATEGORY_IN_USE"
    message = "Cannot delete a category that has expenses associated with it."


class CategoryAlreadyExistsError(AppError):
    status_code = 409
    code = "CATEGORY_ALREADY_EXISTS"
    message = "A category with that name already exists."

# ── Budgets ───────────────────────────────────────────────────────────────────
class BudgetNotFoundError(AppError):
    status_code = 404
    code = "BUDGET_NOT_FOUND"
    message = "Budget not found."


class BudgetAlreadyExistsError(AppError):
    status_code = 409
    code = "BUDGET_ALREADY_EXISTS"
    message = "A budget for this category and period already exists."

# ── Savings Goals ─────────────────────────────────────────────────────────────
class SavingsGoalNotFoundError(AppError):
    status_code = 404
    code = "SAVINGS_GOAL_NOT_FOUND"
    message = "Savings goal not found."

