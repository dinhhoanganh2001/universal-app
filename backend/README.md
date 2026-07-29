# Universal App Backend

FastAPI backend for the Universal App. It currently supports authentication, social friend links, and the Money module, with a structure intended for more modules later.

## Stack

- FastAPI for HTTP APIs.
- SQLAlchemy for database models and sessions.
- SQLite by default through `DATABASE_URL`.
- JWT bearer tokens for authentication.
- Password hashing with bcrypt.

## Setup

For the full local app, configure ports and shared settings in the root `.env` file, then run from the project root:

```bash
bash start_service.sh
```

The script starts both API and UI in the background with `nohup`, passes the configured API URL to the frontend, records `.service-pids`, and writes logs under `.service-logs/`.

To run only the backend manually:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000` by default. Use `start_service.sh` when you want the root `.env` port values to launch both services together.

## Core Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `PATCH /api/auth/password`
- `GET /api/friends?month=YYYY-MM`
- `POST /api/friends`
- `POST /api/friends/requests/{request_id}/accept?month=YYYY-MM`
- `DELETE /api/friends/requests/{request_id}`
- `DELETE /api/friends/{friend_id}`
- `GET /api/money/categories`
- `POST /api/money/categories`
- `PATCH /api/money/categories/{category_id}`
- `DELETE /api/money/categories/{category_id}`
- `GET /api/money/transactions`
- `POST /api/money/transactions`
- `PATCH /api/money/transactions/{transaction_id}`
- `DELETE /api/money/transactions/{transaction_id}`
- `GET /api/money/budgets?month=YYYY-MM`
- `PUT /api/money/budgets`
- `PATCH /api/money/budgets/{budget_id}`
- `DELETE /api/money/budgets/{budget_id}`
- `GET /api/money/summary?month=YYYY-MM`

OpenAPI docs are available at `http://127.0.0.1:8000/docs` when the server is running.

## Extension Pattern

Add new domains under `app/api/v1/`, `app/models/`, and `app/schemas/`, then register their router in `app/api/routes.py`. Shared concerns such as settings, auth, and database sessions stay under `app/core/` and `app/db/`.
