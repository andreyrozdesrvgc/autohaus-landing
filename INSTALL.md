# AUTOHAUS — Полная инструкция по установке с нуля на Selectel VPS

Инструкция рассчитана на **чистую Ubuntu 22.04 LTS** на Selectel VPS.
После выполнения всех шагов сайт будет работать по `https://detailing-autohaus.ru`.

**Занимает ~30 минут. Не пропускайте шаги.**

---

## Что понадобится

- VPS Selectel: Ubuntu 22.04 LTS, минимум **2 vCPU / 4 GB RAM / 40 GB SSD** (рекомендую именно 4 GB — на 2 GB yarn build падает даже со swap)
- Публичный IP (например `139.100.226.220`)
- Домен `detailing-autohaus.ru` с A-записью на этот IP (можно настроить позже — SSL в конце)
- Заранее подготовить:
  - `TELEGRAM_BOT_TOKEN` (получить у @BotFather → `/newbot`)
  - `TELEGRAM_CHAT_ID` (числовой ID группы/канала, куда бот добавлен)
  - Логин/пароль для будущего админа CMS
  - (Опционально) `MAX_BOT_TOKEN` и `MAX_CHAT_ID` — если используете MAX-бота

---

## ШАГ 0. Подключение

С вашего компьютера:
```bash
ssh root@139.100.226.220
```
Введите пароль VPS.

---

## ШАГ 1. Создать пользователя `autohaus`

Работа под root — плохая практика и ломает git/pm2. Создаём отдельного пользователя:

```bash
adduser autohaus
usermod -aG sudo autohaus
```

Разрешаем ему `sudo` без пароля (упростит команды):
```bash
echo 'autohaus ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/autohaus
sudo chmod 440 /etc/sudoers.d/autohaus
```

Переключаемся:
```bash
su - autohaus
```

Теперь вы под `autohaus`. **Все дальнейшие команды выполняются под этим пользователем**, кроме случаев, где явно используется `sudo`.

---

## ШАГ 2. Обновление системы + базовые пакеты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw software-properties-common gnupg
```

---

## ШАГ 3. КРИТИЧНО! Создать SWAP-файл (4 GB)

Без swap `yarn build` может уронить ядро (kernel panic) на VDS с малой RAM.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

free -h    # Должна появиться строка "Swap: 4.0Gi"
```

Также ограничим потребление памяти Node:
```bash
echo 'export NODE_OPTIONS="--max-old-space-size=1536"' >> ~/.bashrc
source ~/.bashrc
```

---

## ШАГ 4. Python 3.10+ + venv

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version   # 3.10.x — ОК
```

---

## ШАГ 5. Node.js 20 + Yarn + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn pm2

# Проверка
node -v    # v20.x.x
yarn -v    # 1.22.x
pm2 -v     # 5.x.x
```

---

## ШАГ 6. MongoDB 7.0

Сначала проверим что CPU поддерживает AVX (Mongo 5+ требует AVX):
```bash
grep -o 'avx' /proc/cpuinfo | head -1
```
- Если вывод `avx` → идём дальше с Mongo 7.0
- Если пусто → перейдите в раздел **«Fallback: MongoDB 4.4»** внизу этого шага

### Установка Mongo 7.0
```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod --no-pager | head -8
```
Должно быть **`Active: active (running)`** зелёным.

### Проверка подключения
```bash
mongosh --eval "db.runCommand({ping:1})"
```
Должен вернуть `{ ok: 1 }`.

