from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.money import month_bounds
from app.db.session import get_db
from app.models.money import Budget, Transaction
from app.models.social import Friendship
from app.models.user import User
from app.schemas.social import FriendCreate, FriendList, FriendRead


router = APIRouter()


@router.get("", response_model=FriendList)
def list_friends(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FriendList:
    rows = db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.friend_id)
        .where(Friendship.owner_id == current_user.id)
        .order_by(User.full_name.asc(), User.email.asc())
    ).all()

    return FriendList(
        month=month,
        friends=[
            friend_read(db, friend_user, month)
            for _, friend_user in rows
        ],
    )


@router.post("", response_model=FriendRead, status_code=status.HTTP_201_CREATED)
def create_friend(
    payload: FriendCreate,
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FriendRead:
    friend_user = find_friend_user(db, payload.identifier)
    if not friend_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend user not found")
    if friend_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a friend")

    existing = db.scalar(
        select(Friendship).where(
            Friendship.owner_id == current_user.id,
            Friendship.friend_id == friend_user.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Friend already exists")

    db.add(Friendship(owner_id=current_user.id, friend_id=friend_user.id))
    db.commit()
    return friend_read(db, friend_user, month)


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    friendship = db.scalar(
        select(Friendship).where(
            Friendship.owner_id == current_user.id,
            Friendship.friend_id == friend_id,
        )
    )
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend not found")

    db.delete(friendship)
    db.commit()


def find_friend_user(db: Session, identifier: str) -> User | None:
    normalized = identifier.strip().lower()
    if normalized.isdigit():
        return db.scalar(select(User).where(User.id == int(normalized)))
    return db.scalar(select(User).where(User.email == normalized))


def friend_read(db: Session, friend_user: User, month: str) -> FriendRead:
    return FriendRead(
        id=friend_user.id,
        email=friend_user.email,
        full_name=friend_user.full_name,
        budget_percent_used=friend_budget_percent(db, friend_user.id, month),
        budget_count=friend_budget_count(db, friend_user.id, month),
    )


def friend_budget_count(db: Session, owner_id: int, month: str) -> int:
    return db.scalar(
        select(func.count()).select_from(Budget).where(
            Budget.owner_id == owner_id,
            Budget.month == month,
        )
    ) or 0


def friend_budget_percent(db: Session, owner_id: int, month: str) -> int:
    total_limit = db.scalar(
        select(func.coalesce(func.sum(Budget.limit_amount), 0)).where(
            Budget.owner_id == owner_id,
            Budget.month == month,
        )
    )
    limit_amount = Decimal(total_limit or 0)
    if limit_amount <= 0:
        return 0

    start, end = month_bounds(month)
    budget_categories = select(Budget.category).where(
        Budget.owner_id == owner_id,
        Budget.month == month,
    )
    total_spent = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.owner_id == owner_id,
            Transaction.type == "expense",
            Transaction.category.in_(budget_categories),
            Transaction.occurred_on >= start,
            Transaction.occurred_on < end,
        )
    )
    spent_amount = Decimal(total_spent or 0)
    return round((spent_amount / limit_amount) * 100)
