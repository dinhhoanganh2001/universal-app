from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


TransactionType = Literal["income", "expense"]


class TransactionBase(BaseModel):
    type: TransactionType
    category: str = Field(min_length=1, max_length=60)
    note: str = Field(min_length=1, max_length=180)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    occurred_on: date

    @field_validator("category", "note")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: TransactionType | None = None
    category: str | None = Field(default=None, min_length=1, max_length=60)
    note: str | None = Field(default=None, min_length=1, max_length=180)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    occurred_on: date | None = None

    @field_validator("category", "note")
    @classmethod
    def trim_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value


class TransactionRead(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetUpsert(BaseModel):
    category: str = Field(min_length=1, max_length=60)
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    limit_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)

    @field_validator("category")
    @classmethod
    def trim_category(cls, value: str) -> str:
        return value.strip()


class BudgetRead(BudgetUpsert):
    id: int
    spent_amount: Decimal = Decimal("0.00")
    percent_used: int = 0

    model_config = {"from_attributes": True}


class CategorySpend(BaseModel):
    category: str
    spent_amount: Decimal


class MoneySummary(BaseModel):
    month: str
    income: Decimal
    expenses: Decimal
    balance: Decimal
    savings_rate: int
    category_spend: list[CategorySpend]
    budgets: list[BudgetRead]
