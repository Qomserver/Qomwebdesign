from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_by_email
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.user import Token, UserCreate

router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit(settings.rate_limit_auth)
def login_access_token(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


@router.post("/register", response_model=Token)
@limiter.limit(settings.rate_limit_auth)
def register(request: Request, user_in: UserCreate, db: Annotated[Session, Depends(get_db)]) -> Token:
    if not settings.allow_user_registration:
        raise HTTPException(status_code=403, detail="Registration disabled")

    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.email)
    return Token(access_token=token)
