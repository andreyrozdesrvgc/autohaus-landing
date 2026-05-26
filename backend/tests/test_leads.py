"""Backend tests for AUTOHAUS lead endpoints + Telegram message builder."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-wrap.preview.emergentagent.com").rstrip("/")
LEADS_URL = f"{BASE_URL}/api/leads"


def _ip(label: str) -> str:
    # Synthesize a distinct IP per test to bypass per-IP rate-limit.
    h = abs(hash(label)) % 250 + 2
    return f"10.99.{h}.{h}"


def _client(ip_label: str):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "X-Forwarded-For": _ip(ip_label),
    })
    return s


# --- Module: POST /api/leads happy paths ----------------------------------
class TestLeadCreate:
    def test_full_configurator_payload(self):
        c = _client("full_cfg")
        payload = {
            "name": "TEST_Cfg User",
            "phone": "+7 (900) 123-45-67",
            "car": "—",
            "message": "Заявка из конфигуратора",
            "source": "configurator",
            "configuration": {
                "film": "Полиуретан (PPF)",
                "finish": "Мат",
                "coverage": "Полный кузов",
                "antichrome": True,
                "darkout": False,
                "headlights": True,
                "estimated_price": 312480,
            },
            "utm_source": "google",
            "utm_campaign": "winter",
            "utm_medium": "cpc",
            "utm_content": "ad1",
            "utm_term": "ppf",
            "referrer": "https://google.com",
            "device": "Mac",
            "page_url": "https://autohaus.example/?utm_source=google",
        }
        r = c.post(LEADS_URL, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert "telegram_sent" in data
        assert data["name"] == "TEST_Cfg User"
        assert data["configuration"]["film"] == "Полиуретан (PPF)"
        assert data["configuration"]["estimated_price"] == 312480
        assert data["utm_source"] == "google"
        assert data["source"] == "configurator"

    def test_utm_persisted_in_list(self):
        c = _client("utm_persist")
        unique = f"TEST_UTM_{int(time.time())}"
        payload = {
            "name": unique, "phone": "+79991112233",
            "utm_source": "yandex", "utm_campaign": "brand",
            "utm_medium": "cpc", "utm_content": "x1", "utm_term": "wrap",
            "referrer": "https://yandex.ru", "device": "iPhone",
            "page_url": "https://autohaus.example/",
        }
        r = c.post(LEADS_URL, json=payload)
        assert r.status_code == 200
        lid = r.json()["id"]

        r2 = requests.get(LEADS_URL, timeout=10)
        assert r2.status_code == 200
        items = r2.json()
        match = next((x for x in items if x["id"] == lid), None)
        assert match is not None, "Newly created lead not in /leads list"
        assert match["utm_source"] == "yandex"
        assert match["utm_campaign"] == "brand"
        assert match["device"] == "iPhone"

    def test_leads_sorted_desc_by_created_at(self):
        c = _client("sort_desc")
        ids = []
        for i in range(2):
            r = c.post(LEADS_URL, json={"name": f"TEST_Sort{i}", "phone": "+79990001122"})
            assert r.status_code == 200
            ids.append(r.json()["id"])
            time.sleep(0.05)
        items = requests.get(LEADS_URL, timeout=10).json()
        # Find positions
        pos = {it["id"]: idx for idx, it in enumerate(items)}
        assert pos[ids[1]] < pos[ids[0]], "Latest lead should appear first (desc order)"


# --- Module: Validation ---------------------------------------------------
class TestLeadValidation:
    def test_empty_name(self):
        c = _client("val_name")
        r = c.post(LEADS_URL, json={"name": "  ", "phone": "+79990001234"})
        assert r.status_code == 400

    def test_empty_phone(self):
        c = _client("val_phone")
        r = c.post(LEADS_URL, json={"name": "TEST_X", "phone": ""})
        assert r.status_code == 400

    def test_invalid_phone_no_digits(self):
        c = _client("val_nodig")
        r = c.post(LEADS_URL, json={"name": "TEST_X", "phone": "abcdefg"})
        assert r.status_code == 400

    def test_name_too_long(self):
        c = _client("val_long")
        r = c.post(LEADS_URL, json={"name": "x" * 201, "phone": "+79990001234"})
        assert r.status_code == 400


# --- Module: Honeypot -----------------------------------------------------
class TestHoneypot:
    def test_honeypot_drops_lead_silently(self):
        c = _client("honeypot")
        marker = f"TEST_HONEYPOT_{int(time.time())}"
        r = c.post(LEADS_URL, json={
            "name": marker, "phone": "+79990001111",
            "website": "spam.com",
        })
        # Silent 200 so bots don't learn
        assert r.status_code == 200
        # But lead must NOT be persisted
        items = requests.get(LEADS_URL, timeout=10).json()
        assert not any(it.get("name") == marker for it in items), \
            "Honeypot-triggered lead should not be stored"


# --- Module: Rate limit ---------------------------------------------------
class TestRateLimit:
    def test_sixth_request_returns_429(self):
        c = _client("ratelimit_unique_ip_zzz")
        statuses = []
        for i in range(6):
            r = c.post(LEADS_URL, json={"name": f"TEST_RL{i}", "phone": "+79990002233"})
            statuses.append(r.status_code)
        assert statuses[:5] == [200] * 5, f"First 5 should pass: {statuses}"
        assert statuses[5] == 429, f"6th should be 429, got {statuses}"


# --- Module: Telegram message builder (offline unit) ----------------------
class TestTelegramMessageBuilder:
    def test_build_lead_message_structure(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from telegram_service import build_lead_message  # noqa

        payload = {
            "id": "abc-123",
            "name": "Иван",
            "phone": "+7 900 111-22-33",
            "source": "configurator",
            "configuration": {
                "film": "Полиуретан (PPF)",
                "finish": "Мат",
                "coverage": "Полный кузов",
                "antichrome": True,
                "darkout": False,  # should be skipped
                "headlights": True,
                "estimated_price": 312480,
            },
            "utm_source": "google",
            "utm_campaign": "winter",
            "utm_medium": "cpc",
            "device": "Mac",
            "referrer": "https://r.example",
            "page_url": "https://autohaus.example/",
        }
        msg = build_lead_message(payload)
        assert "AUTOHAUS" in msg
        assert "Иван" in msg
        assert "+7 900 111-22-33" in msg
        # Configurator block
        assert "Конфигурация" in msg
        assert "Полиуретан (PPF)" in msg
        assert "Мат" in msg
        assert "Полный кузов" in msg
        assert "Антихром" in msg
        assert "312 480" in msg  # money formatting w/ space sep
        # darkout=False should not appear as a line
        assert "Чёрные элементы:" not in msg
        # Analytics
        assert "Аналитика" in msg
        assert "google" in msg
        assert "winter" in msg
        assert "cpc" in msg
        assert "Mac" in msg
        assert "abc-123" in msg

    def test_build_lead_message_minimal(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from telegram_service import build_lead_message

        msg = build_lead_message({"name": "A", "phone": "+79990000000"})
        assert "AUTOHAUS" in msg
        assert "A" in msg
        assert "Конфигурация" not in msg
        assert "Аналитика" not in msg
