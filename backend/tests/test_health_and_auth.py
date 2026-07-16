"""Backend tests for /api/health endpoint and /api/admin/login flow.
Focus: iteration 10 — diagnostic UX (health + error messages).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-wrap.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@detailing-autohaus.ru"
ADMIN_PASSWORD = "AutohausAdmin2026!"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- /api/health -----------------------------------------------------------
class TestHealth:
    def test_health_200_and_shape(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200, f"health returned {r.status_code}: {r.text}"
        data = r.json()
        assert data["status"] == "ok"
        assert data["backend"] == "up"
        assert data["mongodb"] == "connected"
        assert data["admin"] == "seeded"
        env = data["env"]
        for key in [
            "MONGO_URL_set",
            "DB_NAME_set",
            "JWT_SECRET_set",
            "ADMIN_EMAIL_set",
            "ADMIN_PASSWORD_set",
        ]:
            assert env.get(key) is True, f"{key} should be True, got {env.get(key)}"

    def test_health_is_public(self, api):
        # No Authorization header — must still respond 200
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200


# ---- /api/admin/login ------------------------------------------------------
class TestAdminLogin:
    def test_login_success(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert isinstance(data.get("token"), str) and len(data["token"]) > 10
        # httpOnly cookie set
        cookies = r.cookies
        assert "autohaus_admin" in cookies, f"cookie not set, got: {list(cookies.keys())}"

    def test_login_wrong_password_401(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-password-xxx"},
            timeout=15,
        )
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text}"

    def test_login_unknown_email_401(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "nobody@example.com", "password": "whatever"},
            timeout=15,
        )
        assert r.status_code == 401


# ---- /api/content regression -----------------------------------------------
class TestContent:
    def test_content_public_get(self, api):
        r = api.get(f"{BASE_URL}/api/content", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)
