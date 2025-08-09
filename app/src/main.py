from typing import Optional

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from .config import Settings, settings
from .db import engine
from .models import Base
from .routers import auth, health, tasks, users


def create_app(custom_settings: Optional[Settings] = None) -> FastAPI:
    cfg = custom_settings or settings

    Base.metadata.create_all(bind=engine)

    app = FastAPI(title=cfg.app_name, root_path=cfg.root_path)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    limiter = Limiter(key_func=lambda request: request.client.host)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, lambda request, exc: HTMLResponse("Rate limit exceeded", status_code=429))
    app.add_middleware(SlowAPIMiddleware)

    templates = Jinja2Templates(directory="app/src/templates")

    app.mount("/static", StaticFiles(directory="app/src/static"), name="static")

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(tasks.router)
    app.include_router(users.router)

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request):
        return templates.TemplateResponse("index.html", {"request": request})

    return app