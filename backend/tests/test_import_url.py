"""Tests for the new POST /api/admin/media/import-url endpoint plus regression
on GET /api/content, GET /api/media/{id}, admin login."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-wrap.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@detailing-autohaus.ru"
ADMIN_PASSWORD = "AutohausAdmin2026!"
YANDEX_URL = "https://disk.yandex.ru/i/8nm8HLfB1BL8Lw"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_headers(api_client):
    r = api_client.post(f"{BASE_URL}/api/admin/login",
                        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    token = r.json().get("token")
    assert token
    return {"Authorization": f"Bearer {token}"}


# --- Regression: public content -----------------------------------------------
class TestContentRegression:
    def test_get_content_public(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/content")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        assert "hero" in data
        assert isinstance(data["hero"], dict)


# --- Admin auth ---------------------------------------------------------------
class TestAdminAuth:
    def test_login_success(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/admin/login",
                            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert isinstance(data["token"], str) and len(data["token"]) > 20


# --- import-url endpoint ------------------------------------------------------
class TestImportUrl:
    def test_import_without_auth_returns_401_or_403(self):
        # Fresh session without cookies/headers to prove endpoint requires auth
        clean = requests.Session()
        r = clean.post(f"{BASE_URL}/api/admin/media/import-url",
                       json={"url": YANDEX_URL},
                       headers={"Content-Type": "application/json"})
        assert r.status_code in (401, 403), f"unexpected {r.status_code}: {r.text}"

    def test_import_invalid_url_returns_400(self, api_client, auth_headers):
        r = api_client.post(f"{BASE_URL}/api/admin/media/import-url",
                            json={"url": "not-a-url"},
                            headers=auth_headers)
        assert r.status_code == 400, r.text
        detail = r.json().get("detail", "")
        assert "http" in detail.lower(), f"expected 'http' hint, got: {detail}"

    def test_import_yandex_disk_url_success(self, api_client, auth_headers):
        r = api_client.post(f"{BASE_URL}/api/admin/media/import-url",
                            json={"url": YANDEX_URL},
                            headers=auth_headers,
                            timeout=120)
        # External API might rate-limit; skip if 5xx from upstream but our own 500 wraps error msg.
        if r.status_code == 500 and "429" in r.text:
            pytest.skip(f"Yandex Disk rate limited: {r.text}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["url"].startswith("/api/media/")
        assert data["content_type"].startswith("video/")
        # user URL is /i/8nm8HLfB1BL8Lw pointing to 1.mp4 ~2.8MB
        assert data["filename"].endswith(".mp4")
        assert 2_500_000 < int(data["size"]) < 3_500_000
        # stash for next test
        pytest.imported_media_id = data["id"]
        pytest.imported_media_size = int(data["size"])


# --- GET /api/media/{id} ------------------------------------------------------
class TestGetMedia:
    def test_get_imported_media_ok(self, api_client):
        media_id = getattr(pytest, "imported_media_id", None)
        if not media_id:
            pytest.skip("no imported media id (import test skipped or failed)")
        r = api_client.get(f"{BASE_URL}/api/media/{media_id}", stream=True, timeout=60)
        assert r.status_code == 200, r.text
        ct = r.headers.get("Content-Type", "")
        assert ct.startswith("video/"), ct
        cl = int(r.headers.get("Content-Length", "0"))
        assert cl == pytest.imported_media_size, (cl, pytest.imported_media_size)
        assert r.headers.get("Accept-Ranges") == "bytes"
        r.close()

    def test_get_media_range_request(self, api_client):
        media_id = getattr(pytest, "imported_media_id", None)
        if not media_id:
            pytest.skip("no imported media id")
        r = api_client.get(f"{BASE_URL}/api/media/{media_id}",
                           headers={"Range": "bytes=0-1023"},
                           stream=True, timeout=30)
        assert r.status_code == 206, r.text
        assert r.headers.get("Content-Range", "").startswith("bytes 0-1023/")
        assert int(r.headers.get("Content-Length", "0")) == 1024
        r.close()

    def test_get_media_not_found(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/media/000000000000000000000000")
        assert r.status_code == 404
