import os

from fastapi import status
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.main import app  # noqa: E402

client = TestClient(app)


def test_live():
    r = client.get("/health/live")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["status"] == "ok"


def test_ready():
    r = client.get("/health/ready")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["status"] == "ready"
