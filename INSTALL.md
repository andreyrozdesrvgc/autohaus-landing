# 🚀 AUTOHAUS — Полная инструкция по установке с нуля на Selectel VPS

Инструкция рассчитана на **чистую Ubuntu 22.04 LTS** на Selectel VPS.
После выполнения всех шагов сайт будет работать по `http://ВАШ_IP` и `http://detailing-autohaus.ru`.

---

## 📋 Что понадобится

- VPS с Ubuntu 22.04 (минимум 2 GB RAM, 20 GB SSD)
- Публичный IP (например `139.100.226.220`)
- Домен `detailing-autohaus.ru` с A-записью на этот IP (для HTTPS в конце)
- Данные для `.env`:
  - Telegram Bot Token и Chat ID
  - Логин/пароль будущего админа CMS

---

## 🔐 ШАГ 0. Подключение к VPS

С вашего компьютера:
```bash
ssh root@139.100.226.220
```
Введите пароль от VPS.

---

## 👤 ШАГ 1. Создать пользователя `autohaus` (не работаем под root)

```bash
adduser autohaus
usermod -aG sudo autohaus
su - autohaus
```

Теперь вы под пользователем `autohaus`. Все дальнейшие команды — **под ним** (не под root!).

---

## 📦 ШАГ 2. Обновить систему и поставить базовые пакеты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw
```

---

## 🐍 ШАГ 3. Установить Python 3.11 + venv

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version   # должно быть 3.10+ (нормально) или 3.11+
```

---

## 📗 ШАГ 4. Установить Node.js 20 + Yarn + PM2

```bash
# Node.js 20 через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn
sudo npm install -g yarn pm2

# Проверка
node -v    # v20.x.x
yarn -v    # 1.22.x
pm2 -v     # 5.x.x
```

---

## 🍃 ШАГ 5. Установить MongoDB

```bash
# Ключ и репозиторий
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Запуск и автостарт
sudo systemctl start mongod
sudo systemctl enable mongod

# Проверка
sudo systemctl status mongod --no-pager | head -5
```
Если MongoDB не запускается на Ubuntu 22 из-за libssl — используйте образ mongo для 20.04 или Docker. Обычно всё работает.

---

## 🔥 ШАГ 6. Настроить firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 📂 ШАГ 7. Клонировать проект с GitHub

```bash
cd /home/autohaus
git clone https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git app
cd /home/autohaus/app
ls -la    # должны увидеть frontend/ backend/ и т.д.
```

Если репозиторий приватный:
```bash
# Сгенерировать SSH ключ и добавить в GitHub
ssh-keygen -t ed25519 -C "autohaus-vps"
cat ~/.ssh/id_ed25519.pub    # добавить в GitHub → Settings → SSH keys
git clone git@github.com:ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git app
```

---

## ⚙️ ШАГ 8. Создать `.env` файлы

### backend/.env (обязательные ключи):
```bash
nano /home/autohaus/app/backend/.env
```
Вставьте (замените значения!):
```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=autohaus
JWT_SECRET=длинная-случайная-строка-минимум-32-символа-abc123xyz
ADMIN_EMAIL=admin@detailing-autohaus.ru
ADMIN_PASSWORD=ВашНадёжныйПарольДляАдминки2026!
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
CORS_ORIGINS=*
```
Сохранить: `Ctrl+O` → `Enter` → `Ctrl+X`.

**Как получить `TELEGRAM_BOT_TOKEN`**: напишите @BotFather в Telegram → `/newbot`.
**Как получить `CHAT_ID`**: добавьте бота в вашу группу/канал → откройте `https://api.telegram.org/botТОКЕН/getUpdates` → найдите `"chat":{"id":-100...}`.

### frontend/.env (относительный URL — критично!):
```bash
cat > /home/autohaus/app/frontend/.env <<'EOF'
REACT_APP_BACKEND_URL=
WDS_SOCKET_PORT=443
EOF
cat /home/autohaus/app/frontend/.env   # проверить
```
⚠️ После `REACT_APP_BACKEND_URL=` **ничего нет**. Это принципиально — так nginx проксирует API на том же домене.

---

## 🐍 ШАГ 9. Установить Python зависимости backend

