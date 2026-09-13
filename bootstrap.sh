#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  AUTOHAUS — Bootstrap для свежей Ubuntu 22.04 VDS
#  Запуск (под пользователем autohaus, ОДИН РАЗ на новом сервере):
#    curl -fsSL https://raw.githubusercontent.com/andreyrozdesrvgc/autohaus-landing/main/bootstrap.sh | bash
#  или локально:
#    cd /home/autohaus/app && bash bootstrap.sh
# ═══════════════════════════════════════════════════════════════════
#  Что делает:
#   1. Обновляет систему
#   2. Ставит: nginx, python3.10, node.js 20, yarn, pm2, mongodb 7, certbot
#   3. Создаёт swap 4GB
#   4. Копирует configs/mongod.conf → /etc/mongod.conf
#   5. Копирует configs/nginx-autohaus.conf → /etc/nginx/sites-available/
#   6. Настраивает права для nginx
#   7. Запускает mongod и включает автозапуск
#   8. Регистрирует PM2 в systemd для автозапуска после ребута
#   9. Вызывает deploy.sh для сборки frontend/backend
#  10. Готово — сайт работает по http://IP
#
#  ВАЖНО: После bootstrap запустите certbot для HTTPS (см. INSTALL.md).
# ═══════════════════════════════════════════════════════════════════
set -e

