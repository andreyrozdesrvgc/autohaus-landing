#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Установка ежедневного автобэкапа MongoDB в cron.
# Запускать один раз: sudo bash scripts/setup_backup_cron.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_PATH="/home/autohaus/app/scripts/mongo_backup.sh"
BACKUP_DIR="/var/backups/autohaus"
LOG_FILE="/var/log/autohaus_backup.log"
CRON_LINE="30 3 * * * ${SCRIPT_PATH} >> ${LOG_FILE} 2>&1"

if [ "$(id -u)" -ne 0 ]; then
    echo "Запускайте через sudo: sudo bash $0"
    exit 1
fi

# Права
chmod +x "${SCRIPT_PATH}"
mkdir -p "${BACKUP_DIR}"
touch "${LOG_FILE}"
chown root:root "${BACKUP_DIR}" "${LOG_FILE}"

# Ставим строку в crontab root, избегая дубликата
CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
if echo "${CURRENT_CRON}" | grep -Fq "${SCRIPT_PATH}"; then
    echo "✓ Cron уже настроен на этот скрипт — ничего не меняю."
else
    (echo "${CURRENT_CRON}"; echo "${CRON_LINE}") | crontab -
    echo "✓ Добавлена строка в crontab:"
    echo "  ${CRON_LINE}"
fi

echo ""
echo "── Проверка ────────────────────────────────────────────"
echo "Каталог бэкапов: ${BACKUP_DIR}"
echo "Лог:              ${LOG_FILE}"
echo "Cron root:"
crontab -l | grep -F "${SCRIPT_PATH}"
echo ""
echo "→ Запустить бэкап вручную прямо сейчас:"
echo "   sudo ${SCRIPT_PATH}"
echo ""
echo "→ Посмотреть архивы:"
echo "   ls -lah ${BACKUP_DIR}"
echo ""
echo "→ Восстановить из архива (пример):"
echo "   sudo tar -xzf ${BACKUP_DIR}/autohaus_20260913_030000.tar.gz -C /tmp"
echo "   sudo mongorestore --drop --db autohaus /tmp/autohaus_20260913_030000/autohaus"
