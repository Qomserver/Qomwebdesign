import os

from fastapi import status
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.main import app  # noqa: E402

client = TestClient(app)


def test_register_and_login_and_me():
    # register
    r = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "verysecurepassword", "full_name": "User"},
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    token = r.json()["access_token"]
    assert token

    # login
    r = client.post(
        "/auth/login",
        data={"username": "user@example.com", "password": "verysecurepassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    token2 = r.json()["access_token"]
    assert token2

    # me
    r = client.get("/users/me", headers={"Authorization": f"Bearer {token2}"})
    assert r.status_code == status.HTTP_200_OK, r.text
    me = r.json()
    assert me["email"] == "user@example.com"
