from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "ProdReadyApp"
    env: str = "development"
    root_path: str = ""
    metrics_enabled: bool = True

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: List[str] = ["http://localhost:8000"]

    database_url: str = "sqlite:///./app.sqlite3"

    rate_limit: str = "100/minute"


settings = Settings()