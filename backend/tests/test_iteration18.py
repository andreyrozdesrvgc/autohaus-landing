"""Iteration 18 tests: MAX webhook, /api/leads with Telegram, thank_you content."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://luxury-wrap.preview.emergentagent.com"
API = f"{BASE_URL}/api"


class TestMaxWebhook:
    def test_webhook_accepts_json_returns_ok(self):
        start = time.time()
        r = requests.post(f"{API}/max/webhook", json={"update_type": "message_created", "message": {"body": {"text": "hi"}}}, timeout=10)
        elapsed = time.time() - start
        assert r.status_code == 200
        assert elapsed < 5
        data = r.json()
        assert data.get("ok") is True

    def test_webhook_accepts_empty_body(self):
        r = requests.post(f"{API}/max/webhook", data=b"", headers={"Content-Type": "application/json"}, timeout=10)
        assert r.status_code == 200


class TestLeadsFlow:
    def test_create_lead_success_telegram(self):
        payload = {
            "name": "TEST_Iteration18",
            "phone": "+79991234567",
            "source": "test_backend",
            "message": "автотест — не звонить",
        }
        r = requests.post(f"{API}/leads", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert "id" in data
        # telegram_sent should be True given backend has token configured
        assert data.get("telegram_sent") is True, f"telegram_sent is False - check backend logs. Response: {data}"

    def test_lead_invalid_phone_400(self):
        r = requests.post(f"{API}/leads", json={"name": "TEST_bad", "phone": "12345"}, timeout=10)
        assert r.status_code == 400


class TestContent:
    def test_content_has_thank_you_keys(self):
        r = requests.get(f"{API}/content", timeout=10)
        assert r.status_code == 200
        content = r.json()
        assert "thank_you" in content, f"thank_you section missing. Keys: {list(content.keys())}"
        ty = content["thank_you"]
        required = ["overline", "title_line_1", "title_line_2_grey", "description",
                    "messenger_prompt", "telegram_url", "whatsapp_url", "max_url",
                    "maps_url", "maps_label", "back_home_label"]
        missing = [k for k in required if k not in ty]
        assert not missing, f"Missing thank_you keys: {missing}"


class TestAdminThankYouEdit:
    @pytest.fixture(scope="class")
    def token(self):
        email = os.environ.get("ADMIN_EMAIL", "admin@detailing-autohaus.ru")
        password = os.environ.get("ADMIN_PASSWORD", "AutohausAdmin2026!")
        r = requests.post(f"{API}/admin/login", json={"email": email, "password": password}, timeout=10)
        if r.status_code != 200:
            pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
        return r.json()["token"]

    def test_edit_thank_you_telegram_url_and_revert(self, token):
        headers = {"Authorization": f"Bearer {token}"}
        # Get current
        r = requests.get(f"{API}/content", timeout=10)
        content = r.json()
        original = content["thank_you"].get("telegram_url", "https://t.me/detailing_autohaus")

        # Update
        content["thank_you"]["telegram_url"] = "https://t.me/test_link"
        r = requests.put(f"{API}/admin/content", json=content, headers=headers, timeout=10)
        assert r.status_code == 200, r.text

        # Verify persisted
        r = requests.get(f"{API}/content", timeout=10)
        assert r.json()["thank_you"]["telegram_url"] == "https://t.me/test_link"

        # Revert
        content["thank_you"]["telegram_url"] = original
        r = requests.put(f"{API}/admin/content", json=content, headers=headers, timeout=10)
        assert r.status_code == 200
        r = requests.get(f"{API}/content", timeout=10)
        assert r.json()["thank_you"]["telegram_url"] == original


class TestTeamCount:
    def test_team_has_6_members(self):
        r = requests.get(f"{API}/content", timeout=10)
        assert r.status_code == 200
        members = r.json().get("team", {}).get("members", [])
        assert len(members) == 6, f"Expected 6 team members, got {len(members)}"
