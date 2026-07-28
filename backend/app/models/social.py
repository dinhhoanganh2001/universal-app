from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (UniqueConstraint("owner_id", "friend_id", name="uq_friendship_owner_friend"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    friend_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
