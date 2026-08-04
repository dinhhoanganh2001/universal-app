from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FriendCreate(BaseModel):
    identifier: str = Field(min_length=1, max_length=320)


class FriendRead(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: str = ""
    budget_percent_used: int
    budget_count: int


class FriendRequestRead(BaseModel):
    request_id: int
    user_id: int
    email: str
    full_name: str
    avatar_url: str = ""
    direction: Literal["incoming", "outgoing"]
    status: str
    created_at: datetime


class FriendList(BaseModel):
    month: str
    self: FriendRead
    friends: list[FriendRead]
    incoming_requests: list[FriendRequestRead] = Field(default_factory=list)
    outgoing_requests: list[FriendRequestRead] = Field(default_factory=list)
