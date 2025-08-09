# Production-Ready FastAPI Service

A secure, scalable, and production-ready FastAPI service with JWT auth, SQLAlchemy, Alembic migrations, rate limiting, metrics, Docker, CI, and Kubernetes manifests.

## Features
- FastAPI with pydantic v2
- JWT authentication (access tokens)
- SQLAlchemy 2.0 ORM + Alembic migrations
- Rate limiting (slowapi)
- Prometheus metrics at `/metrics`
- Health probes at `/health/live` and `/health/ready`
- Dockerfile and docker-compose for local Postgres
- CI (lint + tests) via GitHub Actions
- Kubernetes manifests

## Quickstart (local)
1. Python 3.11+
2. Create virtualenv and install deps:
   ```bash
   make dev
   ```
3. Run API (SQLite by default):
   ```bash
   make run
   ```
4. Open docs: `http://localhost:8000/docs`

## Environment
Copy `.env.example` to `.env` and adjust as needed. Key vars:
- `SECRET_KEY` (required in production)
- `DATABASE_URL` (Postgres in prod; SQLite default for dev/tests)
- `FIRST_SUPERUSER_EMAIL`, `FIRST_SUPERUSER_PASSWORD` (optional bootstrap)
- `ALLOW_USER_REGISTRATION` (default: true)

## Docker (local with Postgres)
```bash
docker compose up --build
```

## Migrations
```bash
make migrate     # apply
make revision    # create new from models
```

## Tests
```bash
make test
```

## Deploy
- Build container image with `Dockerfile`
- Use `k8s/` manifests or integrate into your platform (ECS, GKE, etc.)
- Configure probes and resources as shown in `k8s/deployment.yaml`

## Security
- Set strong `SECRET_KEY`
- Run behind HTTPS (ingress/ALB)
- Review CORS settings in `app/main.py`
- Rotate tokens, limit exposure

## Structure
```
app/
  api/ routes, deps
  core/ config, security
  db/ engine, base
  models/
  schemas/
  middleware/
  utils/
```
