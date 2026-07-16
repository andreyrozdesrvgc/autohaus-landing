"""Media storage backed by MongoDB GridFS with HTTP Range support for video streaming."""
import mimetypes
import re
from urllib.parse import urlparse, unquote

import httpx
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


YANDEX_DISK_RE = re.compile(r"^https?://(disk\.yandex\.(ru|com|by|kz|uz)|yadi\.sk)/(i|d)/", re.I)


async def _resolve_download_url(url: str) -> str:
    """If URL is a Yandex Disk public share (disk.yandex.ru/i/... or /d/...),
    ask Yandex public API for the temporary direct download URL. Otherwise
    return the URL unchanged."""
    if not YANDEX_DISK_RE.match(url or ""):
        return url

    api = "https://cloud-api.yandex.net/v1/disk/public/resources/download"
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        r = await client.get(api, params={"public_key": url})
        r.raise_for_status()
        data = r.json()
        href = data.get("href")
        if not href:
            raise ValueError("Yandex Disk API returned no download URL")
        return href


def _filename_from_url(url: str) -> str:
    try:
        path = urlparse(url).path
        name = unquote(path.rsplit("/", 1)[-1]) or "upload.bin"
        # Strip query fragments
        return name.split("?")[0] or "upload.bin"
    except Exception:
        return "upload.bin"


async def import_from_url(db, url: str) -> dict:
    """Download a file from ANY public URL (with special-case Yandex Disk share
    links) and persist it to GridFS. Returns {id, url, filename, content_type, size}.

    Raises ValueError with a user-friendly message on validation errors.
    """
    if not url or not url.strip():
        raise ValueError("URL пуст")
    url = url.strip()
    if not url.lower().startswith(("http://", "https://")):
        raise ValueError("Ссылка должна начинаться с http:// или https://")

    try:
        resolved = await _resolve_download_url(url)
    except httpx.HTTPStatusError as e:
        raise ValueError(
            f"Не удалось получить прямую ссылку от Яндекс.Диск ({e.response.status_code}). "
            f"Убедитесь, что доступ к файлу — публичный."
        ) from e
    except (httpx.RequestError, ValueError) as e:
        raise ValueError(f"Не удалось разобрать ссылку: {e}") from e

    filename_hint = _filename_from_url(url)

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        try:
            async with client.stream("GET", resolved) as r:
                r.raise_for_status()
                content_type = (r.headers.get("content-type") or "").split(";")[0].strip()
                # If Yandex download URL has ?filename=X, prefer that
                q = urlparse(resolved).query
                if "filename=" in q:
                    for part in q.split("&"):
                        if part.startswith("filename="):
                            fn = unquote(part.split("=", 1)[1])
                            if fn:
                                filename_hint = fn.split("?")[0]
                            break

                if content_type and not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
                    raise ValueError(
                        f"Тип файла '{content_type}' не поддерживается — нужны только image/* или video/*"
                    )

                data = bytearray()
                async for chunk in r.aiter_bytes(chunk_size=CHUNK_SIZE):
                    data.extend(chunk)
                    if len(data) > MAX_UPLOAD_BYTES:
                        raise ValueError(
                            f"Файл больше 80 МБ ({len(data) // (1024*1024)} МБ). "
                            f"Уменьшите размер или используйте прямой URL."
                        )
        except httpx.HTTPStatusError as e:
            raise ValueError(
                f"Скачивание не удалось (HTTP {e.response.status_code}). "
                f"Проверьте, что ссылка публичная."
            ) from e
        except httpx.RequestError as e:
            raise ValueError(f"Сетевая ошибка при скачивании: {e}") from e

    if not data:
        raise ValueError("Файл пустой")

    # If content-type wasn't sent, guess from filename
    if not content_type or not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        content_type = guess_content_type(filename_hint)
        if not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
            raise ValueError(
                "Не удалось определить тип файла — принимаются только изображения и видео"
            )

    file_id = await save_file(db, filename_hint, content_type, bytes(data))
    return {
        "id": file_id,
        "url": f"/api/media/{file_id}",
        "filename": filename_hint,
        "content_type": content_type,
        "size": len(data),
    }


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
