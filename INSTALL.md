# AUTOHAUS — Установка с нуля (для мобильного SSH)

Инструкция максимально короткая: **все конфиги лежат в репозитории** и копируются одной командой. **Никаких heredoc, никакого редактирования nano вручную.**

Занимает 15-20 минут. Работает даже с мобильного SSH-клиента (Termius/Blink).

---

## Что нужно заранее

- VPS Selectel: **Ubuntu 22.04 LTS**, минимум **2 vCPU / 4 GB RAM / 40 GB SSD**
- Публичный IP
- Домен `detailing-autohaus.ru` привязан A-записью к этому IP (для SSL в конце)
- Тексты для `.env`:
  - `TELEGRAM_BOT_TOKEN` (от @BotFather)
  - `TELEGRAM_CHAT_ID`
  - (опционально) `MAX_BOT_TOKEN`, `MAX_CHAT_ID`
  - Придумать `ADMIN_EMAIL` и `ADMIN_PASSWORD`

---

## ШАГ 1. Подключиться к VPS

```
ssh root@ВАШ_IP
```

## ШАГ 2. Создать пользователя `autohaus`

Копируйте по одной команде:

```
adduser autohaus
```
(придумайте пароль, остальные поля можно пропустить нажатием Enter)

```
usermod -aG sudo autohaus
```

Дать sudo без пароля (упростит скрипты):
```
echo 'autohaus ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/autohaus
```
```
chmod 440 /etc/sudoers.d/autohaus
```

Переключиться на пользователя:
```
su - autohaus
```

**Дальше все команды — только под этим пользователем.**

## ШАГ 3. Клонировать проект

```
sudo apt-get update -qq && sudo apt-get install -y git
```
```
git clone https://github.com/andreyrozdesrvgc/autohaus-landing.git /home/autohaus/app
```
```
cd /home/autohaus/app
```

## ШАГ 4. Запустить bootstrap (это делает всё!)

```
bash bootstrap.sh
```

Скрипт сам:
- обновит систему
- создаст swap 4GB
- поставит Python, Node.js, Yarn, PM2, MongoDB 7, Nginx, UFW
- скопирует `configs/mongod.conf` в `/etc/mongod.conf`
- скопирует `configs/nginx-autohaus.conf` в nginx
- создаст `backend/.env` и `frontend/.env` (заготовки)
- запустит MongoDB (с автозапуском после ребута)
- **зарегистрирует PM2 в systemd** — переживёт любой ребут
- соберёт frontend и запустит backend
- проверит что всё работает

Займёт 5-10 минут. Если увидите ошибку — пришлите скрин, разберёмся.

## ШАГ 5. Прописать секреты в `backend/.env`

Bootstrap создал заготовку с `CHANGE_ME`. Открываете и правите:

```
nano /home/autohaus/app/backend/.env
```

Заполните реальными значениями:
- `JWT_SECRET` — придумайте длинную строку, например: `openssl rand -hex 32` даст готовую
- `ADMIN_PASSWORD` — надёжный пароль
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
- `MAX_BOT_TOKEN` и `MAX_CHAT_ID` (если используете)

Сохраните: `Ctrl+O` → Enter → `Ctrl+X`

Перезапустите backend, чтобы подхватил `.env`:
```
pm2 restart autohaus-backend --update-env
```

## ШАГ 6. Проверка что всё работает

```
pm2 status
```
Строка `autohaus-backend` должна быть **online** (зелёная).

```
curl -I http://127.0.0.1/api/content
```
Должен вернуть `HTTP/1.1 200 OK`.

Откройте в браузере: `http://ВАШ_IP` — сайт должен открыться.

Админка: `http://ВАШ_IP/admin/login` — логин/пароль из `backend/.env`.

## ШАГ 7. HTTPS через Let's Encrypt

Проверьте что DNS домена указывает на ваш IP:
```
dig detailing-autohaus.ru +short
```
Должен вернуть ваш IP.

Установите certbot:
```
sudo apt-get install -y certbot python3-certbot-nginx
```

Выпустите сертификат (замените `ВАШ_EMAIL` на реальный):
```
sudo certbot --nginx -d detailing-autohaus.ru --non-interactive --agree-tos -m ВАШ_EMAIL --redirect
```

Проверка:
```
curl -I https://detailing-autohaus.ru
```
Должно быть `HTTP/2 200`.

## ШАГ 8. Автобэкап MongoDB

Один раз, чтобы бэкенд ежедневно дампался в `/var/backups/autohaus/`:
```
sudo bash /home/autohaus/app/scripts/setup_backup_cron.sh
```

## ШАГ 9. MAX Bot webhook (если используете MAX)

```
curl -X POST "https://botapi.max.ru/subscriptions?access_token=ВАШ_MAX_BOT_TOKEN" -H "Content-Type: application/json" -d '{"url":"https://detailing-autohaus.ru/api/max/webhook"}'
```

---

## Готово! Как обновлять дальше

Любые изменения кода/конфигов из GitHub:
```
cd /home/autohaus/app && bash deploy.sh
```

Скрипт умеет **самолечиться**:
- Если MongoDB упала — попытается починить (удалит lock, восстановит конфиг, перезапустит)
- Если swap не подключён — создаст
- Если PM2 нет процессов — запустит из ecosystem.config.js

## Что делать после ребута VDS

**Обычно ничего.** PM2 и MongoDB встают автоматически через systemd.

Если что-то не работает — просто:
```
cd /home/autohaus/app && bash deploy.sh
```

---

## Быстрая диагностика (шпаргалка)

| Проблема | Команда |
|----------|---------|
| Сайт не открывается | `pm2 status`, `sudo systemctl status nginx mongod` |
| Backend недоступен | `pm2 logs autohaus-backend --lines 40 --nostream` |
| MongoDB упала | `sudo journalctl -u mongod -n 30 --no-pager` |
| Место на диске | `df -h` |
| Загрузка RAM | `free -h` |
| Что слушает 8001 | `ss -tlnp \| grep 8001` |

## Восстановление MongoDB (если совсем сломалась)

```
sudo systemctl stop mongod
sudo rm -f /var/lib/mongodb/mongod.lock /var/lib/mongodb/WiredTiger.lock
sudo cp /home/autohaus/app/configs/mongod.conf /etc/mongod.conf
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
sudo systemctl start mongod
```

Если и это не помогло — крайняя мера (сбросить БД, но контент восстановится из ZIP-бэкапа админки):
```
sudo systemctl stop mongod
sudo mv /var/lib/mongodb /var/lib/mongodb.broken
sudo mkdir /var/lib/mongodb && sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo systemctl start mongod
pm2 restart autohaus-backend --update-env
```
Потом в админке нажать «Восстановить из бэкапа».

---

## Резюме: что должно работать после установки

- ✅ `sudo systemctl is-active mongod` → `active`
- ✅ `sudo systemctl is-enabled mongod` → `enabled`
- ✅ `pm2 status` → autohaus-backend online
- ✅ `pm2 list` показывает процесс даже после ребута VDS (PM2 в systemd)
- ✅ `curl -I https://detailing-autohaus.ru` → `HTTP/2 200`
- ✅ Админка `/admin/login` открывается
- ✅ `free -h` → Swap 4.0Gi
- ✅ Автобэкап MongoDB в cron

Если все 7 пунктов ✅ — установка завершена корректно.

Успешного запуска!
