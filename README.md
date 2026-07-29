# Universal App

A web app scaffolded for future modules, with a complete first Money Tracking module and a Python backend foundation.

The frontend app currently uses Vietnamese and VND. Project docs, scripts, and backend internals stay in English.

## Run

```bash
bash start_service.sh
```

Stop services started by the script:

```bash
bash stop_service.sh
```

On first run, the script creates `.env` from `.env.example`.
The start script launches both services in the background with `nohup`, writes `.service-pids`, and stores logs in `.service-logs/`.

This starts:

- API: `http://127.0.0.1:8000`
- UI: `http://127.0.0.1:5173`

Change ports in the root `.env` file:

```dotenv
BACKEND_PORT=8484
FRONTEND_PORT=5174
```

Then run `bash start_service.sh` again.

For LAN/public access, bind services to all interfaces, but set `API_BASE_URL` to the real IP or domain that browsers can reach:

```dotenv
BACKEND_HOST=0.0.0.0
FRONTEND_HOST=0.0.0.0
BACKEND_PORT=4578
FRONTEND_PORT=6060
API_BASE_URL=http://YOUR_SERVER_IP:4578
BACKEND_CORS_ORIGINS='["http://YOUR_SERVER_IP:6060"]'
```

Do not put the public IP in `BACKEND_HOST` or `FRONTEND_HOST` unless that IP is assigned directly to the server's network interface. Do not use `http://0.0.0.0:4578` as `API_BASE_URL`; `0.0.0.0` is only for server binding.

## Backend

The backend lives in `backend/` and provides FastAPI endpoints for authentication, friends, transactions, budgets, and monthly summaries. See `backend/README.md` for setup and API routes.

## Current Module

Money Tracking supports login/register, API-backed transactions, budgets, user-defined categories, friend budget-progress percentages, filters, category insights, and VND currency display.

## Extend

Add future modules to the `modules` array in `src/app.js`. Keep shared services such as configuration, authentication, database sessions, and money/date formatting in the shell/core layers.
