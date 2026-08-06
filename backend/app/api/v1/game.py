from collections import Counter
from datetime import UTC, date, datetime, time, timedelta
from functools import lru_cache
from hashlib import sha256
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.game import WordleAttempt
from app.models.user import User
from app.schemas.game import GameGuessCreate, GameProgressRead, GameStateRead


router = APIRouter()

WORD_LENGTH = 5
MAX_ATTEMPTS = 6
SOURCE_WORD_COUNT = 3000
GAME_WORD_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "game"
ANSWER_WORDS_PATH = GAME_WORD_DATA_DIR / "answer_words.txt"
VALID_GUESSES_PATH = GAME_WORD_DATA_DIR / "valid_guesses.txt"
FALLBACK_ANSWER_WORDS = tuple(
    """
    about above abuse actor acute admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone
    along alter among anger angle angry apart apple apply arena argue arise array aside asset audio audit avoid award aware
    badly baker bases basic beach began begin begun being below bench birth black blame blind block blood board boost booth
    bound brain brand bread break breed brief bring broad broke brown build built buyer cable carry catch cause chain chair
    chart chase cheap check chest chief child civil claim class clean clear clerk click clock close coach coast could count
    court cover craft crash cream crime cross crowd crown curve daily dance dated dealt death debug decay delay depth doing
    doubt dozen draft drama drawn dream dress drill drink drive drove dying eager early earth eight elite empty enemy enjoy
    enter entry equal error event every exact exist extra faith false fault favor feast fiber field fifth fifty fight final
    first fixed flash fleet floor fluid focus force forth forty forum found frame frank fraud fresh front fruit fully funny
    giant given glass globe going grace grade grand grant grass great green gross group grown guard guess guest guide happy
    harry heart heavy hence horse hotel house human ideal image index inner input issue joint judge known label large laser
    later laugh layer learn lease least leave legal level light limit local loose lower lucky lunch major maker march match
    maybe mayor meant media metal might minor model money month moral motor mount mouse mouth movie music never night noise
    north novel nurse occur ocean offer often order other ought paint panel paper party peace phase phone photo piece pilot
    pitch place plain plane plant plate point pound power press price pride prime print prior prize proof proud prove queen
    quick quiet quite radio raise range rapid ratio reach ready refer right rival river rough round route royal rural scale
    scene scope score sense serve seven shall shape share sharp sheet shelf shell shift shirt shock shoot short shown sight
    since sixth sixty sized skill sleep slice slide small smart smile smith smoke solid solve sorry sound south space spare
    speak speed spend spent split spoke sport staff stage stake stand start state steam steel stick still stock stone stood
    store storm story strip stuck study stuff style sugar suite super sweet table taken taste teach teeth thank their theme
    there thick thing think third those three threw throw tight times tired title today topic total touch tough tower track
    trade train treat trend trial tried tries truck truly trust truth twice under union unity until upper upset urban usage
    usual valid value video virus visit vital voice waste watch water wheel where which while white whole whose woman women
    world worry worse worst worth would wound write wrong wrote yield young youth
    """.split()
)


@router.get("/today", response_model=GameStateRead)
def today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GameStateRead:
    puzzle_date = current_puzzle_date()
    attempt = get_or_create_attempt(db, current_user.id, puzzle_date)
    return game_state(db, current_user, attempt, puzzle_date)


