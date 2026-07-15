#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  AUTOHAUS — One-command deployment update script
#  Использование:  bash deploy.sh
# ═══════════════════════════════════════════════════════════════════
#  Что делает:
#   1. Подтягивает свежий код с GitHub (git pull)
#   2. Гарантирует, что frontend/.env корректный (относительный API)
#   3. Устанавливает зависимости backend (pip)
#   4. Устанавливает зависимости frontend (yarn) и пересобирает build
#   5. Выставляет права для nginx
#   6. Перезапускает PM2 backend
#   7. Перезагружает nginx
#   8. Проверяет что сайт отвечает 200 OK
# ═══════════════════════════════════════════════════════════════════

set -e  # прерывать при первой ошибке

# ── Настройки ─────────────────────────────────────────────────────
APP_DIR="/home/autohaus/app"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
PM2_APP_NAME="autohaus-backend"
VENV_DIR="$BACKEND_DIR/venv"

# ── Цвета для логов ───────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" >&2; exit 1; }

# ══════════════════════════════════════════════════════════════════

log "🚀 Начинаю обновление AUTOHAUS..."

# ── Проверка что мы в правильной папке ───────────────────────────
[ -d "$APP_DIR" ] || error "Папка $APP_DIR не найдена"
cd "$APP_DIR"

# ── 1. Git pull ───────────────────────────────────────────────────
log "1/8  Подтягиваю свежий код с GitHub..."
if [ -d ".git" ]; then
    # Сохраняем локальные изменения (.env файлы и т.п.)
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        warn "Обнаружены локальные изменения — сохраняю в git stash"
        git stash push -m "auto-stash-$(date +%s)" || true
        STASHED=1
    fi

    BRANCH=$(git branch --show-current)
    git pull origin "$BRANCH"

    # Возвращаем локальные изменения (.env)
    if [ "$STASHED" = "1" ]; then
        git stash pop || warn "Не удалось восстановить stash — проверь .env вручную"
    fi
    ok "Код обновлён (ветка $BRANCH)"
else
    warn "Не git-репозиторий — пропускаю git pull"
fi

# ── 2. Проверка .env ──────────────────────────────────────────────
log "2/8  Проверяю frontend/.env..."
FRONTEND_ENV="$FRONTEND_DIR/.env"
if [ ! -f "$FRONTEND_ENV" ] || ! grep -q "^REACT_APP_BACKEND_URL=$" "$FRONTEND_ENV"; then
    warn "frontend/.env некорректный или отсутствует — создаю с относительным URL"
    cat > "$FRONTEND_ENV" <<'EOF'
REACT_APP_BACKEND_URL=
WDS_SOCKET_PORT=443
EOF
fi
ok "frontend/.env OK"

log "     Проверяю backend/.env..."
[ -f "$BACKEND_DIR/.env" ] || error "backend/.env отсутствует! Создай его вручную (MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)"
ok "backend/.env на месте"

# ── 3. Backend deps ───────────────────────────────────────────────
log "3/8  Обновляю Python зависимости backend..."
if [ -d "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
    pip install -q -r "$BACKEND_DIR/requirements.txt"
    deactivate
    ok "Backend зависимости обновлены"
else
    warn "venv не найден в $VENV_DIR — пропускаю (или создай: python3 -m venv $VENV_DIR)"
fi

# ── 4. Frontend deps + build ──────────────────────────────────────
log "4/8  Устанавливаю frontend зависимости (yarn install)..."
cd "$FRONTEND_DIR"
yarn install --frozen-lockfile 2>&1 | tail -3
ok "Frontend зависимости готовы"

log "5/8  Собираю frontend build (yarn build)..."
rm -rf build
yarn build 2>&1 | tail -5
[ -f "build/index.html" ] || error "yarn build не создал index.html"
ok "Build готов ($(du -sh build | cut -f1))"

# ── 5. Права для nginx ────────────────────────────────────────────
log "6/8  Настраиваю права для nginx..."
sudo chmod o+x /home/autohaus
sudo chmod o+x "$APP_DIR"
sudo chmod o+x "$FRONTEND_DIR"
sudo chmod -R o+rX "$FRONTEND_DIR/build"
ok "Права выставлены (o+rX на build)"

# ── 6. PM2 restart ────────────────────────────────────────────────
log "7/8  Перезапускаю PM2 backend..."
if pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME" --update-env
    pm2 save
    ok "PM2 перезапущен"
else
    warn "PM2 приложение '$PM2_APP_NAME' не найдено — запускаю первый раз"
    cd "$BACKEND_DIR"
    pm2 start ecosystem.config.js
    pm2 save
fi

# ── 7. Nginx reload ───────────────────────────────────────────────
log "8/8  Перезагружаю nginx..."
sudo nginx -t 2>&1 | tail -2
sudo systemctl reload nginx
ok "Nginx перезагружен"

# ── 8. Финальная проверка ─────────────────────────────────────────
sleep 2
log "🔍 Финальная проверка..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/api/content)

echo ""
if [ "$HTTP_STATUS" = "200" ]; then
    ok "Frontend: HTTP $HTTP_STATUS"
else
    error "Frontend вернул HTTP $HTTP_STATUS (ожидался 200)"
fi

if [ "$API_STATUS" = "200" ]; then
    ok "Backend API: HTTP $API_STATUS"
else
    error "Backend API вернул HTTP $API_STATUS (ожидался 200)"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Деплой завершён успешно!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  🌐 Сайт:      http://$(curl -s ifconfig.me)"
echo "  🔐 Админка:   http://$(curl -s ifconfig.me)/admin/login"
echo ""
echo -e "  ${YELLOW}⚠  Обновите страницу с очисткой кэша:${NC}"
echo "     Ctrl+Shift+R (Windows/Linux) или Cmd+Shift+R (Mac)"
echo "     Или откройте в приватной вкладке"
echo ""
