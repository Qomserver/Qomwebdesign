from contextlib import contextmanager
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base


class _DBState:
    engine: Optional[Engine] = None
    session_factory: Optional[sessionmaker] = None
    schema_initialized: bool = False


def get_engine() -> Engine:
    if _DBState.engine is None:
        connect_args = {}
        if settings.database_url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
        _DBState.engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
    return _DBState.engine


def create_session_factory(engine: Optional[Engine] = None) -> None:
    eng = engine or get_engine()
    _DBState.session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)


def _ensure_sqlite_schema_initialized() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    if not _DBState.schema_initialized:
        engine = get_engine()
        Base.metadata.create_all(engine)
        _DBState.schema_initialized = True


@contextmanager
def get_session() -> Generator[Session, None, None]:
    if _DBState.session_factory is None:
        create_session_factory()
    _ensure_sqlite_schema_initialized()
    assert _DBState.session_factory is not None
    db = _DBState.session_factory()
    try:
        yield db
    finally:
        db.close()
