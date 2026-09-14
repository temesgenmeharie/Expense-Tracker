"""Models package — import all models so Alembic can auto-detect them."""
from app.models.category import Category
from app.models.expense import Expense
from app.models.income import Income
from app.models.user import User

__all__ = ["User", "Category", "Expense", "Income"]
