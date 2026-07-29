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
    if "budgets" not in inspector.get_table_names():
        return

    budget_columns = {column["name"] for column in inspector.get_columns("budgets")}
    if "color" not in budget_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE budgets ADD COLUMN color VARCHAR(20) DEFAULT '#2563eb' NOT NULL")
            )


app = create_app()