```bash
cd /home/autohaus/app/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

---

## 🏗️ ШАГ 10. Собрать frontend

```bash
cd /home/autohaus/app/frontend
yarn install
yarn build
ls -la build/     # должен появиться index.html и папка static/
```
Билд занимает 1-3 минуты. В конце должно быть `Compiled successfully.`

---

## ⚡ ШАГ 11. Настроить PM2 для backend

Создать конфиг PM2:
```bash
nano /home/autohaus/app/backend/ecosystem.config.js
```
Вставить:
```javascript
module.exports = {
  apps: [{
    name: "autohaus-backend",
    cwd: "/home/autohaus/app/backend",
    script: "venv/bin/uvicorn",
    args: "server:app --host 127.0.0.1 --port 8001 --workers 2",
    interpreter: "none",
    env_file: "/home/autohaus/app/backend/.env",
    watch: false,
    autorestart: true,
    max_restarts: 10,
    error_file: "/home/autohaus/.pm2/logs/autohaus-error.log",
    out_file: "/home/autohaus/.pm2/logs/autohaus-out.log"
  }]
};
```
Сохранить (`Ctrl+O` → `Enter` → `Ctrl+X`).

Запустить:
```bash
cd /home/autohaus/app/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # покажет команду с sudo — скопируйте и выполните её
```

Проверить:
```bash
pm2 status                    # должен быть online
pm2 logs autohaus-backend --lines 20 --nostream
curl http://127.0.0.1:8001/api/content | head -c 200
```
Если curl вернул JSON `{"hero":{...` — бекенд работает 🎉

---

## 🌐 ШАГ 12. Настроить Nginx

```bash
sudo nano /etc/nginx/sites-available/autohaus
```
Вставить:
```nginx
server {
    listen 80;
    server_name detailing-autohaus.ru www.detailing-autohaus.ru _;

    client_max_body_size 100M;

    # Frontend (React SPA)
    root /home/autohaus/app/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_send_timeout 300;

        # Range requests для видео streaming
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_no_cache $http_range $http_if_range;
    }

    # Кэш статики
    location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|mp4)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```
Сохранить.

Активировать:
```bash
sudo ln -sf /etc/nginx/sites-available/autohaus /etc/nginx/sites-enabled/autohaus
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔓 ШАГ 13. КРИТИЧНО! Права для nginx на папку build

Nginx работает от пользователя `www-data`, и по умолчанию не может читать `/home/autohaus/`. Без этого шага будет 500 Internal Server Error.
```bash
sudo chmod o+x /home/autohaus
sudo chmod o+x /home/autohaus/app
sudo chmod o+x /home/autohaus/app/frontend
sudo chmod -R o+rX /home/autohaus/app/frontend/build
```

Проверить:
```bash
curl -I http://127.0.0.1/
# Должно быть: HTTP/1.1 200 OK
```

---

## ✅ ШАГ 14. Открыть в браузере

```
http://139.100.226.220
```

- Должен загрузиться сайт с заголовком **"ПРЕОБРАЖАЕМ АВТОМОБИЛИ В ПРОИЗВЕДЕНИЕ ИСКУССТВА"**
- Меню сверху, видео/фото BMW на фоне
- Прокрутка должна показать все секции

**Админка**: `http://139.100.226.220/admin/login`
Логин/пароль — те, что вы указали в `backend/.env`.

---

## 🔒 ШАГ 15 (опционально). SSL от Let's Encrypt

**Только после того как домен `detailing-autohaus.ru` привязан A-записью к IP VPS!**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d detailing-autohaus.ru -d www.detailing-autohaus.ru
```
Certbot спросит email, согласие с условиями и предложит редирект HTTP→HTTPS (нажмите `2`).

Проверить автообновление:
```bash
sudo certbot renew --dry-run
```

---

## 🔄 Как обновлять сайт после этого

**Однократно** (после первой установки) — сделать скрипт `deploy.sh` исполняемым:
```bash
chmod +x /home/autohaus/app/deploy.sh
```

**Каждый раз при выкладке новой версии с GitHub — одна команда:**
```bash
cd /home/autohaus/app && bash deploy.sh
```

Скрипт сам:
1. Подтянет свежий код (`git pull`)
2. Проверит `.env` файлы
3. Обновит зависимости backend + frontend
4. Соберёт новый `yarn build`
5. Выставит права для nginx
6. Перезапустит PM2
7. Перезагрузит nginx
8. Проверит что сайт отвечает 200

---

## 🐛 Устранение проблем

### Чёрный экран после загрузки
1. Откройте DevTools (`F12`) → вкладка Console
2. Если видите `Cannot read properties of undefined` — билд старый, без ErrorBoundary. Убедитесь, что `git pull` реально подтянул новый код:
   ```bash
   cd /home/autohaus/app
   git log --oneline -5
   ls /home/autohaus/app/frontend/src/components/ErrorBoundary.jsx   # должен существовать
   ```
3. Если файл ErrorBoundary.jsx есть — пересоберите:
   ```bash
   bash /home/autohaus/app/deploy.sh
   ```
4. Обновите страницу с очисткой кэша: **Ctrl+Shift+R**

### 500 Internal Server Error
Проверьте логи:
```bash
sudo tail -n 30 /var/log/nginx/error.log
```
Если видите `Permission denied` — повторите **ШАГ 13** (права `o+rX`).

### API возвращает 502 Bad Gateway
Backend не запущен. Проверьте:
```bash
pm2 status
pm2 logs autohaus-backend --lines 30 --nostream
curl http://127.0.0.1:8001/api/content
```

### Frontend показывает старый контент
Кэш браузера. Обновите с `Ctrl+Shift+R` или откройте в приватной вкладке.

### MongoDB не подключается
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 30 --no-pager
```

---

## 📱 Полезные команды

```bash
# Логи backend в реальном времени
pm2 logs autohaus-backend

# Мониторинг ресурсов PM2
pm2 monit

# Перезапуск backend вручную
pm2 restart autohaus-backend

# Перезагрузить nginx
sudo systemctl reload nginx

# Проверить статус всех сервисов
sudo systemctl status nginx mongod
pm2 status

# Полный передеплой одной командой
cd /home/autohaus/app && bash deploy.sh
```

---

## 🎯 Готово!

Сайт работает. Для обновления кода — просто пушьте в GitHub и запускайте `bash deploy.sh` на VPS.

Всё, что связано с контентом (тексты, фото, видео, номер телефона, ссылки на мессенджеры) — редактируется через админку по адресу `/admin/login` без пересборки и деплоя. Изменения применяются мгновенно.

Успешного запуска! 🚀
