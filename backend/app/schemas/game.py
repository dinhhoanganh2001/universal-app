from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


TileResult = Literal["correct", "present", "absent"]
GameStatus = Literal["playing", "solved", "failed"]


class GameGuessCreate(BaseModel):
    word: str = Field(min_length=5, max_length=5, pattern=r"^[A-Za-z]{5}$")

    @field_validator("word")
    @classmethod
    def normalize_word(cls, value: str) -> str:
        return value.strip().lower()


class GameGuessRead(BaseModel):
    word: str
    result: list[TileResult]
    created_at: datetime


class GameProgressRead(BaseModel):
    user_id: int
    full_name: str
    avatar_url: str = ""
    attempts_used: int
    max_attempts: int
    board: list[list[TileResult]]
    status: GameStatus
    updated_at: datetime


class GameStateRead(BaseModel):
    puzzle_date: date
    word_length: int
    max_attempts: int
    attempts_used: int
    remaining_attempts: int
    status: GameStatus
    guesses: list[GameGuessRead]
    answer: str | None = None
    progress: list[GameProgressRead]
    source_word_count: int
    answer_pool_count: int
    seconds_until_next_puzzle: int
