#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# AUTOHAUS — Ежедневный автобэкап MongoDB
# Сохраняет полный дамп базы в /var/backups/autohaus и держит 7 последних.
#
# Установка (один раз):
#   sudo bash scripts/setup_backup_cron.sh
#
# Ручной запуск:
#   /home/autohaus/app/scripts/mongo_backup.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

DB_NAME="${DB_NAME:-autohaus}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/autohaus}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
DUMP_PATH="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}"
ARCHIVE_PATH="${DUMP_PATH}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Backup start → ${ARCHIVE_PATH}"

# Дамп в отдельную папку (per-collection BSON)
mongodump --db "${DB_NAME}" --out "${DUMP_PATH}" --quiet

# Упаковываем и удаляем сырой дамп
tar -czf "${ARCHIVE_PATH}" -C "${BACKUP_DIR}" "$(basename "${DUMP_PATH}")"
rm -rf "${DUMP_PATH}"

# Ротация — оставляем последние N дней
find "${BACKUP_DIR}" -maxdepth 1 -type f -name "${DB_NAME}_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete

SIZE=$(du -h "${ARCHIVE_PATH}" | cut -f1)
echo "[$(date -Iseconds)] Backup done → ${ARCHIVE_PATH} (${SIZE})"
