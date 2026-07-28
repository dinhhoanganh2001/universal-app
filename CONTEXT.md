# Project Context

This file is the shared working context for contributors and coding agents. Read it before changing the project, and update it after meaningful work so the next person does not have to rediscover decisions.

## Current State

- The project is a small universal personal app, currently focused on money tracking.
- The frontend is static HTML/CSS/JavaScript: `index.html`, `src/styles.css`, `src/app.js`.
- The app language is Vietnamese and the displayed currency is VND.
- Project documentation, scripts, backend internals, and collaboration notes should stay in English unless explicitly requested.
- The backend is a FastAPI app under `backend/`.
- Authentication exists with register/login/me endpoints and JWT bearer tokens.
- Money backend APIs exist for transactions, budgets, and monthly summaries.
- Money category APIs exist for user-defined category names.
- The frontend login/register screen talks to the backend auth endpoints.
- After login, the frontend money tracker syncs transactions and budgets with the backend.
- Budget checklist rows can be added, renamed, edited, and deleted from the UI.
- Users can manage money categories on the `Danh mục` page.
- Budget progress uses backend summary/budget reads so edits recalculate spent amounts from current transaction history.
- Budget progress includes an overall monthly total progress bar above category rows.
- Budget progress rows use a bordered, lightly tinted treatment with an accent strip for easier scanning.
- The visible money screen no longer exposes import/export/demo-data buttons.

## How To Run

```bash
bash start_service.sh
```

Default URLs:

- UI: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

Override ports:

```bash
PORT=8484 FRONTEND_PORT=5174 bash start_service.sh
```

## Important Files

- `src/app.js`: frontend state, auth UI, money UI, API calls, and remaining local backup helper code.
- `src/styles.css`: app and auth screen styling.
- `backend/app/main.py`: FastAPI app setup and CORS middleware.
- `backend/app/core/config.py`: settings, database URL, CORS origins.
- `backend/app/core/security.py`: JWT and password hashing.
- `backend/app/api/v1/auth.py`: register, login, current user.
- `backend/app/api/v1/money.py`: transaction, budget, and summary endpoints.
- `backend/scripts/smoke_test.py`: backend integration smoke test.
- `backend/scripts/cors_smoke_test.py`: CORS preflight smoke test.
- `start_service.sh`: starts both backend and frontend.

## Design Decisions

- Use SQLite by default through `DATABASE_URL`; this can move to Postgres later without changing route logic.
- Keep frontend module labels and money UI in Vietnamese.
- Keep backend schema field names in English, with stable enum values `income` and `expense`.
- Store JWT in `localStorage` for now for simple local development.
- Use root `AGENTS.md` for agent instructions instead of a `.codex` directory, because it is more visible to collaborators and coding agents.

## Known Gaps

- The frontend still calculates top-level summary cards locally from loaded transactions; budget progress now uses backend summary data.
- Import/export helper code still exists in `src/app.js`, but it is not exposed in the current UI.
- There are no Alembic migrations yet; tables are created by `Base.metadata.create_all`.
- There is no production auth hardening yet: refresh tokens, cookie-based auth, rate limits, password reset, email verification, or CSRF strategy.
- There is no automated frontend browser test yet.

## Verification Commands

```bash
node --check src/app.js
bash -n start_service.sh
backend/.venv/bin/python backend/scripts/smoke_test.py
backend/.venv/bin/python backend/scripts/cors_smoke_test.py
```

## Recent Work Log

- Created static money tracker UI with local data.
- Added FastAPI backend with SQLAlchemy models, SQLite config, JWT auth, and money APIs.
- Added `start_service.sh` to launch backend and frontend together.
- Switched app UI language to Vietnamese and currency display to VND.
- Added login/register screen connected to backend auth.
- Connected money transactions and budgets to backend APIs after login.
- Fixed local CORS preflight failures for frontend/backend running on different local ports.
- Reworked login/register screen into a cleaner two-column account layout with a dark product summary panel and compact form.
- Fixed auth page clipping by switching the root `#app` class between `auth-root` and `app-shell`.
- Removed Import, Export, and Demo buttons from the money header.
- Reworked the month filter in the `Giao dịch` panel into a compact previous/current/next month control.
- Added full budget checklist editing with add, category change, amount change, and delete support through backend budget endpoints.
- Switched budget progress rendering to backend recalculated `spent_amount`/`percent_used` after budget edits.
- Added user-owned money categories with backend CRUD, a `Danh mục` frontend page, and category dropdowns sourced from user-defined categories.
- Added stronger visual separators between budget progress rows.
- Added an overall total progress bar to the budget progress panel.
