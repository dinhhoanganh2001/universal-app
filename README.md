# Universal App

A web app scaffolded for future modules, with a complete first Money Tracking module and a Python backend foundation.

The frontend app currently uses Vietnamese and VND. Project docs, scripts, and backend internals stay in English.

## Run

```bash
bash start_service.sh
```

This starts:

- API: `http://127.0.0.1:8000`
- UI: `http://127.0.0.1:5173`

Override ports when needed:

```bash
PORT=8484 FRONTEND_PORT=5174 bash start_service.sh
```

## Backend

The backend lives in `backend/` and provides FastAPI endpoints for authentication, transactions, budgets, and monthly summaries. See `backend/README.md` for setup and API routes.

## Current Module

Money Tracking supports transactions, filters, budget limits, category insights, JSON export/import, and VND demo data.

## Extend

Add future modules to the `modules` array in `src/app.js`. Keep shared services such as configuration, authentication, database sessions, and money/date formatting in the shell/core layers.
