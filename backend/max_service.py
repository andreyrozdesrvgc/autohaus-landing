"""MAX messenger notification service for AUTOHAUS lead alerts.

Uses the MAX Bot API (dev.max.ru) — POST /messages endpoint on
platform-api2.max.ru. Reuses the same HTML-free plain-text message shape
so both Telegram and MAX chats can show the same lead info.

Failures are caught and logged so they never break the user-facing API.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

MAX_API_BASE = "https://platform-api2.max.ru"


def _humanise_config(config: dict[str, Any]) -> list[str]:
    if not config:
        return []
    labels = {
        "film": "Тип плёнки",
        "finish": "Финиш",
        "coverage": "Зона оклейки",
        "antichrome": "Антихром",
        "darkout": "Чёрные элементы",
        "headlights": "Бронирование оптики",
        "estimated_price": "Расчётная стоимость",
    }
    lines: list[str] = []
    for k, v in config.items():
        if v is None or v == "" or v == []:
            continue
        label = labels.get(k, k.replace("_", " ").capitalize())
        if isinstance(v, bool):
            if not v:
                continue
            lines.append(f"{label}: Да")
        elif isinstance(v, list):
            items = [str(i) for i in v if i not in (None, "")]
            if items:
                lines.append(f"{label}:")
                for i in items:
                    lines.append(f"  • {i}")
        elif k == "estimated_price":
            try:
                pretty = f"{int(round(float(v))):,}".replace(",", " ")
                lines.append(f"{label}: ~{pretty} ₽")
            except (TypeError, ValueError):
                lines.append(f"{label}: {v}")
        else:
            lines.append(f"{label}: {v}")
    return lines


def build_plain_message(payload: dict[str, Any]) -> str:
    """Build a plain-text lead message (MAX API doesn't support Telegram-style HTML)."""
    source_labels = {
        "configurator": "Калькулятор «Рассчитать проект»",
        "contact_form": "Форма «Бесплатный осмотр»",
        "team_member": "Запись к мастеру",
        "autohaus_live": "AutoHaus Live",
        "landing": "Сайт",
    }
    source = payload.get("source") or "landing"
    title = source_labels.get(source, "Заявка с сайта")

    parts: list[str] = []
    parts.append("🚗 AUTOHAUS — новая заявка")
    parts.append(f"↳ {title}")
    parts.append("")

    if payload.get("name"):
        parts.append(f"👤 Имя: {payload['name']}")
    if payload.get("phone"):
        parts.append(f"📞 Телефон: {payload['phone']}")
    if payload.get("car") and payload["car"] not in ("—", "-"):
        parts.append(f"🚙 Авто: {payload['car']}")
    if payload.get("message"):
        parts.append(f"💬 Комментарий: {payload['message']}")

    config_lines = _humanise_config(payload.get("configuration") or {})
    if config_lines:
        parts.append("")
        parts.append("⚙️ Конфигурация")
        parts.extend(config_lines)

    ts = datetime.now(timezone.utc).strftime("%d.%m.%Y · %H:%M UTC")
    parts.append("")
    parts.append(f"🕒 {ts}")
    if payload.get("id"):
        parts.append(f"id: {payload['id']}")

    return "\n".join(parts).strip()


async def send_lead_to_max(payload: dict[str, Any]) -> bool:
    """Send a lead alert to a MAX chat. Returns True on success, False otherwise.

    Requires env vars:
      MAX_BOT_TOKEN — токен бота, полученный от @MasterBot в MAX
      MAX_CHAT_ID   — числовой ID группового чата, куда добавлен бот
    """
    token = os.environ.get("MAX_BOT_TOKEN")
    chat_id = os.environ.get("MAX_CHAT_ID")
    if not token or not chat_id:
        logger.debug("MAX credentials are not configured; skipping notification")
        return False

    text = build_plain_message(payload)
    url = f"{MAX_API_BASE}/messages"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                params={"chat_id": chat_id},
                headers={
                    "Authorization": token,
                    "Content-Type": "application/json",
                },
                json={"text": text},
            )
        if resp.status_code >= 300:
            logger.error(
                "MAX sendMessage failed: status=%s body=%s",
                resp.status_code,
                resp.text[:500],
            )
            return False
        return True
    except Exception as exc:  # noqa: BLE001 — never propagate
        logger.exception("MAX notification crashed: %s", exc)
        return False
