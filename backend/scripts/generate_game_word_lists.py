"""Generate committed Wordle word-list data.

This script is intentionally a generator, not a runtime dependency. The app reads
the generated text files from backend/app/data/game/ so deployments are stable.
"""

from __future__ import annotations

import argparse
import re
import tarfile
from pathlib import Path

from nltk.corpus import wordnet as wn
from nltk.corpus.reader.wordnet import ADJ, ADJ_SAT, NOUN, VERB
from wordfreq import top_n_list


WORD_LENGTH = 5
SOURCE_WORD_COUNT = 3000
SCOWL_DIALECT_PREFIXES = (
    "english",
    "american",
    "british",
    "british_z",
    "variant_1",
    "variant_2",
    "variant_3",
    "british_variant_1",
    "british_variant_2",
)
WORD_RE = re.compile(r"^[a-z]{5}$")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scowl-archive", required=True, type=Path)
    parser.add_argument("--output-dir", default=Path("backend/app/data/game"), type=Path)
    args = parser.parse_args()

    valid_guesses = scowl_five_letter_words(args.scowl_archive)
    answer_words = common_answer_words(valid_guesses)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    write_word_file(args.output_dir / "answer_words.txt", answer_words)
    write_word_file(args.output_dir / "valid_guesses.txt", sorted(valid_guesses | set(answer_words)))
    write_sources_file(args.output_dir / "SOURCES.md", len(answer_words), len(valid_guesses | set(answer_words)))


def scowl_five_letter_words(scowl_archive: Path) -> set[str]:
    words: set[str] = set()
    with tarfile.open(scowl_archive) as archive:
        for member in archive.getmembers():
            path = Path(member.name)
            if not member.isfile() or len(path.parts) < 3:
                continue
            if path.parts[-2] != "final":
                continue
            name = path.name
            if "-words." not in name:
                continue
            if not name.startswith(SCOWL_DIALECT_PREFIXES):
                continue
            extracted = archive.extractfile(member)
            if extracted is None:
                continue
            for raw_line in extracted:
                word = raw_line.decode("iso-8859-1", errors="ignore").strip()
                word = word.lower()
                if WORD_RE.fullmatch(word):
                    words.add(word)
    return words


def common_answer_words(valid_guesses: set[str]) -> list[str]:
    answers: list[str] = []
    seen: set[str] = set()
    for word in top_n_list("en", SOURCE_WORD_COUNT, wordlist="best"):
        if word in seen or not WORD_RE.fullmatch(word):
            continue
        if word not in valid_guesses:
            continue
        if not is_original_noun_verb_or_adjective(word):
            continue
        seen.add(word)
        answers.append(word)
    return answers


def is_original_noun_verb_or_adjective(word: str) -> bool:
    return (
        is_original_noun(word)
        or is_original_verb(word)
        or is_adjective(word)
    )


def is_original_noun(word: str) -> bool:
    if not has_exact_lemma(word, NOUN):
        return False
    if plural_like_noun(word):
        return False
    return wn.morphy(word, NOUN) in (None, word)


def is_original_verb(word: str) -> bool:
    return has_exact_lemma(word, VERB) and wn.morphy(word, VERB) in (None, word)


def is_adjective(word: str) -> bool:
    return has_exact_lemma(word, ADJ) or has_exact_lemma(word, ADJ_SAT)


def has_exact_lemma(word: str, pos: str) -> bool:
    return any(
        lemma.name().lower() == word
        for synset in wn.synsets(word, pos=pos)
        for lemma in synset.lemmas()
    )


def plural_like_noun(word: str) -> bool:
    candidates = []
    if word.endswith("ies"):
        candidates.append(f"{word[:-3]}y")
    if word.endswith("es"):
        candidates.append(word[:-2])
    if word.endswith("s"):
        candidates.append(word[:-1])
    return any(candidate and wn.synsets(candidate, pos=NOUN) for candidate in candidates)


def write_word_file(path: Path, words: list[str]) -> None:
    path.write_text("\n".join(words) + "\n", encoding="utf-8")


def write_sources_file(path: Path, answer_count: int, guess_count: int) -> None:
    path.write_text(
        "\n".join(
            [
                "# Game Word Sources",
                "",
                f"- `answer_words.txt`: {answer_count} common 5-letter hidden answers generated from the top {SOURCE_WORD_COUNT} wordfreq English words, filtered to SCOWL-valid words and WordNet base nouns, base verbs, or adjectives.",
                f"- `valid_guesses.txt`: {guess_count} accepted 5-letter guesses generated from SCOWL 2020.12.07 word lists for English, American, British, British -ize, and US/British variant spellings.",
                "- Generator: `backend/scripts/generate_game_word_lists.py`.",
                "- SCOWL: https://wordlist.aspell.net/",
                "- wordfreq: https://github.com/rspeer/wordfreq",
                "- WordNet via NLTK: https://www.nltk.org/howto/wordnet.html",
                "",
            ]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
