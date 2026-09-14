"""Income ORM model."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DATE, DECIMAL, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Income(Base):
    __tablename__ = "incomes"
    __table_args__ = (Index("ix_incomes_user_date", "user_id", "income_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    source: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    income_date: Mapped[date] = mapped_column(DATE, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="incomes")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Income id={self.id} source={self.source!r} amount={self.amount}>"
