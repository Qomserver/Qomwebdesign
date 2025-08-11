from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from passlib.context import CryptContext
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta_minutes: Optional[int] = None) -> str:
    to_encode: dict[str, Any] = {
        "sub": subject,
        "iat": int(datetime.now(tz=timezone.utc).timestamp()),
    }
    expire_minutes = (
        expires_delta_minutes
        if expires_delta_minutes is not None
        else settings.access_token_expire_minutes
    )
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt


def bootstrap_initial_superuser() -> None:
    if not settings.first_superuser_email or not settings.first_superuser_password:
        return

    with get_session() as db:
        existing = db.execute(
            select(User).where(User.email == settings.first_superuser_email)
        ).scalar_one_or_none()
        if existing:
            return
        user = User(
            email=settings.first_superuser_email.lower(),
            full_name="admin",
            hashed_password=get_password_hash(settings.first_superuser_password),
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
