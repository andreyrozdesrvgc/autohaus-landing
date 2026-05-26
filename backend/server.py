from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from collections import deque
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone

from telegram_service import send_lead_to_telegram


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# --- Simple in-memory rate limiter (per IP) ---------------------------------
# Allows up to RATE_LIMIT_MAX leads per RATE_LIMIT_WINDOW seconds per IP.
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60.0  # seconds
_rate_buckets: dict[str, deque] = {}


def _check_rate_limit(ip: str) -> bool:
    now = time.monotonic()
    bucket = _rate_buckets.setdefault(ip, deque())
    while bucket and (now - bucket[0]) > RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX:
        return False
    bucket.append(now)
    return True


# Models ---------------------------------------------------------------------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class LeadCreate(BaseModel):
    name: str
    phone: str
    car: Optional[str] = None
    message: Optional[str] = None
    configuration: Optional[dict] = None
    source: Optional[str] = "landing"

    # Anti-spam honeypot — must remain empty.
    website: Optional[str] = ""

    # UTM / analytics
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    referrer: Optional[str] = None
    device: Optional[str] = None
    page_url: Optional[str] = None


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    car: Optional[str] = None
    message: Optional[str] = None
    configuration: Optional[dict] = None
    source: Optional[str] = "landing"

    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    referrer: Optional[str] = None
    device: Optional[str] = None
    page_url: Optional[str] = None

    telegram_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Routes ---------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


def _phone_is_valid(phone: str) -> bool:
    digits = "".join(c for c in phone if c.isdigit())
    # Russian mobile format: exactly 11 digits, must start with 7 (or 8 → normalised to 7)
    if len(digits) == 11 and digits[0] == "8":
        digits = "7" + digits[1:]
    return len(digits) == 11 and digits[0] == "7"


@api_router.post("/leads", response_model=Lead)
async def create_lead(payload: LeadCreate, request: Request):
    # 1) Honeypot — silently 200 to avoid signalling bots.
    if (payload.website or "").strip():
        logger.warning("Honeypot triggered, dropping lead")
        return Lead(name=payload.name or "spam", phone=payload.phone or "spam", source=payload.source)

    # 2) Validation
    name = (payload.name or "").strip()
    phone = (payload.phone or "").strip()
    if not name or not phone:
        raise HTTPException(status_code=400, detail="Name and phone are required")
    if len(name) > 200 or len(phone) > 64:
        raise HTTPException(status_code=400, detail="Name or phone too long")
    if not _phone_is_valid(phone):
        raise HTTPException(status_code=400, detail="Phone number looks invalid")

    # 3) Rate limit
    client_ip = (
        (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
    if not _check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests, slow down")

    # 4) Persist
    data = payload.model_dump()
    data.pop("website", None)  # never store honeypot
    lead = Lead(**data)
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leads.insert_one(doc)

    # 5) Notify Telegram (best-effort, doesn't fail the request)
    notify_payload: dict[str, Any] = {**data, "id": lead.id}
    telegram_sent = await send_lead_to_telegram(notify_payload)
    if telegram_sent:
        lead.telegram_sent = True
        await db.leads.update_one({"id": lead.id}, {"$set": {"telegram_sent": True}})

    return lead


@api_router.get("/leads", response_model=List[Lead])
async def list_leads():
    items = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
