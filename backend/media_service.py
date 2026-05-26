"""Media storage backed by MongoDB GridFS — no external service required."""
import mimetypes
from typing import AsyncIterator

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

ALLOWED_MIME_PREFIXES = ("image/", "video/")
MAX_UPLOAD_BYTES = 80 * 1024 * 1024  # 80 MB — generous for short detailing videos


def gridfs(db) -> AsyncIOMotorGridFSBucket:
    return AsyncIOMotorGridFSBucket(db, bucket_name="media")


async def save_file(db, filename: str, content_type: str, payload: bytes) -> str:
    bucket = gridfs(db)
    file_id = await bucket.upload_from_stream(
        filename or "upload.bin",
        payload,
        metadata={"content_type": content_type or "application/octet-stream"},
    )
    return str(file_id)


async def open_file(db, file_id: str):
    try:
        oid = ObjectId(file_id)
    except Exception:
        return None
    try:
        return await gridfs(db).open_download_stream(oid)
    except Exception:
        return None


async def stream_chunks(stream, chunk_size: int = 256 * 1024) -> AsyncIterator[bytes]:
    while True:
        chunk = await stream.readchunk()
        if not chunk:
            break
        yield chunk


def guess_content_type(filename: str, fallback: str = "application/octet-stream") -> str:
    guess, _ = mimetypes.guess_type(filename or "")
    return guess or fallback
