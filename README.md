## ProdReadyApp (FastAPI + Postgres)

A production-ready web application with authentication and task management built with FastAPI, SQLAlchemy, Alembic, and PostgreSQL. Includes Docker, CI, tests, and secure defaults.

### Features
- JWT auth (access + refresh), password hashing
- Users + Tasks CRUD with ownership and admin controls
- SQLAlchemy 2.0 + Alembic migrations
- Health checks and Prometheus metrics
- Rate limiting, CORS, secure headers
- Gunicorn + Uvicorn workers
- Docker Compose for local/dev/prod
- GitHub Actions CI (lint + tests)

### Quickstart (Docker)
1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start services:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```
3. App available at `http://localhost:8000` (API docs at `/docs`).

### Local (no Docker)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r app/requirements.txt
export $(grep -v '^#' .env.example | xargs)  # or create .env
alembic -c app/alembic.ini upgrade head
uvicorn src.main:create_app --factory --host 0.0.0.0 --port 8000 --app-dir app
```

### Useful Make targets
```bash
make setup    # install deps
make run      # run dev server
make test     # run tests
make lint     # run linters
make format   # format code
make docker-up
```

### Migrations
```bash
alembic -c app/alembic.ini revision -m "message"
alembic -c app/alembic.ini upgrade head
```

### Configuration
Set environment variables (see `.env.example`). Defaults are safe for local dev. For production, always set `JWT_SECRET`, use strong DB credentials, and terminate TLS at a reverse proxy or load balancer.

### Security Notes
- Tokens are short-lived, refresh tokens persisted and revocable
- Rate limits applied to auth routes
- CORS is restricted via env
- Non-root container user

### License
MIT
