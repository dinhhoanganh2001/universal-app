from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.money import Budget, MoneyBucket, MoneyCategory, MoneyFund, Transaction
from app.models.user import User
from app.schemas.money import (
    BucketRead,
    BucketUpdate,
    BudgetRead,
    BudgetUpdate,
    BudgetUpsert,
    CategoryCreate,
    CategoryRead,
    CategorySpend,
    CategoryUpdate,
    FundCreate,
    FundRead,
    FundUpdate,
    MoneySummary,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)


router = APIRouter()

SYSTEM_FUND_NAMES = {
    "quỹ khẩn cấp",
    "quỹ độc lập tài chính",
    "độc lập tài chính",
    "quỹ tự do tài chính",
    "tự do tài chính",
}


@router.get("/bucket", response_model=BucketRead)
def get_bucket(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BucketRead:
    bucket = get_or_create_bucket(db, current_user.id)
    return BucketRead(id=bucket.id, total_amount=bucket.total_amount)


@router.put("/bucket", response_model=BucketRead)
def update_bucket(
    payload: BucketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BucketRead:
    bucket = get_or_create_bucket(db, current_user.id)
    bucket.total_amount = payload.total_amount
    db.add(bucket)
    db.commit()
    db.refresh(bucket)
    return BucketRead(id=bucket.id, total_amount=bucket.total_amount)


@router.get("/funds", response_model=list[FundRead])
def list_funds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FundRead]:
    funds = list(
        db.scalars(
            select(MoneyFund)
            .where(
                MoneyFund.owner_id == current_user.id,
                ~func.lower(MoneyFund.name).in_(SYSTEM_FUND_NAMES),
            )
            .order_by(MoneyFund.created_at.asc(), MoneyFund.id.asc())
        )
    )
    return [fund_read(fund) for fund in funds]


@router.post("/funds", response_model=FundRead, status_code=status.HTTP_201_CREATED)
def create_fund(
    payload: FundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FundRead:
    ensure_custom_fund_name(payload.name)
    existing = db.scalar(
        select(MoneyFund).where(
            MoneyFund.owner_id == current_user.id,
            MoneyFund.name == payload.name,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Fund already exists")

    fund = MoneyFund(owner_id=current_user.id, **payload.model_dump())
    db.add(fund)
    db.commit()
    db.refresh(fund)
    return fund_read(fund)


@router.patch("/funds/{fund_id}", response_model=FundRead)
def update_fund(
    fund_id: int,
    payload: FundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FundRead:
    fund = get_owned_fund(db, current_user.id, fund_id)
    updates = payload.model_dump(exclude_unset=True)
    next_name = updates.get("name")
    if next_name:
        ensure_custom_fund_name(next_name)
    if next_name and next_name != fund.name:
        existing = db.scalar(
            select(MoneyFund).where(
                MoneyFund.owner_id == current_user.id,
                MoneyFund.name == next_name,
                MoneyFund.id != fund.id,
            )
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Fund already exists")

    for field, value in updates.items():
        setattr(fund, field, value)

    db.add(fund)
    db.commit()
    db.refresh(fund)
    return fund_read(fund)


@router.delete("/funds/{fund_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fund(
    fund_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    fund = get_owned_fund(db, current_user.id, fund_id)
    db.delete(fund)
    db.commit()


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MoneyCategory]:
    return list(
        db.scalars(
            select(MoneyCategory)
            .where(MoneyCategory.owner_id == current_user.id)
            .order_by(MoneyCategory.name.asc())
        )
    )


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoneyCategory:
    existing = db.scalar(
        select(MoneyCategory).where(
            MoneyCategory.owner_id == current_user.id,
            MoneyCategory.name == payload.name,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")

    category = MoneyCategory(owner_id=current_user.id, name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoneyCategory:
    category = get_owned_category(db, current_user.id, category_id)
    existing = db.scalar(
        select(MoneyCategory).where(
            MoneyCategory.owner_id == current_user.id,
            MoneyCategory.name == payload.name,
            MoneyCategory.id != category.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")

    old_name = category.name
    category.name = payload.name
    db.query(Transaction).filter(
        Transaction.owner_id == current_user.id,
        Transaction.category == old_name,
    ).update({Transaction.category: payload.name})
    db.query(Budget).filter(
        Budget.owner_id == current_user.id,
        Budget.category == old_name,
    ).update({Budget.category: payload.name})
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    category = get_owned_category(db, current_user.id, category_id)
    transaction_count = db.scalar(
        select(func.count()).select_from(Transaction).where(
            Transaction.owner_id == current_user.id,
            Transaction.category == category.name,
        )
    )
    budget_count = db.scalar(
        select(func.count()).select_from(Budget).where(
            Budget.owner_id == current_user.id,
            Budget.category == category.name,
            Budget.is_active.is_(True),
        )
    )
    if transaction_count or budget_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category is in use")

    db.delete(category)
    db.commit()


@router.get("/transactions", response_model=list[TransactionRead])
def list_transactions(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    type: str | None = Query(default=None, pattern=r"^expense$"),
    category: str | None = Query(default=None, min_length=1, max_length=60),
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    conditions = [Transaction.owner_id == current_user.id, Transaction.type == "expense"]
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
    if payload.type != "expense":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Income transactions are disabled")

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
    if updates.get("type") and updates["type"] != "expense":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Income transactions are disabled")

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
    minimum_amount = payload.minimum_amount if payload.minimum_amount is not None else payload.limit_amount
    full_amount = payload.full_amount if payload.full_amount is not None else payload.limit_amount
    if budget:
        budget.limit_amount = payload.limit_amount
        budget.minimum_amount = minimum_amount
        budget.full_amount = full_amount
        budget.color = payload.color
        budget.is_active = True
    else:
        budget = Budget(
            owner_id=current_user.id,
            category=payload.category,
            month=payload.month,
            limit_amount=payload.limit_amount,
            minimum_amount=minimum_amount,
            full_amount=full_amount,
            color=payload.color,
            is_active=True,
        )
        db.add(budget)

    db.flush()
    delete_future_budget_versions(db, current_user.id, budget.category, budget.month, budget.id)
    db.commit()
    db.refresh(budget)
    return budget_read(db, current_user.id, budget, payload.month)


@router.patch("/budgets/{budget_id}", response_model=BudgetRead)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetRead:
    budget = get_owned_budget(db, current_user.id, budget_id)
    updates = payload.model_dump(exclude_unset=True)

    category = updates.get("category", budget.category)
    month = updates.get("month", budget.month)
    duplicate = db.scalar(
        select(Budget).where(
            Budget.owner_id == current_user.id,
            Budget.category == category,
            Budget.month == month,
            Budget.id != budget.id,
        )
    )
    if duplicate and month == budget.month:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Budget already exists for this category and month")

    target_budget = budget
    if month != budget.month:
        target_budget = duplicate
        if not target_budget:
            target_budget = Budget(
                owner_id=current_user.id,
                category=category,
                month=month,
                limit_amount=budget.limit_amount,
                minimum_amount=budget.minimum_amount,
                full_amount=budget.full_amount,
                color=budget.color,
                is_active=True,
            )
            db.add(target_budget)

    target_budget.category = category
    target_budget.month = month
    for field, value in updates.items():
        if field != "month":
            setattr(target_budget, field, value)
    target_budget.is_active = True

    db.add(target_budget)
    db.flush()
    delete_future_budget_versions(db, current_user.id, target_budget.category, month, target_budget.id)
    db.commit()
    db.refresh(target_budget)
    return budget_read(db, current_user.id, target_budget, month)


@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    budget = get_owned_budget(db, current_user.id, budget_id)
    target_month = month or budget.month
    target_budget = budget if budget.month == target_month else db.scalar(
        select(Budget).where(
            Budget.owner_id == current_user.id,
            Budget.category == budget.category,
            Budget.month == target_month,
        )
    )
    if not target_budget:
        target_budget = Budget(
            owner_id=current_user.id,
            category=budget.category,
            month=target_month,
            limit_amount=budget.limit_amount,
            minimum_amount=budget.minimum_amount,
            full_amount=budget.full_amount,
            color=budget.color,
            is_active=False,
        )
        db.add(target_budget)
    else:
        target_budget.is_active = False

    db.flush()
    delete_future_budget_versions(db, current_user.id, budget.category, target_month, target_budget.id)
    db.commit()


@router.get("/summary", response_model=MoneySummary)
def summary(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoneySummary:
    start, end = month_bounds(month)
    total_expenses = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.owner_id == current_user.id,
            Transaction.type == "expense",
            Transaction.occurred_on >= start,
            Transaction.occurred_on < end,
        )
    )
    expenses = Decimal(total_expenses or 0)

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
        expenses=expenses,
        category_spend=[
            CategorySpend(category=row[0], spent_amount=Decimal(row[1]))
            for row in category_rows
        ],
        budgets=budget_reads(db, current_user.id, month),
    )


def get_or_create_bucket(db: Session, owner_id: int) -> MoneyBucket:
    bucket = db.scalar(select(MoneyBucket).where(MoneyBucket.owner_id == owner_id))
    if bucket:
        return bucket

    bucket = MoneyBucket(owner_id=owner_id, total_amount=Decimal("0.00"))
    db.add(bucket)
    db.commit()
    db.refresh(bucket)
    return bucket


def get_owned_fund(db: Session, owner_id: int, fund_id: int) -> MoneyFund:
    fund = db.scalar(select(MoneyFund).where(MoneyFund.id == fund_id, MoneyFund.owner_id == owner_id))
    if not fund:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund not found")
    return fund


def ensure_custom_fund_name(name: str) -> None:
    if name.strip().lower() in SYSTEM_FUND_NAMES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System fund is automatic")


def fund_read(fund: MoneyFund) -> FundRead:
    percent_saved = round((fund.saved_amount / fund.target_amount) * 100) if fund.target_amount > 0 else 0
    return FundRead(
        id=fund.id,
        name=fund.name,
        target_amount=fund.target_amount,
        saved_amount=fund.saved_amount,
        color=fund.color,
        percent_saved=percent_saved,
    )


def get_owned_transaction(db: Session, owner_id: int, transaction_id: int) -> Transaction:
    transaction = db.scalar(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.owner_id == owner_id)
    )
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def get_owned_budget(db: Session, owner_id: int, budget_id: int) -> Budget:
    budget = db.scalar(select(Budget).where(Budget.id == budget_id, Budget.owner_id == owner_id))
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


def get_owned_category(db: Session, owner_id: int, category_id: int) -> MoneyCategory:
    category = db.scalar(
        select(MoneyCategory).where(MoneyCategory.id == category_id, MoneyCategory.owner_id == owner_id)
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def budget_reads(db: Session, owner_id: int, month: str) -> list[BudgetRead]:
    budget_versions = list(
        db.scalars(
            select(Budget)
            .where(Budget.owner_id == owner_id, Budget.month <= month)
            .order_by(Budget.category.asc(), Budget.month.desc(), Budget.id.desc())
        )
    )
    effective_budgets: dict[str, Budget] = {}
    for budget in budget_versions:
        if budget.category not in effective_budgets:
            effective_budgets[budget.category] = budget
    return [
        budget_read(db, owner_id, budget, month)
        for budget in effective_budgets.values()
        if budget.is_active
    ]


def budget_read(db: Session, owner_id: int, budget: Budget, month: str | None = None) -> BudgetRead:
    read_month = month or budget.month
    start, end = month_bounds(read_month)
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
        month=read_month,
        limit_amount=budget.limit_amount,
        minimum_amount=budget.minimum_amount,
        full_amount=budget.full_amount,
        color=budget.color,
        spent_amount=spent_amount,
        percent_used=percent_used,
    )


def delete_future_budget_versions(db: Session, owner_id: int, category: str, month: str, keep_id: int | None = None) -> None:
    query = db.query(Budget).filter(
        Budget.owner_id == owner_id,
        Budget.category == category,
        Budget.month > month,
    )
    if keep_id is not None:
        query = query.filter(Budget.id != keep_id)
    query.delete(synchronize_session=False)


def month_bounds(month: str) -> tuple[date, date]:
    year, month_number = [int(part) for part in month.split("-")]
    start = date(year, month_number, 1)
    if month_number == 12:
        return start, date(year + 1, 1, 1)
    return start, date(year, month_number + 1, 1)
