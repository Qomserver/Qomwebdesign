PYTHON := python3
PIP := pip3
APP_DIR := app

.PHONY: setup run lint format test docker-build docker-up docker-down migrate revision

setup:
	$(PIP) install -r $(APP_DIR)/requirements.txt

run:
	uvicorn src.main:create_app --factory --host 0.0.0.0 --port 8000 --app-dir $(APP_DIR) --reload

lint:
	black --check $(APP_DIR) tests
	isort --check-only $(APP_DIR) tests
	flake8 $(APP_DIR) tests

format:
	black $(APP_DIR) tests
	isort $(APP_DIR) tests

test:
	pytest -q

revision:
	alembic -c $(APP_DIR)/alembic.ini revision -m "manual"

migrate:
	alembic -c $(APP_DIR)/alembic.ini upgrade head

docker-build:
	docker compose -f infra/docker-compose.yml build

docker-up:
	docker compose -f infra/docker-compose.yml up

docker-down:
	docker compose -f infra/docker-compose.yml down -v