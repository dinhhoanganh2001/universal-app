from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Universal App API"
    environment: str = "development"
    secret_key: str = Field(default="change-this-dev-secret")
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./universal_app.db"
    backend_cors_origins: list[str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
