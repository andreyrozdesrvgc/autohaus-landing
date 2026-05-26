"""Telegram notification service for AUTOHAUS lead alerts.

Sends an HTML-formatted message to a configured chat via the Telegram Bot API.
Failures are caught and logged so they never break the user-facing API.
"""
from __future__ import annotations

import html
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org"

# Pretty labels for known configurator option fields ─ everything else is
# rendered with a humanised version of its key.
CONFIG_FIELD_LABELS: dict[str, str] = {
    "film": "Тип плёнки",
    "finish": "Финиш",
    "coverage": "Зона оклейки",
    "antichrome": "Антихром",
    "darkout": "Чёрные элементы",
    "headlights": "Бронирование оптики",
    "estimated_price": "Расчётная стоимость",
}

SOURCE_LABELS: dict[str, str] = {
    "configurator": "Калькулятор «Рассчитать проект»",
    "contact_form": "Форма «Бесплатный осмотр»",
    "landing": "Сайт",
}


def _esc(value: Any) -> str:
    return html.escape("" if value is None else str(value), quote=False)


def _format_bool(v: bool) -> str:
    return "Да" if v else "Нет"


def _format_money(v: int | float) -> str:
    try:
        return f"{int(round(float(v))):,}".replace(",", " ") + " ₽"
    except (TypeError, ValueError):
        return _esc(v)


def _humanise_key(key: str) -> str:
    return key.replace("_", " ").capitalize()


def _format_configuration(config: dict[str, Any]) -> list[str]:
    """Render the configurator payload as a list of HTML lines.

    Skips empty / None values; lists multiple chosen options.
    """
    lines: list[str] = []
    if not config:
        return lines

    # Preserve a logical order: known fields first, then any extras.
    known_order = [
        "film",
        "finish",
        "coverage",
        "antichrome",
        "darkout",
        "headlights",
        "estimated_price",
    ]
    keys = [k for k in known_order if k in config] + [
        k for k in config if k not in known_order
    ]

    for k in keys:
        v = config.get(k)
        if v is None or v == "" or v == []:
            continue

        label = CONFIG_FIELD_LABELS.get(k, _humanise_key(k))

        if isinstance(v, bool):
            if not v:
                # Skip "off" booleans entirely to keep the message tight.
                continue
            lines.append(f"<b>{_esc(label)}:</b> {_format_bool(v)}")
        elif isinstance(v, list):
            items = [str(i) for i in v if i not in (None, "")]
            if not items:
                continue
            joined = "\n".join(f"  • {_esc(i)}" for i in items)
            lines.append(f"<b>{_esc(label)}:</b>\n{joined}")
        elif k == "estimated_price":
            lines.append(f"<b>{_esc(label)}:</b> ~{_format_money(v)}")
        else:
            lines.append(f"<b>{_esc(label)}:</b> {_esc(v)}")

    return lines


def build_lead_message(payload: dict[str, Any]) -> str:
    """Build the structured HTML message for a lead."""
    source = payload.get("source") or "landing"
    title = SOURCE_LABELS.get(source, "Заявка с сайта")

    ts = datetime.now(timezone.utc).strftime("%d.%m.%Y · %H:%M UTC")

    parts: list[str] = []
    parts.append("🚗 <b>AUTOHAUS — новая заявка</b>")
    parts.append(f"<i>{_esc(title)}</i>")
    parts.append("")  # blank line

    # Contact block
    contact_lines: list[str] = []
    if payload.get("name"):
        contact_lines.append(f"👤 <b>Имя:</b> {_esc(payload['name'])}")
    if payload.get("phone"):
        phone = _esc(payload["phone"])
        contact_lines.append(f"📞 <b>Телефон:</b> <code>{phone}</code>")
    if payload.get("car") and payload["car"] not in ("—", "-"):
        contact_lines.append(f"🚙 <b>Авто:</b> {_esc(payload['car'])}")
    if payload.get("message"):
        contact_lines.append(f"💬 <b>Комментарий:</b> {_esc(payload['message'])}")
    if contact_lines:
        parts.extend(contact_lines)
        parts.append("")

    # Configurator block
    config = payload.get("configuration") or {}
    config_lines = _format_configuration(config)
    if config_lines:
        parts.append("⚙️ <b>Конфигурация</b>")
        parts.extend(config_lines)
        parts.append("")

    # Analytics block (UTM / device / referrer)
    analytics_lines: list[str] = []
    utm_source = payload.get("utm_source")
    utm_campaign = payload.get("utm_campaign")
    utm_medium = payload.get("utm_medium")
    utm_content = payload.get("utm_content")
    utm_term = payload.get("utm_term")
    referrer = payload.get("referrer")
    device = payload.get("device")
    page_url = payload.get("page_url")

    if utm_source:
        analytics_lines.append(f"📈 <b>Источник:</b> {_esc(utm_source)}")
    if utm_campaign:
        analytics_lines.append(f"📢 <b>Кампания:</b> {_esc(utm_campaign)}")
    if utm_medium:
        analytics_lines.append(f"🛰 <b>Канал:</b> {_esc(utm_medium)}")
    if utm_content:
        analytics_lines.append(f"🎯 <b>Креатив:</b> {_esc(utm_content)}")
    if utm_term:
        analytics_lines.append(f"🔎 <b>Ключ:</b> {_esc(utm_term)}")
    if device:
        analytics_lines.append(f"📱 <b>Устройство:</b> {_esc(device)}")
    if referrer:
        analytics_lines.append(f"🔗 <b>Referrer:</b> {_esc(referrer)}")
    if page_url:
        analytics_lines.append(f"🌐 <b>Страница:</b> {_esc(page_url)}")
    if analytics_lines:
        parts.append("📊 <b>Аналитика</b>")
        parts.extend(analytics_lines)
        parts.append("")

    # Footer
    parts.append(f"🕒 {_esc(ts)}")
    if payload.get("id"):
        parts.append(f"<code>id: {_esc(payload['id'])}</code>")

    return "\n".join(parts).strip()


async def send_lead_to_telegram(payload: dict[str, Any]) -> bool:
    """Send a lead alert to Telegram. Returns True on success, False on failure.

    Never raises — failures are logged so they don't break the user-facing API.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        logger.warning("Telegram credentials are not configured; skipping notification")
        return False

    text = build_lead_message(payload)
    url = f"{TELEGRAM_API_BASE}/bot{token}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=data)
        if resp.status_code != 200:
            logger.error(
                "Telegram sendMessage failed: status=%s body=%s",
                resp.status_code,
                resp.text[:500],
            )
            return False
        body = resp.json()
        if not body.get("ok"):
            logger.error("Telegram sendMessage returned not-ok: %s", body)
            return False
        return True
    except Exception as exc:  # noqa: BLE001 — we never propagate
        logger.exception("Telegram notification crashed: %s", exc)
        return False
