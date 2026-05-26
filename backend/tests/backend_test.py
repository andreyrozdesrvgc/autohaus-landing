"""Backend API tests for M.STUDIO landing page."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://luxury-wrap.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json() == {"message": "Hello World"}


# --- Leads CRUD ---
class TestLeads:
    def test_create_lead_success(self, api):
        payload = {
            "name": "TEST_Alex",
            "phone": "+79991234567",
            "car": "BMW M3",
            "message": "PPF full",
            "source": "configurator",
            "configuration": {
                "film": "PPF",
                "finish": "Matte",
                "coverage": "Full",
                "antichrome": True,
                "darkout": False,
                "headlights": True,
                "estimated_price": 350000,
            },
        }
        r = api.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Alex"
        assert data["phone"] == "+79991234567"
        assert data["source"] == "configurator"
        assert data["configuration"]["estimated_price"] == 350000
        assert "id" in data and isinstance(data["id"], str)
        assert "created_at" in data

    def test_create_lead_empty_name_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "", "phone": "+79991234567"})
        assert r.status_code == 400

    def test_create_lead_whitespace_name_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "   ", "phone": "+79991234567"})
        assert r.status_code == 400

    def test_create_lead_empty_phone_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "TEST_Bob", "phone": ""})
        assert r.status_code == 400

    def test_create_lead_whitespace_phone_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"name": "TEST_Bob", "phone": "   "})
        assert r.status_code == 400

    def test_create_lead_missing_name_field(self, api):
        r = api.post(f"{BASE_URL}/api/leads", json={"phone": "+79991234567"})
        # FastAPI Pydantic validation -> 422
        assert r.status_code in (400, 422)

    def test_list_leads_sorted_desc(self, api):
        # Create two leads
        r1 = api.post(f"{BASE_URL}/api/leads", json={"name": "TEST_First", "phone": "+71111111111", "source": "contact_form"})
        assert r1.status_code == 200
        first_id = r1.json()["id"]

        r2 = api.post(f"{BASE_URL}/api/leads", json={"name": "TEST_Second", "phone": "+72222222222", "source": "contact_form"})
        assert r2.status_code == 200
        second_id = r2.json()["id"]

        r = api.get(f"{BASE_URL}/api/leads")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 2

        # Find indices
        ids = [it["id"] for it in items]
        assert second_id in ids and first_id in ids
        # Newer (second_id) should appear before first_id since sorted desc by created_at
        assert ids.index(second_id) < ids.index(first_id)

        # No mongo _id leaked
        for it in items[:5]:
            assert "_id" not in it

    def test_list_leads_returns_configuration(self, api):
        payload = {
            "name": "TEST_ConfigCheck",
            "phone": "+73333333333",
            "source": "configurator",
            "configuration": {"film": "Vinyl", "finish": "Gloss", "estimated_price": 120000},
        }
        post = api.post(f"{BASE_URL}/api/leads", json=payload)
        assert post.status_code == 200
        created_id = post.json()["id"]

        r = api.get(f"{BASE_URL}/api/leads")
        assert r.status_code == 200
        found = next((it for it in r.json() if it["id"] == created_id), None)
        assert found is not None
        assert found["configuration"]["estimated_price"] == 120000
        assert found["source"] == "configurator"
