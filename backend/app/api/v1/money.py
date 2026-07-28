from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.money import Budget, Transaction
from app.models.user import User
from app.schemas.money import (
    BudgetRead,
    BudgetUpsert,
    CategorySpend,
    MoneySummary,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)


router = APIRouter()


@router.get("/transactions", response_model=list[TransactionRead])
def list_transactions(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    type: str | None = Query(default=None, pattern=r"^(income|expense)$"),
    category: str | None = Query(default=None, min_length=1, max_length=60),
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    conditions = [Transaction.owner_id == current_user.id]
    if month:
        start, end = month_bounds(month)
        conditions.append(Transaction.occurred_on >= start)
        conditions.append(Transaction.occurred_on < end)
    if type:
        conditions.append(Transaction.type == type)
    if category:
        conditions.append(Transaction.category == category)
    if search:
        like = f"%{search.strip()}%"
        conditions.append(Transaction.note.ilike(like) | Transaction.category.ilike(like))

    return list(
        db.scalars(
            select(Transaction)
            .where(and_(*conditions))
            .order_by(Transaction.occurred_on.desc(), Transaction.id.desc())
        )
    )


@router.post("/transactions", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = Transaction(owner_id=current_user.id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.patch("/transactions/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = get_owned_transaction(db, current_user.id, transaction_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(transaction, field, value)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    transaction = get_owned_transaction(db, current_user.id, transaction_id)
    db.delete(transaction)
    db.commit()


@router.get("/budgets", response_model=list[BudgetRead])
def list_budgets(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BudgetRead]:
    return budget_reads(db, current_user.id, month)


@router.put("/budgets", response_model=BudgetRead)
def upsert_budget(
    payload: BudgetUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetRead:
    budget = db.scalar(
        select(Budget).where(
            Budget.owner_id == current_user.id,
            Budget.category == payload.category,
            Budget.month == payload.month,
        )
    )
    if budget:
        budget.limit_amount = payload.limit_amount
    else:
        budget = Budget(owner_id=current_user.id, **payload.model_dump())
        db.add(budget)

    db.commit()
    db.refresh(budget)
    return budget_read(db, current_user.id, budget)


@router.get("/summary", response_model=MoneySummary)
def summary(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoneySummary:
    start, end = month_bounds(month)
    rows = db.execute(
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.owner_id == current_user.id,
            Transaction.occurred_on >= start,
            Transaction.occurred_on < end,
        )
        .group_by(Transaction.type)
    ).all()
    totals = {row[0]: Decimal(row[1]) for row in rows}
    income = totals.get("income", Decimal("0.00"))
    expenses = totals.get("expense", Decimal("0.00"))
    balance = income - expenses
    savings_rate = round((balance / income) * 100) if income > 0 else 0

    category_rows = db.execute(
        select(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.owner_id == current_user.id,
            Transaction.type == "expense",
            Transaction.occurred_on >= start,
            Transaction.occurred_on < end,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    ).all()

    return MoneySummary(
        month=month,
        income=income,
        expenses=expenses,
        balance=balance,
        savings_rate=savings_rate,
        category_spend=[
            CategorySpend(category=row[0], spent_amount=Decimal(row[1]))
            for row in category_rows
        ],
        budgets=budget_reads(db, current_user.id, month),
    )


def get_owned_transaction(db: Session, owner_id: int, transaction_id: int) -> Transaction:
    transaction = db.scalar(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.owner_id == owner_id)
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def budget_reads(db: Session, owner_id: int, month: str) -> list[BudgetRead]:
    budgets = list(
        db.scalars(
            select(Budget)
            .where(Budget.owner_id == owner_id, Budget.month == month)
            .order_by(Budget.category.asc())
        )
    )
    return [budget_read(db, owner_id, budget) for budget in budgets]


def budget_read(db: Session, owner_id: int, budget: Budget) -> BudgetRead:
    start, end = month_bounds(budget.month)
    spent = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.owner_id == owner_id,
            Transaction.type == "expense",
            Transaction.category == budget.category,
            Transaction.occurred_on >= start,
            Transaction.occurred_on < end,
        )
    )
    spent_amount = Decimal(spent or 0)
    percent_used = round((spent_amount / budget.limit_amount) * 100) if budget.limit_amount > 0 else 0
    return BudgetRead(
        id=budget.id,
        category=budget.category,
        month=budget.month,
        limit_amount=budget.limit_amount,
        spent_amount=spent_amount,
        percent_used=percent_used,
    )


def month_bounds(month: str) -> tuple[date, date]:
    year, month_number = [int(part) for part in month.split("-")]
    start = date(year, month_number, 1)
    if month_number == 12:
        return start, date(year + 1, 1, 1)
    return start, date(year, month_number + 1, 1)
