from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env",), env_prefix="", case_sensitive=False)

    app_name: str = "FastAPI Service"
    version: str = "0.1.0"
    environment: str = "development"  # development|staging|production
    debug: bool = False
    enable_docs: bool = True

    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    jwt_algorithm: str = "HS256"

    database_url: str = "sqlite:///./app.db"

    cors_allow_origins: List[str] = ["*"]

    # Registration
    allow_user_registration: bool = True

    # Rate limiting
    rate_limit_default: str = "100/minute"
    rate_limit_auth: str = "20/minute"

    # Bootstrap superuser
    first_superuser_email: str | None = None
    first_superuser_password: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
