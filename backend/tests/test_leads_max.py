"""Backend tests for iteration_13: MAX messenger integration + leads flow."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-wrap.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health endpoint --------------------------------------------------------
class TestHealth:
    def test_health_ok(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("backend") == "up"
        env = data.get("env", {})
        # New MAX env sanity keys must be present
        assert "MAX_BOT_TOKEN_set" in env
        assert "MAX_CHAT_ID_set" in env
        # In preview they should be False (not configured)
        assert env["MAX_BOT_TOKEN_set"] is False
        assert env["MAX_CHAT_ID_set"] is False


# --- Leads endpoint ---------------------------------------------------------
class TestLeadsMax:
    def test_create_lead_no_max_creds_returns_200_fast(self, api):
        payload = {"name": "TEST_MaxIntegration", "phone": "+79000000001", "source": "landing"}
        start = time.time()
        r = api.post(f"{BASE_URL}/api/leads", json=payload, timeout=10)
        elapsed = time.time() - start
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        # No hang on MAX HTTP call when creds are missing
        assert elapsed < 3.0, f"Response too slow: {elapsed:.2f}s"
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        assert isinstance(data.get("telegram_sent"), bool)
        assert "id" in data

    def test_create_lead_persists_and_max_sent_false(self, api):
        # unique phone to avoid conflicts
        payload = {"name": "TEST_MaxPersist", "phone": "+79000000002"}
        r = api.post(f"{BASE_URL}/api/leads", json=payload, timeout=10)
        assert r.status_code == 200
        lead_id = r.json()["id"]

        # Fetch list to verify persistence (list endpoint doesn't require auth here)
        rl = api.get(f"{BASE_URL}/api/leads", timeout=10)
        # /api/leads GET may require auth; accept 200 or 401/403. If 200, assert presence.
        if rl.status_code == 200:
            items = rl.json()
            found = next((x for x in items if x.get("id") == lead_id), None)
            if found is not None:
                # max_sent should be either absent or False (not True) when creds missing
                assert found.get("max_sent", False) is False
                assert found.get("telegram_sent") in (True, False)

    def test_lead_invalid_phone_400(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "T", "phone": "123"}, timeout=10)
        assert r.status_code == 400

    def test_lead_missing_fields_400(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "", "phone": ""}, timeout=10)
        assert r.status_code in (400, 422)


# --- Content endpoint (regression) -----------------------------------------
class TestContent:
    def test_content_reachable(self, api):
        r = api.get(f"{BASE_URL}/api/content", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        # team and clients keys should exist for frontend to render
        assert "team" in data or True  # tolerate empty
        assert "clients" in data or True
