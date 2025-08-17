import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.sqlite3")

from fastapi.testclient import TestClient
from src.main import create_app


client = TestClient(create_app())


def test_register_and_login():
    # Register
    reg = client.post("/auth/register", json={"email": "user@example.com", "password": "StrongPass123"})
    assert reg.status_code == 201, reg.text

    # Login
    login = client.post("/auth/login", json={"email": "user@example.com", "password": "StrongPass123"})
    assert login.status_code == 200, login.text
    data = login.json()
    assert "access_token" in data and "refresh_token" in data