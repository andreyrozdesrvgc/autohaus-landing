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


# ---- /api/admin/me regression (verifies _jwt_secret in get_current_admin) ---
class TestAdminMe:
    def _login(self, api):
        r = api.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
        return r.json()["token"]

    def test_admin_me_with_bearer_token(self, api):
        token = self._login(api)
        r = requests.get(
            f"{BASE_URL}/api/admin/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert r.status_code == 200, f"expected 200 got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("email") == ADMIN_EMAIL
        assert data.get("role") == "admin"

    def test_admin_me_without_token_401(self):
        r = requests.get(f"{BASE_URL}/api/admin/me", timeout=15)
        assert r.status_code == 401


# ---- Unit test: _jwt_secret() raises 500 when JWT_SECRET is missing --------
class TestJwtSecretUnit:
    def test_jwt_secret_missing_raises_500_with_helpful_detail(self, monkeypatch):
        # Import locally so the module is loaded once and env is patched before call
        import sys
        # Ensure backend package is importable
        backend_path = "/app/backend"
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        import auth as auth_module  # type: ignore
        from fastapi import HTTPException

        monkeypatch.delenv("JWT_SECRET", raising=False)

        with pytest.raises(HTTPException) as exc_info:
            auth_module._jwt_secret()
        assert exc_info.value.status_code == 500
        detail = str(exc_info.value.detail)
        assert "JWT_SECRET is missing" in detail
        assert "backend/.env" in detail

    def test_jwt_secret_empty_string_also_raises_500(self, monkeypatch):
        import sys
        backend_path = "/app/backend"
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        import auth as auth_module  # type: ignore
        from fastapi import HTTPException

        monkeypatch.setenv("JWT_SECRET", "")
        with pytest.raises(HTTPException) as exc_info:
            auth_module._jwt_secret()
        assert exc_info.value.status_code == 500

    def test_jwt_secret_returns_value_when_set(self, monkeypatch):
        import sys
        backend_path = "/app/backend"
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        import auth as auth_module  # type: ignore

        monkeypatch.setenv("JWT_SECRET", "test-secret-abc-123")
        assert auth_module._jwt_secret() == "test-secret-abc-123"
