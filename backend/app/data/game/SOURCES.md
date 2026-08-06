# Game Word Sources

- `answer_words.txt`: 390 common 5-letter hidden answers generated from the top 3000 wordfreq English words, filtered to SCOWL-valid words and WordNet base nouns, base verbs, or adjectives.
- `valid_guesses.txt`: 17446 accepted 5-letter guesses generated from SCOWL 2020.12.07 word lists for English, American, British, British -ize, and US/British variant spellings.
- Generator: `backend/scripts/generate_game_word_lists.py`.
- SCOWL: https://wordlist.aspell.net/
- wordfreq: https://github.com/rspeer/wordfreq
- WordNet via NLTK: https://www.nltk.org/howto/wordnet.html
