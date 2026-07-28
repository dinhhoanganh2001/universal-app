# Universal App

A web app scaffolded for future modules, with a complete first Money Tracking module and a Python backend foundation.

The frontend app currently uses Vietnamese and VND. Project docs, scripts, and backend internals stay in English.

## Run

```bash
bash start_service.sh
```

On first run, the script creates `.env` from `.env.example`.

This starts:

- API: `http://127.0.0.1:8000`
- UI: `http://127.0.0.1:5173`

Change ports in the root `.env` file:

```dotenv
BACKEND_PORT=8484
FRONTEND_PORT=5174
```

Then run `bash start_service.sh` again.

## Backend

The backend lives in `backend/` and provides FastAPI endpoints for authentication, friends, transactions, budgets, and monthly summaries. See `backend/README.md` for setup and API routes.

## Current Module

Money Tracking supports login/register, API-backed transactions, budgets, user-defined categories, friend budget-progress percentages, filters, category insights, and VND currency display.

## Extend

Add future modules to the `modules` array in `src/app.js`. Keep shared services such as configuration, authentication, database sessions, and money/date formatting in the shell/core layers.
