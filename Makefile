PYTHON ?= python3
PIP ?= $(PYTHON) -m pip
VENV ?= .venv
ACTIVATE = . $(VENV)/bin/activate

.PHONY: venv install dev run fmt lint test migrate revision alembic-upgrade

venv:
	$(PYTHON) -m venv $(VENV)
	$(ACTIVATE); $(PIP) install --upgrade pip

install: venv
	$(ACTIVATE); $(PIP) install -r requirements.txt

dev: venv
	$(ACTIVATE); $(PIP) install -r requirements-dev.txt

run:
	$(ACTIVATE); UVICORN_WORKERS=$${UVICORN_WORKERS:-2} uvicorn app.main:app --host 0.0.0.0 --port $${PORT:-8000}

fmt:
	$(ACTIVATE); ruff check --fix .
	$(ACTIVATE); black .

lint:
	$(ACTIVATE); ruff check .
	$(ACTIVATE); black --check .

test:
	DATABASE_URL=sqlite:///./test.db $(ACTIVATE); pytest

revision:
	$(ACTIVATE); alembic revision --autogenerate -m "auto"

migrate:
	$(ACTIVATE); alembic upgrade head

alembic-upgrade:
	$(ACTIVATE); alembic upgrade head