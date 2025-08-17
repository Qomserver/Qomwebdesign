from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import RefreshToken, User
from ..schemas import LoginRequest, TokenPair, UserCreate, UserRead
from ..security import create_access_token, create_refresh_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=user_in.email, hashed_password=get_password_hash(user_in.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user is None or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    access = create_access_token(subject=user.email)
    refresh = create_refresh_token(subject=user.email)

    # Persist refresh token
    payload = {
        "user_id": user.id,
        "token": refresh,
        "revoked": False,
        "expires_at": datetime.fromtimestamp(
            __import__("jose").jwt.get_unverified_claims(refresh)["exp"], tz=timezone.utc
        ),
    }
    db.add(RefreshToken(**payload))
    db.commit()

    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenPair)
def refresh_token(token: str, db: Session = Depends(get_db)):
    # token provided as plain body string (or use schema); kept simple
    from ..security import decode_token

    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not a refresh token")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token payload")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db_token = db.query(RefreshToken).filter(RefreshToken.token == token, RefreshToken.revoked == False).first()  # noqa: E712
    if db_token is None or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid or expired")

    access = create_access_token(subject=user.email)
    new_refresh = create_refresh_token(subject=user.email)

    # rotate refresh token
    db_token.revoked = True
    db.add(RefreshToken(user_id=user.id, token=new_refresh, revoked=False, expires_at=db_token.expires_at))
    db.commit()

    return TokenPair(access_token=access, refresh_token=new_refresh)


@router.post("/logout")
def logout(token: str, db: Session = Depends(get_db)):
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token, RefreshToken.revoked == False).first()  # noqa: E712
    if db_token:
        db_token.revoked = True
        db.commit()
    return {"status": "ok"}