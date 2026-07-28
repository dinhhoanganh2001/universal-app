# Agent Instructions

Before doing any work in this repository, read `CONTEXT.md`.

After completing meaningful work, update `CONTEXT.md` with:

- what changed,
- important files touched,
- new commands or setup details,
- known gaps or follow-up work.

Keep project docs, backend internals, scripts, and collaboration notes in English. Keep the app UI in Vietnamese unless the user asks otherwise.

Run the relevant checks before finishing:

```bash
node --check src/app.js
bash -n start_service.sh
backend/.venv/bin/python backend/scripts/smoke_test.py
backend/.venv/bin/python backend/scripts/cors_smoke_test.py
```

Do not commit generated runtime files such as `backend/.env`, `backend/.venv/`, `backend/universal_app.db`, or `__pycache__/`.
