"""Add budgets table.

Revision ID: 0002_add_budgets
Revises: 0001_initial_schema
Create Date: 2026-09-15

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_budgets"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "budgets",
        sa.Column("id",           sa.Integer(),                  nullable=False),
        sa.Column("user_id",      sa.Integer(),                  nullable=False),
        sa.Column("category_id",  sa.Integer(),                  nullable=True),
        sa.Column("year",         sa.Integer(),                  nullable=False),
        sa.Column("month",        sa.Integer(),                  nullable=False),
        sa.Column("limit_amount", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("created_at",   sa.DateTime(timezone=True),    server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True),    server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"],     ["users.id"],      ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_budgets_id",            "budgets", ["id"],                            unique=False)
    op.create_index("ix_budgets_user_id",        "budgets", ["user_id"],                       unique=False)
    op.create_index("ix_budgets_category_id",    "budgets", ["category_id"],                   unique=False)
    op.create_index("ix_budgets_user_period",    "budgets", ["user_id", "year", "month"],       unique=False)
    op.create_index("ix_budgets_user_category",  "budgets", ["user_id", "category_id"],         unique=False)


def downgrade() -> None:
    op.drop_table("budgets")