### Fallback: MongoDB 4.4 (если CPU без AVX)
```bash
curl -fsSL https://pgp.mongodb.com/server-4.4.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-4.4.gpg --dearmor
echo "deb [ arch=amd64 signed-by=/usr/share/keyrings/mongodb-server-4.4.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Если Mongo не стартует
```bash
sudo tail -n 40 /var/log/mongodb/mongod.log
sudo systemctl status mongod --no-pager -l
```
Смотрите на строки со словом `error` или `exception`. Самые частые причины:
- **Битый lock-файл** после reboot → `sudo rm -f /var/lib/mongodb/mongod.lock && sudo systemctl start mongod`
- **Битые права** → `sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb && sudo systemctl start mongod`
- **Нехватка места** → `df -h`

---

## ШАГ 7. Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## ШАГ 8. Клонирование проекта

```bash
cd /home/autohaus
git clone https://github.com/andreyrozdesrvgc/autohaus-landing.git app
cd /home/autohaus/app
ls -la
```
Вы должны увидеть папки `frontend/`, `backend/`, файлы `deploy.sh`, `INSTALL.md`.

Если репозиторий приватный — сначала настройте SSH-ключ:
```bash
ssh-keygen -t ed25519 -C "autohaus-vps" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# Скопируйте вывод → GitHub → Settings → SSH keys → добавить
# Потом:
git clone git@github.com:andreyrozdesrvgc/autohaus-landing.git app
```

---

## ШАГ 9. Файлы окружения `.env`

### 9.1 `backend/.env` — секреты бэкенда
```bash
nano /home/autohaus/app/backend/.env
```

Вставить (замените значения!):
```
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=autohaus
JWT_SECRET=длинная-случайная-строка-минимум-32-символа-abc123xyz
ADMIN_EMAIL=admin@detailing-autohaus.ru
ADMIN_PASSWORD=НадёжныйПарольДляАдминки2026!
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
MAX_BOT_TOKEN=ваш_max_токен_если_есть
MAX_CHAT_ID=числовой_id_чата_max
CORS_ORIGINS=*
```
Сохранить: `Ctrl+O` → `Enter` → `Ctrl+X`.

**Важно:**
- Никаких кавычек и пробелов вокруг `=`
- Если MAX не используете — просто оставьте эти строки пустыми или удалите
- `JWT_SECRET` сгенерируйте случайной строкой (можно `openssl rand -hex 32`)

### 9.2 `frontend/.env` — относительный API URL
```bash
cat > /home/autohaus/app/frontend/.env <<'EOF'
REACT_APP_BACKEND_URL=
WDS_SOCKET_PORT=443
EOF
cat /home/autohaus/app/frontend/.env
```

⚠️ После `REACT_APP_BACKEND_URL=` **ничего нет и должно быть пусто** — так фронтенд обращается к API по `/api/*` через тот же домен, и Nginx проксирует внутрь VDS.

---

## ШАГ 10. Python-зависимости backend

```bash
cd /home/autohaus/app/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```
Установка занимает 2-3 минуты. Ошибок быть не должно.

---

## ШАГ 11. Сборка frontend

```bash
cd /home/autohaus/app/frontend
yarn install --frozen-lockfile
yarn build
ls -la build/     # должен появиться index.html и папка static/
```

Билд занимает 1-3 минуты. В конце должно быть `Compiled successfully.`

### Если yarn падает с "Killed" или сервер уходит в reboot
Значит закончилась RAM. Проверьте:
```bash
free -h
```
Swap должен быть **`4.0Gi`**. Если нет — вернитесь к **Шагу 3** и создайте swap-файл.

---

## ШАГ 12. Запуск бэкенда через PM2

Конфиг `ecosystem.config.js` уже в репозитории (`backend/ecosystem.config.js`), ничего создавать не нужно.

```bash
cd /home/autohaus/app/backend
pm2 start ecosystem.config.js
pm2 save
```

### Автозапуск PM2 после ребута
```bash
pm2 startup
```

Команда выведет строку типа:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u autohaus --hp /home/autohaus
```
**Скопируйте её полностью и выполните**. Затем:
```bash
pm2 save
```

### Проверка
```bash
pm2 status
```
Строка `autohaus-backend` должна быть **online** (зелёная).

```bash
curl http://127.0.0.1:8001/api/content | head -c 200
```
Должен вернуть JSON, начинающийся с `{"hero":{...`.

```bash
curl http://127.0.0.1:8001/api/admin/notify-status
```
Ответ покажет что подхватилось из `.env`:
```json
{"TELEGRAM_BOT_TOKEN_set":true,"TELEGRAM_CHAT_ID_set":true,"MAX_BOT_TOKEN_set":true,"MAX_CHAT_ID_set":true}
```

### Если бэкенд крашится (status `errored` / `restarting`)
```bash
pm2 logs autohaus-backend --lines 60 --nostream
```
Ищите `Traceback` в самом низу. Частые причины:
- **`Connection refused` к MongoDB** → MongoDB не запущен, вернитесь к **Шагу 6**
- **`ModuleNotFoundError`** → пропущен `pip install`, повторите **Шаг 10**
- **`ADMIN_PASSWORD not set`** → `.env` не подхватился, проверьте `cat /home/autohaus/app/backend/.env`

---

## ШАГ 13. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/autohaus
```

Вставить целиком:
```nginx
server {
    listen 80;
    server_name detailing-autohaus.ru _;

    client_max_body_size 100M;

    # Frontend (React SPA)
    root /home/autohaus/app/frontend/build;
    index index.html;

    # API прокси на FastAPI backend
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

    # Кэш статики (JS/CSS/картинки/видео)
    location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|mp4)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # React SPA fallback — все остальные запросы → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Сохранить.

Активировать конфиг:
```bash
sudo ln -sf /etc/nginx/sites-available/autohaus /etc/nginx/sites-enabled/autohaus
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`sudo nginx -t` должен ответить `syntax is ok` и `test is successful`.

---

## ШАГ 14. КРИТИЧНО! Права для Nginx на папку build

Nginx работает от пользователя `www-data`, по умолчанию **не имеет доступа** к `/home/autohaus/`. Без этого шага — 500 Internal Server Error.

```bash
sudo chmod o+x /home/autohaus
sudo chmod o+x /home/autohaus/app
sudo chmod o+x /home/autohaus/app/frontend
sudo chmod -R o+rX /home/autohaus/app/frontend/build
```

### Проверка
```bash
curl -I http://127.0.0.1/
```
Должен вернуть `HTTP/1.1 200 OK`.

```bash
curl -s http://127.0.0.1/api/content | head -c 100
```
Должен показать JSON.

---

## ШАГ 15. Открываем сайт в браузере

```
http://139.100.226.220
```

Должно быть:
- Заголовок **«ПРЕОБРАЖАЕМ АВТОМОБИЛИ В ПРОИЗВЕДЕНИЕ ИСКУССТВА»**
- Меню сверху (AUTOHAUS · KALININGRAD)
- Видео/фото BMW на фоне
- Прокрутка показывает все секции (Протокол, Услуги, Конфигуратор, Команда, Клиенты и т.д.)

**Админка:** `http://139.100.226.220/admin/login`
Логин/пароль — из `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## ШАГ 16. SSL / HTTPS через Let's Encrypt

Только если `detailing-autohaus.ru` уже указывает A-записью на ваш IP! Проверьте:
```bash
dig detailing-autohaus.ru +short
```
Должен вернуть ваш IP (например `139.100.226.220`).

### Установка certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Выпуск сертификата (только основной домен, без www если DNS для www нет)
```bash
sudo certbot --nginx -d detailing-autohaus.ru --non-interactive --agree-tos -m ваш_email@example.com --redirect
```
Certbot:
- Автоматически добавит блок `listen 443 ssl` в Nginx
- Выпустит сертификат Let's Encrypt
- Настроит редирект `http://` → `https://`

### Проверка
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://detailing-autohaus.ru
```
Должно быть `HTTP/2 200`.

### Автообновление сертификата
```bash
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```
Сертификат сам обновляется каждые 60 дней.

### Если certbot ругается на www
```
Domain: www.detailing-autohaus.ru
Detail: DNS problem: NXDOMAIN
```
→ Для `www` не настроена A-запись у регистратора. Либо добавьте её в панели регистратора (Reg.ru, Timeweb и т.п.) — тип `A`, имя `www`, значение — ваш IP. Либо просто выпускайте сертификат без `www` (команда выше уже без него).

---

## ШАГ 17. MAX Bot webhook (после SSL)

Если используете MAX-бота — зарегистрируйте webhook:
```bash
curl -X POST "https://botapi.max.ru/subscriptions?access_token=ВАШ_MAX_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://detailing-autohaus.ru/api/max/webhook"}'
```

Проверить что webhook зарегистрирован:
```bash
curl "https://botapi.max.ru/subscriptions?access_token=ВАШ_MAX_BOT_TOKEN"
```

---

## Готово! Как обновлять сайт дальше

```bash
cd /home/autohaus/app && bash deploy.sh
```

Скрипт сам:
1. `git pull` (жёсткий reset на origin/main)
2. Обновит зависимости (backend + frontend)
3. Пересоберёт frontend (`yarn build`)
4. Выставит права для Nginx
5. Перезапустит PM2 (`--update-env` — подхватит новые переменные из `.env`)
6. Перезагрузит Nginx
7. Проверит `/api/content` — должен вернуть 200

Всё занимает 1-2 минуты. Контент (тексты/фото/видео/номера) редактируется через `/admin/login` без пересборки.

---

## Устранение проблем (шпаргалка)

### 502 Bad Gateway на `/api/*`
Бэкенд не отвечает.
```bash
pm2 status                    # должен быть online
pm2 logs autohaus-backend --lines 40 --nostream
sudo systemctl status mongod  # MongoDB должен быть running
ss -tlnp | grep 8001          # порт должен слушаться
```

### 500 Internal Server Error на frontend
Nginx не может прочитать `build/`.
```bash
sudo tail -n 20 /var/log/nginx/error.log
```
Если видите `Permission denied` — повторите **Шаг 14**.

### 404 Not Found
Nginx не находит `index.html` (не собран build или неверный путь).
```bash
ls /home/autohaus/app/frontend/build/index.html   # должен существовать
sudo nginx -t
```

### Не заходит в админку — кнопка «Вход…» висит
Backend недоступен из фронта. Проверьте:
```bash
curl -s http://127.0.0.1/api/content | head -c 100   # через nginx
curl -s http://127.0.0.1:8001/api/content | head -c 100   # напрямую в pm2
```

### Заявка отправляется 20-30 секунд
Проверьте что подтянули последнюю версию кода:
```bash
cd /home/autohaus/app && git log --oneline -5
```
Должен быть свежий коммит с `BackgroundTasks` в `server.py`.

### Форма зумит на мобильном при фокусе на input
Кэш браузера с pre-fix версией. На iPhone: очистить кэш Safari (Настройки → Safari → Очистить историю и данные) или открыть в приватной вкладке.

### MongoDB не запускается после ребута
```bash
sudo rm -f /var/lib/mongodb/mongod.lock
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
sudo systemctl start mongod
```

### yarn build падает / сервер уходит в reboot
Kernel panic из-за OOM. Проверьте swap:
```bash
free -h
```
Если `Swap: 0B` — повторите **Шаг 3**.

### Медиа в админке загружены, но на мобиле показываются старые
```bash
# Убедитесь что подтянут свежий backend с no-store заголовком:
curl -sI https://detailing-autohaus.ru/api/content | grep -i cache
# Должно быть: cache-control: no-store, no-cache, must-revalidate
```
Если нет — сделайте `bash deploy.sh` и пересоберите.

---

## Полезные команды

```bash
# Логи backend в реальном времени
pm2 logs autohaus-backend

# Мониторинг ресурсов PM2
pm2 monit

# Перезапуск backend с пересчётом env
pm2 restart autohaus-backend --update-env

# Перезагрузка nginx
sudo systemctl reload nginx

# Проверить статус всех сервисов
sudo systemctl status nginx mongod
pm2 status

# Использование RAM/CPU
free -h
htop

# Полный передеплой одной командой
cd /home/autohaus/app && bash deploy.sh
```

---

## Резюме — что должно быть в норме

| Проверка | Ожидаемый результат |
|----------|---------------------|
| `free -h` | Swap 4.0Gi |
| `sudo systemctl status mongod` | active (running) |
| `pm2 status` | autohaus-backend online |
| `curl -I https://detailing-autohaus.ru` | HTTP/2 200 |
| `curl -s https://detailing-autohaus.ru/api/content \| head -c 50` | `{"hero":{...` |
| `curl http://127.0.0.1:8001/api/admin/notify-status` | `TELEGRAM_BOT_TOKEN_set:true` |
| Открыть `https://detailing-autohaus.ru/admin/login` | Форма логина |
| Тестовая заявка через сайт | Приходит в Telegram/MAX за 1-2 сек |

Если все 8 пунктов ✅ — установка завершена корректно.

Успешного запуска!
