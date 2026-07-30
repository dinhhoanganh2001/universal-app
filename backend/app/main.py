from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import api_router
from app.core.config import settings
from app.db.session import Base, engine


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_origin_regex=settings.backend_cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_cors_preflight(request: Request, call_next):
        if request.method == "OPTIONS":
            print(
                "CORS preflight:",
                f"origin={request.headers.get('origin')!r}",
                f"method={request.headers.get('access-control-request-method')!r}",
                f"headers={request.headers.get('access-control-request-headers')!r}",
            )
        return await call_next(request)

    app.include_router(api_router, prefix="/api")

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        with engine.begin() as connection:
            if "avatar_url" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT '' NOT NULL")
                )
            if "currency" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN currency VARCHAR(3) DEFAULT 'VND' NOT NULL")
                )
            if "monthly_income" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN monthly_income NUMERIC(12, 2) DEFAULT 0 NOT NULL")
                )
            if "onboarding_completed" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0 NOT NULL")
                )

    if "friendships" in table_names:
        friendship_columns = {column["name"] for column in inspector.get_columns("friendships")}
        with engine.begin() as connection:
            if "requested_by_id" not in friendship_columns:
                connection.execute(text("ALTER TABLE friendships ADD COLUMN requested_by_id INTEGER"))
                connection.execute(text("UPDATE friendships SET requested_by_id = owner_id WHERE requested_by_id IS NULL"))
            if "status" not in friendship_columns:
                connection.execute(
                    text("ALTER TABLE friendships ADD COLUMN status VARCHAR(16) DEFAULT 'accepted' NOT NULL")
                )

    if "budgets" not in table_names:
        return

    budget_columns = {column["name"] for column in inspector.get_columns("budgets")}
    with engine.begin() as connection:
        if "minimum_amount" not in budget_columns:
            connection.execute(
                text("ALTER TABLE budgets ADD COLUMN minimum_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL")
            )
            connection.execute(text("UPDATE budgets SET minimum_amount = limit_amount WHERE minimum_amount = 0"))
        if "full_amount" not in budget_columns:
            connection.execute(
                text("ALTER TABLE budgets ADD COLUMN full_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL")
            )
            connection.execute(text("UPDATE budgets SET full_amount = limit_amount WHERE full_amount = 0"))
        if "color" not in budget_columns:
            connection.execute(
                text("ALTER TABLE budgets ADD COLUMN color VARCHAR(20) DEFAULT '#2563eb' NOT NULL")
            )


app = create_app()
