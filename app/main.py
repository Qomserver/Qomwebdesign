import os
from contextlib import asynccontextmanager
from typing import Iterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    generate_latest,
    multiprocess as prom_multiproc,
)
from slowapi.errors import RateLimitExceeded
from starlette.responses import Response

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.users import router as users_router
from app.core.config import settings
from app.core.security import bootstrap_initial_superuser
from app.db.base import Base
from app.db.session import create_session_factory, get_engine
from app.middleware.logging import configure_logging
from app.middleware.rate_limit import (
    SlowAPIMiddleware,
    limiter,
    rate_limit_exceeded_handler,
)
from app import models  # noqa: F401  # ensure models are imported and registered


@asynccontextmanager
async def lifespan(app: FastAPI) -> Iterator[None]:
    configure_logging()
    logger = structlog.get_logger()

    # Initialize DB connection pool and session factory
    engine = get_engine()
    create_session_factory(engine)

    # Auto-create tables in SQLite (dev/test convenience)
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(engine)

    # Bootstrap initial superuser if provided via env
    try:
        bootstrap_initial_superuser()
    except Exception as exc:  # noqa: BLE001
        logger.error("bootstrap_superuser_failed", error=str(exc))

    yield

    # On shutdown
    try:
        engine.dispose()
    except Exception as exc:  # noqa: BLE001
        logger.error("engine_dispose_failed", error=str(exc))


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url=None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])


# Prometheus metrics endpoint
@app.get("/metrics")
def metrics() -> Response:
    if "PROMETHEUS_MULTIPROC_DIR" in os.environ:
        registry = CollectorRegistry()
        prom_multiproc.MultiProcessCollector(registry)
        data = generate_latest(registry)
    else:
        data = generate_latest()
    return Response(data, media_type=CONTENT_TYPE_LATEST)
