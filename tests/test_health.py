import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.sqlite3")

from fastapi.testclient import TestClient
from src.main import create_app


client = TestClient(create_app())


def test_health():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"