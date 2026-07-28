from pydantic import BaseModel, Field


class FriendCreate(BaseModel):
    identifier: str = Field(min_length=1, max_length=320)


class FriendRead(BaseModel):
    id: int
    email: str
    full_name: str
    budget_percent_used: int
    budget_count: int


class FriendList(BaseModel):
    month: str
    friends: list[FriendRead]
