from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.money import month_bounds
from app.db.session import get_db
from app.models.money import Budget, Transaction
from app.models.social import Friendship
from app.models.user import User
from app.schemas.social import FriendCreate, FriendList, FriendRead, FriendRequestRead


router = APIRouter()


@router.get("", response_model=FriendList)
def list_friends(
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FriendList:
    rows = list(
        db.scalars(
            select(Friendship)
            .where(
                Friendship.status == "accepted",
                or_(
                    Friendship.owner_id == current_user.id,
                    Friendship.friend_id == current_user.id,
                ),
            )
            .order_by(Friendship.created_at.desc())
        )
    )
    pending_rows = list(
        db.scalars(
            select(Friendship)
            .where(
                Friendship.status == "pending",
                or_(
                    Friendship.owner_id == current_user.id,
                    Friendship.friend_id == current_user.id,
                ),
            )
            .order_by(Friendship.created_at.desc())
        )
    )

    accepted_friends = []
    seen_friend_ids = set()
    for row in rows:
        friend_user = other_friend_user(db, row, current_user.id)
        if friend_user.id in seen_friend_ids:
            continue
        seen_friend_ids.add(friend_user.id)
        accepted_friends.append(friend_read(db, friend_user, month))

    incoming_requests = []
    outgoing_requests = []
    seen_incoming_ids = set()
    seen_outgoing_ids = set()
    for row in pending_rows:
        request = friend_request_read(db, row, current_user.id)
        if row.friend_id == current_user.id:
            if request.user_id in seen_incoming_ids:
                continue
            seen_incoming_ids.add(request.user_id)
            incoming_requests.append(request)
        if row.owner_id == current_user.id:
            if request.user_id in seen_outgoing_ids:
                continue
            seen_outgoing_ids.add(request.user_id)
            outgoing_requests.append(request)

    return FriendList(
        month=month,
        friends=accepted_friends,
        incoming_requests=incoming_requests,
        outgoing_requests=outgoing_requests,
    )


@router.post("", response_model=FriendRequestRead, status_code=status.HTTP_201_CREATED)
def create_friend(
    payload: FriendCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FriendRequestRead:
    friend_user = find_friend_user(db, payload.identifier)
    if not friend_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend user not found")
    if friend_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a friend")

    existing = friendship_between(db, current_user.id, friend_user.id)
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Friend already exists")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Friend request already exists")

    friendship = Friendship(
        owner_id=current_user.id,
        friend_id=friend_user.id,
        requested_by_id=current_user.id,
        status="pending",
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friend_request_read(db, friendship, current_user.id)


@router.post("/requests/{request_id}/accept", response_model=FriendRead)
def accept_friend_request(
    request_id: int,
    month: str = Query(pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FriendRead:
    friendship = get_pending_request(db, request_id)
    if friendship.friend_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Friend request is not yours")

    friendship.status = "accepted"
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friend_read(db, other_friend_user(db, friendship, current_user.id), month)


@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    friendship = get_pending_request(db, request_id)
    if current_user.id not in {friendship.owner_id, friendship.friend_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Friend request is not yours")

    db.delete(friendship)
    db.commit()


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    friendships = friendships_between(db, current_user.id, friend_id)
    accepted_friendships = [friendship for friendship in friendships if friendship.status == "accepted"]
    if not accepted_friendships:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend not found")

    for friendship in accepted_friendships:
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
        avatar_url=friend_user.avatar_url,
        budget_percent_used=friend_budget_percent(db, friend_user.id, month),
        budget_count=friend_budget_count(db, friend_user.id, month),
    )


def friend_request_read(db: Session, friendship: Friendship, current_user_id: int) -> FriendRequestRead:
    friend_user = other_friend_user(db, friendship, current_user_id)
    return FriendRequestRead(
        request_id=friendship.id,
        user_id=friend_user.id,
        email=friend_user.email,
        full_name=friend_user.full_name,
        avatar_url=friend_user.avatar_url,
        direction="incoming" if friendship.friend_id == current_user_id else "outgoing",
        status=friendship.status,
        created_at=friendship.created_at,
    )


def friendship_between(db: Session, first_user_id: int, second_user_id: int) -> Friendship | None:
    return db.scalar(
        select(Friendship).where(
            or_(
                (Friendship.owner_id == first_user_id) & (Friendship.friend_id == second_user_id),
                (Friendship.owner_id == second_user_id) & (Friendship.friend_id == first_user_id),
            )
        )
    )


def friendships_between(db: Session, first_user_id: int, second_user_id: int) -> list[Friendship]:
    return list(
        db.scalars(
            select(Friendship).where(
                or_(
                    (Friendship.owner_id == first_user_id) & (Friendship.friend_id == second_user_id),
                    (Friendship.owner_id == second_user_id) & (Friendship.friend_id == first_user_id),
                )
            )
        )
    )


def get_pending_request(db: Session, request_id: int) -> Friendship:
    friendship = db.scalar(
        select(Friendship).where(
            Friendship.id == request_id,
            Friendship.status == "pending",
        )
    )
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")
    return friendship


def other_friend_user(db: Session, friendship: Friendship, current_user_id: int) -> User:
    other_user_id = friendship.friend_id if friendship.owner_id == current_user_id else friendship.owner_id
    user = db.scalar(select(User).where(User.id == other_user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend user not found")
    return user


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
