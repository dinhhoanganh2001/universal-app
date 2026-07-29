from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Universal App API"
    environment: str = "development"
    secret_key: str = Field(default="change-this-dev-secret")
    access_token_expire_minutes: int = 43200
    database_url: str = "sqlite:///./universal_app.db"
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000
    frontend_host: str = "127.0.0.1"
    frontend_port: int = 5173
    api_base_url: str = ""
    backend_cors_origins: list[str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    backend_cors_origin_regex: str | None = r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$"


settings = Settings()
