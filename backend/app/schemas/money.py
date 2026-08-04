from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


TransactionType = Literal["expense"]


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
    minimum_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    full_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    color: str = Field(default="#2563eb", pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("category")
    @classmethod
    def trim_category(cls, value: str) -> str:
        return value.strip()


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=60)
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    limit_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    minimum_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    full_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("category")
    @classmethod
    def trim_optional_category(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value


class BudgetRead(BudgetUpsert):
    id: int
    spent_amount: Decimal = Decimal("0.00")
    percent_used: int = 0

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        return value.strip()


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=60)

    @field_validator("name")
    @classmethod
    def trim_update_name(cls, value: str) -> str:
        return value.strip()


class CategoryRead(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class BucketUpdate(BaseModel):
    total_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class BucketRead(BucketUpdate):
    id: int | None = None

    model_config = {"from_attributes": True}


class FundCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    target_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    saved_amount: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)
    color: str = Field(default="#0f766e", pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name")
    @classmethod
    def trim_fund_name(cls, value: str) -> str:
        return value.strip()


class FundUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    target_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    saved_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name")
    @classmethod
    def trim_optional_fund_name(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value


class FundRead(FundCreate):
    id: int
    percent_saved: int = 0

    model_config = {"from_attributes": True}


class CategorySpend(BaseModel):
    category: str
    spent_amount: Decimal


class MoneySummary(BaseModel):
    month: str
    expenses: Decimal
    category_spend: list[CategorySpend]
    budgets: list[BudgetRead]