@router.post("/guesses", response_model=GameStateRead)
def create_guess(
    payload: GameGuessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GameStateRead:
    puzzle_date = current_puzzle_date()
    attempt = get_or_create_attempt(db, current_user.id, puzzle_date)
    if attempt.status != "playing":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Today's game is already complete")
    if len(attempt.guesses or []) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No guesses remaining")

    guess = payload.word
    if guess not in valid_guess_words():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guess is not a valid English word")
    if any(row.get("word") == guess for row in attempt.guesses or []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already guessed this word")

    answer = answer_for_date(puzzle_date)
    guesses = list(attempt.guesses or [])
    guesses.append(
        {
            "word": guess,
            "result": score_guess(guess, answer),
            "created_at": datetime.now(UTC).isoformat(),
        }
    )
    attempt.guesses = guesses
    if guess == answer:
        attempt.status = "solved"
    elif len(guesses) >= MAX_ATTEMPTS:
        attempt.status = "failed"

    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return game_state(db, current_user, attempt, puzzle_date)


def current_puzzle_date() -> date:
    return datetime.now(UTC).date()


def get_or_create_attempt(db: Session, owner_id: int, puzzle_date: date) -> WordleAttempt:
    attempt = db.scalar(
        select(WordleAttempt).where(
            WordleAttempt.owner_id == owner_id,
            WordleAttempt.puzzle_date == puzzle_date,
        )
    )
    if attempt:
        return attempt

    attempt = WordleAttempt(owner_id=owner_id, puzzle_date=puzzle_date, guesses=[], status="playing")
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def game_state(db: Session, current_user: User, attempt: WordleAttempt, puzzle_date: date) -> GameStateRead:
    guesses = list(attempt.guesses or [])
    return GameStateRead(
        puzzle_date=puzzle_date,
        word_length=WORD_LENGTH,
        max_attempts=MAX_ATTEMPTS,
        attempts_used=len(guesses),
        remaining_attempts=max(0, MAX_ATTEMPTS - len(guesses)),
        status=attempt.status,
        guesses=guesses,
        answer=answer_for_date(puzzle_date) if attempt.status != "playing" else None,
        progress=progress_reads(db, puzzle_date),
        source_word_count=SOURCE_WORD_COUNT,
        answer_pool_count=len(answer_words()),
        seconds_until_next_puzzle=seconds_until_next_puzzle(),
    )


def progress_reads(db: Session, puzzle_date: date) -> list[GameProgressRead]:
    rows = db.execute(
        select(WordleAttempt, User)
        .join(User, User.id == WordleAttempt.owner_id)
        .where(WordleAttempt.puzzle_date == puzzle_date)
        .order_by(WordleAttempt.updated_at.desc(), WordleAttempt.id.desc())
    ).all()
    return [
        GameProgressRead(
            user_id=user.id,
            full_name=user.full_name or user.email,
            avatar_url=user.avatar_url,
            attempts_used=len(attempt.guesses or []),
            max_attempts=MAX_ATTEMPTS,
            board=progress_board(attempt),
            status=attempt.status,
            updated_at=attempt.updated_at,
        )
        for attempt, user in rows
    ]


def progress_board(attempt: WordleAttempt) -> list[list[str]]:
    return [
        list(row.get("result") or [])
        for row in attempt.guesses or []
    ]


def answer_for_date(puzzle_date: date) -> str:
    answers = answer_words()
    digest = sha256(f"universal-app-wordle:{puzzle_date.isoformat()}".encode()).hexdigest()
    return answers[int(digest, 16) % len(answers)]


def score_guess(guess: str, answer: str) -> list[str]:
    result = ["absent"] * WORD_LENGTH
    remaining = Counter()
    for index, letter in enumerate(answer):
        if guess[index] == letter:
            result[index] = "correct"
        else:
            remaining[letter] += 1

    for index, letter in enumerate(guess):
        if result[index] == "correct":
            continue
        if remaining[letter] > 0:
            result[index] = "present"
            remaining[letter] -= 1

    return result


@lru_cache(maxsize=1)
def word_pool() -> set[str]:
    return set(answer_words())


@lru_cache(maxsize=1)
def valid_guess_words() -> set[str]:
    answer_set = set(answer_words())
    words = set(read_word_file(VALID_GUESSES_PATH))
    if words:
        words.update(answer_set)
        return words
    words = set(system_dictionary_words())
    words.update(answer_set)
    return words


@lru_cache(maxsize=1)
def answer_words() -> tuple[str, ...]:
    words = read_word_file(ANSWER_WORDS_PATH)
    return tuple(words or FALLBACK_ANSWER_WORDS)


def read_word_file(path: Path) -> list[str]:
    try:
        return [
            word
            for word in path.read_text(encoding="utf-8").splitlines()
            if len(word) == WORD_LENGTH and word.isalpha() and word.islower()
        ]
    except OSError:
        return []


def system_dictionary_words() -> list[str]:
    words: list[str] = []
    for path in (Path("/usr/share/dict/words"), Path("/usr/share/dict/web2")):
        if not path.exists():
            continue
        try:
            words.extend(
                line.strip().lower()
                for line in path.read_text(encoding="utf-8", errors="ignore").splitlines()
                if len(line.strip()) == WORD_LENGTH and line.strip().isalpha() and line.strip().islower()
            )
        except OSError:
            continue
        if words:
            break
    return sorted(set(words), key=word_commonness_key)


def word_commonness_key(word: str) -> tuple[int, str]:
    letter_rank = "etaoinshrdlucmfwypvbgkjqxz"
    score = sum(letter_rank.index(letter) if letter in letter_rank else 99 for letter in word)
    rare_penalty = sum(10 for letter in word if letter in "jqxz")
    repeat_penalty = (WORD_LENGTH - len(set(word))) * 4
    return score + rare_penalty + repeat_penalty, word


def seconds_until_next_puzzle() -> int:
    now = datetime.now(UTC)
    next_day = datetime.combine(now.date() + timedelta(days=1), time.min, tzinfo=UTC)
    return max(0, int((next_day - now).total_seconds()))
