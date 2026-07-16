"""Single-admin JWT authentication for the AUTOHAUS CMS."""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request, Response

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_DAYS = 7
COOKIE_NAME = "autohaus_admin"


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        # Bail out with a HELPFUL 500 message instead of a raw KeyError trace.
        # Any 500 with this exact detail means the ops person should edit
        # backend/.env and add JWT_SECRET=<any-long-random-string>.
        raise HTTPException(
            status_code=500,
            detail=(
                "JWT_SECRET is missing in backend/.env. "
                "Add a line like: JWT_SECRET=<random-32+-char-string> and restart PM2."
            ),
        )
    return secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_TTL_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_TTL_DAYS * 24 * 3600,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def _extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


async def get_current_admin(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin" or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("sub") != os.environ.get("ADMIN_EMAIL"):
        raise HTTPException(status_code=401, detail="Unknown admin")
    return {"email": payload["sub"], "role": "admin"}


async def seed_admin(db) -> None:
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        return
    existing = await db.admins.find_one({"email": admin_email})
    if existing is None:
        await db.admins.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.admins.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
