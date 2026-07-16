from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
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
from auth import (
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_admin,
    seed_admin,
)
from content_service import get_content, save_content
from media_service import (
    ALLOWED_MIME_PREFIXES,
    MAX_UPLOAD_BYTES,
    save_file,
    import_from_url,
    find_file_meta,
    iter_grid_range,
    parse_range,
    guess_content_type,
)


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


@api_router.get("/health")
async def health():
    """Публичный health-check: проверяет что backend жив, MongoDB отвечает
    и админ засеeжен. Используйте на VPS: curl http://127.0.0.1:8001/api/health"""
    result = {"status": "ok", "backend": "up"}
    # DB check
    try:
        await db.command("ping")
        result["mongodb"] = "connected"
    except Exception as e:
        result["status"] = "degraded"
        result["mongodb"] = f"error: {e}"

    # Admin seeded check
    try:
        email = os.environ.get("ADMIN_EMAIL")
        if not email:
            result["admin"] = "no ADMIN_EMAIL env var"
            result["status"] = "degraded"
        else:
            found = await db.admins.find_one({"email": email})
            result["admin"] = "seeded" if found else "NOT seeded — check ADMIN_EMAIL/ADMIN_PASSWORD in backend/.env"
            if not found:
                result["status"] = "degraded"
    except Exception as e:
        result["admin"] = f"check failed: {e}"

    # Env sanity
    result["env"] = {
        "MONGO_URL_set": bool(os.environ.get("MONGO_URL")),
        "DB_NAME_set": bool(os.environ.get("DB_NAME")),
        "JWT_SECRET_set": bool(os.environ.get("JWT_SECRET")),
        "ADMIN_EMAIL_set": bool(os.environ.get("ADMIN_EMAIL")),
        "ADMIN_PASSWORD_set": bool(os.environ.get("ADMIN_PASSWORD")),
    }
    return result


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
# NOTE: include_router must come AFTER all @api_router decorators below (admin/content/media).

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


# --- Admin auth -------------------------------------------------------------
class AdminLoginIn(BaseModel):
    email: str
    password: str


@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginIn, response: Response):
    email = (payload.email or "").strip().lower()
    expected_email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if email != expected_email:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    admin_doc = await db.admins.find_one({"email": expected_email})
    if not admin_doc or not verify_password(payload.password, admin_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(expected_email)
    set_auth_cookie(response, token)
    return {"email": expected_email, "role": "admin", "token": token}


@api_router.post("/admin/logout")
async def admin_logout(response: Response, admin: dict = Depends(get_current_admin)):
    clear_auth_cookie(response)
    return {"ok": True}


@api_router.get("/admin/me")
async def admin_me(admin: dict = Depends(get_current_admin)):
    return admin


# --- CMS content ------------------------------------------------------------
@api_router.get("/content")
async def fetch_content():
    return await get_content(db)


@api_router.put("/admin/content")
async def update_content(payload: dict, admin: dict = Depends(get_current_admin)):
    return await save_content(db, payload or {})


# --- Media upload / serve ---------------------------------------------------
@api_router.post("/admin/media")
async def upload_media(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    content_type = file.content_type or guess_content_type(file.filename)
    if not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        raise HTTPException(status_code=400, detail="Only image/* and video/* uploads are allowed")
    payload = await file.read()
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 80 MB)")
    if not payload:
        raise HTTPException(status_code=400, detail="Empty file")
    file_id = await save_file(db, file.filename or "upload.bin", content_type, payload)
    return {
        "id": file_id,
        "url": f"/api/media/{file_id}",
        "filename": file.filename,
        "content_type": content_type,
        "size": len(payload),
    }


class ImportUrlPayload(BaseModel):
    url: str


@api_router.post("/admin/media/import-url")
async def import_media_from_url(payload: ImportUrlPayload, admin: dict = Depends(get_current_admin)):
    """Скачивает файл по публичной ссылке (в том числе Яндекс.Диск /i/xxx)
    и сохраняет его в GridFS. Возвращает постоянный /api/media/{id} URL."""
    try:
        return await import_from_url(db, payload.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("import_from_url failed")
        raise HTTPException(status_code=500, detail=f"Не удалось импортировать файл: {e}")


@api_router.head("/media/{file_id}")
async def head_media(file_id: str, request: Request):
    meta = await find_file_meta(db, file_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Media not found")
    file_size = int(meta.get("length", 0))
    content_type = (meta.get("metadata") or {}).get("content_type") or guess_content_type(meta.get("filename") or "")
    return Response(
        status_code=200,
        media_type=content_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
        },
    )


@api_router.get("/media/{file_id}")
async def get_media(file_id: str, request: Request):
    meta = await find_file_meta(db, file_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Media not found")

    file_size = int(meta.get("length", 0))
    content_type = (meta.get("metadata") or {}).get("content_type") or guess_content_type(meta.get("filename") or "")

    range_header = request.headers.get("range") or request.headers.get("Range")
    rng = parse_range(range_header, file_size) if range_header else None

    common_headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
        "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    }

    if rng is not None:
        start, end = rng
        length = end - start + 1
        headers = {
            **common_headers,
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(length),
        }
        return StreamingResponse(
            iter_grid_range(db, file_id, start, end),
            status_code=206,
            headers=headers,
            media_type=content_type,
        )

    # Full file
    headers = {
        **common_headers,
        "Content-Length": str(file_size),
    }
    return StreamingResponse(
        iter_grid_range(db, file_id, 0, file_size - 1),
        media_type=content_type,
        headers=headers,
    )


@app.on_event("startup")
async def _startup():
    # Log which critical env vars are missing — helps diagnose "cannot login" on VPS
    critical = ["MONGO_URL", "DB_NAME", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]
    missing = [k for k in critical if not os.environ.get(k)]
    if missing:
        logger.error(
            "❌ MISSING critical env vars in backend/.env: %s — админ логин не будет работать!",
            ", ".join(missing),
        )
    try:
        await seed_admin(db)
        # Verify admin actually exists in DB after seed
        email = os.environ.get("ADMIN_EMAIL")
        if email:
            found = await db.admins.find_one({"email": email})
            if found:
                logger.info("✅ Admin seeded / verified: %s", email)
            else:
                logger.error("❌ Admin NOT in DB after seed — check backend/.env has ADMIN_EMAIL and ADMIN_PASSWORD")
    except Exception as e:
        logger.exception("Failed to seed admin: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Include the router AFTER all @api_router endpoints have been registered.
app.include_router(api_router)
