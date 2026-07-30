from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="VND", nullable=False)
    monthly_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    transactions = relationship("Transaction", back_populates="owner", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="owner", cascade="all, delete-orphan")
    money_categories = relationship("MoneyCategory", back_populates="owner", cascade="all, delete-orphan")
