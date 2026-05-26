"""CMS content service — single document storing the editable site copy."""
from copy import deepcopy
from typing import Any

from default_content import DEFAULT_CONTENT

CONTENT_DOC_ID = "site_content_v1"


def _deep_merge(base: Any, override: Any) -> Any:
    """Recursively merge override INTO a copy of base. Dicts merge key-wise; everything else is replaced."""
    if isinstance(base, dict) and isinstance(override, dict):
        result = {**base}
        for k, v in override.items():
            result[k] = _deep_merge(base.get(k), v) if k in base else v
        return result
    return deepcopy(override) if override is not None else deepcopy(base)


async def get_content(db) -> dict:
    doc = await db.site_content.find_one({"_id": CONTENT_DOC_ID})
    saved = doc.get("data") if doc else None
    if not saved:
        return deepcopy(DEFAULT_CONTENT)
    return _deep_merge(DEFAULT_CONTENT, saved)


async def save_content(db, new_data: dict) -> dict:
    merged = _deep_merge(DEFAULT_CONTENT, new_data)
    await db.site_content.update_one(
        {"_id": CONTENT_DOC_ID},
        {"$set": {"data": merged}},
        upsert=True,
    )
    return merged