APP_DIR="/home/autohaus/app"
USER_NAME="autohaus"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
log()   { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" >&2; exit 1; }

[ "$(id -un)" = "$USER_NAME" ] || error "Запускайте под пользователем ${USER_NAME}: su - ${USER_NAME}, потом bash bootstrap.sh"
[ -d "$APP_DIR" ] || error "Папка $APP_DIR не найдена. Сначала клонируйте: git clone <repo> $APP_DIR"
cd "$APP_DIR"

log "🚀 AUTOHAUS bootstrap — начинаю установку с нуля..."

# ── 1. Обновление системы ─────────────────────────────────────────
log "1/10  Обновляю пакеты..."
sudo apt-get update -qq
sudo apt-get install -y -qq curl git build-essential ufw software-properties-common gnupg ca-certificates lsb-release
ok "Пакеты обновлены"

# ── 2. Swap 4GB ───────────────────────────────────────────────────
log "2/10  Создаю swap 4GB (защита от OOM)..."
if [ "$(swapon --show=NAME --noheadings 2>/dev/null | wc -l)" -eq 0 ]; then
    sudo fallocate -l 4G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile > /dev/null
    sudo swapon /swapfile
    grep -q "^/swapfile" /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    ok "Swap 4GB подключён"
else
    ok "Swap уже подключён"
fi

# ── 3. Python 3.10 + venv ─────────────────────────────────────────
log "3/10  Устанавливаю Python..."
sudo apt-get install -y -qq python3 python3-pip python3-venv
ok "Python готов ($(python3 --version))"

# ── 4. Node.js 20 + Yarn + PM2 ────────────────────────────────────
log "4/10  Устанавливаю Node.js 20 + Yarn + PM2..."
if ! command -v node > /dev/null 2>&1 || [ "$(node -v | grep -o 'v[0-9]*' | tr -d v)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null
    sudo apt-get install -y -qq nodejs
fi
sudo npm install -g yarn pm2 --silent
echo 'export NODE_OPTIONS="--max-old-space-size=1536"' >> ~/.bashrc
export NODE_OPTIONS="--max-old-space-size=1536"
ok "Node.js $(node -v), Yarn $(yarn -v), PM2 $(pm2 -v)"

# ── 5. Nginx ──────────────────────────────────────────────────────
log "5/10  Устанавливаю nginx..."
sudo apt-get install -y -qq nginx
sudo systemctl enable --now nginx
ok "Nginx работает"

# ── 6. MongoDB 7.0 ────────────────────────────────────────────────
log "6/10  Устанавливаю MongoDB 7.0..."
if ! command -v mongod > /dev/null 2>&1; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq mongodb-org
fi

# Применяем правильный конфиг из репозитория
sudo cp "$APP_DIR/configs/mongod.conf" /etc/mongod.conf
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb 2>/dev/null || true
sudo rm -f /var/lib/mongodb/mongod.lock /var/lib/mongodb/WiredTiger.lock 2>/dev/null || true
sudo systemctl enable mongod
sudo systemctl restart mongod
sleep 4
if (echo > /dev/tcp/127.0.0.1/27017) >/dev/null 2>&1; then
    ok "MongoDB работает на 127.0.0.1:27017"
else
    error "MongoDB не поднялась — sudo journalctl -u mongod -n 30"
fi

# ── 7. Nginx site config ──────────────────────────────────────────
log "7/10  Настраиваю nginx site..."
sudo cp "$APP_DIR/configs/nginx-autohaus.conf" /etc/nginx/sites-available/autohaus
sudo ln -sf /etc/nginx/sites-available/autohaus /etc/nginx/sites-enabled/autohaus
sudo rm -f /etc/nginx/sites-enabled/default
# Права для nginx на папки пользователя
sudo chmod o+x /home/autohaus /home/autohaus/app /home/autohaus/app/frontend 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx
ok "Nginx настроен"

# ── 8. UFW firewall ───────────────────────────────────────────────
log "8/10  Настраиваю firewall..."
sudo ufw allow OpenSSH > /dev/null
sudo ufw allow 'Nginx Full' > /dev/null
sudo ufw --force enable > /dev/null
ok "UFW: OpenSSH + Nginx Full"

# ── 9. Проверка .env ──────────────────────────────────────────────
log "9/10  Проверяю .env файлы..."
BACKEND_ENV="$APP_DIR/backend/.env"
FRONTEND_ENV="$APP_DIR/frontend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    warn "backend/.env отсутствует — создаю ЗАГОТОВКУ. ОБЯЗАТЕЛЬНО отредактируйте!"
    cat > "$BACKEND_ENV" <<'EOF'
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=autohaus
JWT_SECRET=CHANGE_ME_generate_via_openssl_rand_hex_32
ADMIN_EMAIL=admin@detailing-autohaus.ru
ADMIN_PASSWORD=CHANGE_ME_strong_password
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
MAX_BOT_TOKEN=
MAX_CHAT_ID=
CORS_ORIGINS=*
EOF
    warn "→ Отредактируйте: nano $BACKEND_ENV"
    warn "→ После правки перезапустите bootstrap или сразу deploy.sh"
fi

if [ ! -f "$FRONTEND_ENV" ] || ! grep -q "^REACT_APP_BACKEND_URL=$" "$FRONTEND_ENV"; then
    cat > "$FRONTEND_ENV" <<'EOF'
REACT_APP_BACKEND_URL=
WDS_SOCKET_PORT=443
EOF
fi
ok ".env файлы на месте"

# ── 10. Первый билд + запуск через deploy.sh ──────────────────────
log "10/10  Первая сборка и запуск..."
bash "$APP_DIR/deploy.sh"

# ── PM2 systemd autostart ─────────────────────────────────────────
log "Регистрирую PM2 в systemd (автозапуск после ребута)..."
STARTUP_CMD=$(pm2 startup systemd -u "$USER_NAME" --hp "/home/$USER_NAME" 2>&1 | grep "sudo" | tail -1)
if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD"
    pm2 save
    ok "PM2 в systemd — переживёт ребут VDS"
else
    warn "Не удалось получить startup команду от PM2 — сделайте вручную: pm2 startup && pm2 save"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Bootstrap завершён! AUTOHAUS готов к работе.${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  🌐  Сайт:     http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "  🔐  Админка:  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')/admin/login"
echo ""
echo -e "${YELLOW}Дальнейшие шаги:${NC}"
echo "  1. Проверьте backend/.env — впишите Telegram/MAX токены"
echo "  2. Настройте HTTPS: sudo certbot --nginx -d detailing-autohaus.ru --agree-tos -m ВАШ_EMAIL --redirect"
echo "  3. Автобэкап Mongo: sudo bash /home/autohaus/app/scripts/setup_backup_cron.sh"
echo ""
