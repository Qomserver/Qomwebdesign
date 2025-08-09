from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import require_superuser
from ..db import get_db
from ..models import User
from ..schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"]) 


@router.get("/", response_model=list[UserRead])
def list_users(_: User = Depends(require_superuser), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users