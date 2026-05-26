"""Media storage backed by MongoDB GridFS with HTTP Range support for video streaming."""
import mimetypes
import re

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

ALLOWED_MIME_PREFIXES = ("image/", "video/")
MAX_UPLOAD_BYTES = 80 * 1024 * 1024  # 80 MB
CHUNK_SIZE = 256 * 1024  # 256 KB per network chunk


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


async def find_file_meta(db, file_id: str):
    """Return the GridFS file document (with length, metadata) or None."""
    try:
        oid = ObjectId(file_id)
    except Exception:
        return None
    return await db["media.files"].find_one({"_id": oid})


def parse_range(range_header: str, file_size: int):
    """Parse 'bytes=start-end' header. Returns (start, end) inclusive or None on invalid."""
    if not range_header:
        return None
    m = re.match(r"bytes=(\d*)-(\d*)$", range_header.strip())
    if not m:
        return None
    start_s, end_s = m.group(1), m.group(2)
    if start_s == "" and end_s == "":
        return None
    if start_s == "":
        # suffix range: last N bytes
        suffix = int(end_s)
        if suffix == 0:
            return None
        start = max(0, file_size - suffix)
        end = file_size - 1
    else:
        start = int(start_s)
        end = int(end_s) if end_s else file_size - 1
    end = min(end, file_size - 1)
    if start > end or start >= file_size:
        return None
    return start, end


async def iter_grid_range(db, file_id: str, start: int, end: int):
    """Yield bytes from a GridFS file between [start, end] inclusive."""
    bucket = gridfs(db)
    oid = ObjectId(file_id)
    stream = await bucket.open_download_stream(oid)
    try:
        # GridFS download stream supports seek()
        if start > 0:
            try:
                stream.seek(start)
            except Exception:
                # Fallback: read & discard
                to_skip = start
                while to_skip > 0:
                    chunk = await stream.readchunk()
                    if not chunk:
                        break
                    if len(chunk) <= to_skip:
                        to_skip -= len(chunk)
                    else:
                        # Yield only the tail of this chunk
                        yield chunk[to_skip:to_skip + (end - start + 1)]
                        return
        remaining = end - start + 1
        while remaining > 0:
            chunk = await stream.readchunk()
            if not chunk:
                break
            if len(chunk) > remaining:
                yield chunk[:remaining]
                remaining = 0
            else:
                yield chunk
                remaining -= len(chunk)
    finally:
        try:
            await stream.close()
        except Exception:
            pass


def guess_content_type(filename: str, fallback: str = "application/octet-stream") -> str:
    guess, _ = mimetypes.guess_type(filename or "")
    return guess or fallback
