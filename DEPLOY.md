# AUTOHAUS — Инструкция по деплою

Frontend → **Vercel** · Backend → **Render** · Database → **MongoDB Atlas**

---

## 1. Backend (Render)

### Build & Start
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `backend`

### Environment Variables (Render → Settings → Environment)
Установить ВРУЧНУЮ в дашборде Render — файл `.env` не коммитится:

```
MONGO_URL=mongodb+srv://...           ← ваш Atlas connection string
DB_NAME=autohaus
CORS_ORIGINS=https://detailing-autohaus.ru,https://www.detailing-autohaus.ru
TELEGRAM_BOT_TOKEN=...                ← из @BotFather
TELEGRAM_CHAT_ID=...                  ← ваш chat_id
JWT_SECRET=<64-символьная случайная hex-строка>
ADMIN_EMAIL=admin@detailing-autohaus.ru
ADMIN_PASSWORD=<ваш-надёжный-пароль>
```

> **Важно**: `JWT_SECRET` сгенерируйте свой:  
> `python -c "import secrets; print(secrets.token_hex(32))"`

> **Важно**: `ADMIN_PASSWORD` — это пароль для входа в `/admin/login`.  
> Можете задать любой — при следующем рестарте бекенда хеш в БД автоматически обновится.

---

## 2. Frontend (Vercel)

### Build & Output
- **Framework Preset**: Create React App (Other)
- **Root Directory**: `frontend`
- **Build Command**: `yarn build`
- **Output Directory**: `build`
- **Install Command**: `yarn install`

### Environment Variables (Vercel → Settings → Environment Variables)
```
REACT_APP_BACKEND_URL=https://<имя-вашего-render-сервиса>.onrender.com
```

> Без слеша в конце. Это URL вашего Render backend — Vercel будет к нему обращаться из браузера пользователя.

### SPA-routing (важно для админки)
Файл `frontend/vercel.json` уже в репозитории — содержит правило перенаправления всех маршрутов на `/index.html`, чтобы React Router корректно открывал `/admin/login` и `/admin`. **Просто задеплойте — Vercel сам подхватит.**

---

## 3. Проверка после деплоя

1. Открыть `https://detailing-autohaus.ru` — лендинг должен загрузиться.  
2. Открыть `https://detailing-autohaus.ru/admin/login` — должна показаться форма входа (НЕ 404).  
3. Войти с `ADMIN_EMAIL` + `ADMIN_PASSWORD` из Render. Должна открыться админка.  
4. Поменять любой текст → нажать "сохранить" → открыть сайт в новой вкладке → изменения видны.  
5. Загрузить тестовое фото в любую карточку → сохранить → проверить, что фото отображается на сайте.

---

## 4. Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| `/admin/login` показывает 404 на сайте | Нет SPA-rewrite на Vercel | Убедиться, что `frontend/vercel.json` присутствует в репо. Перезадеплоить. |
| "Неверный email или пароль" | На Render не задан `ADMIN_PASSWORD` или задан другой | Проверить env-переменные в Render → Settings → Environment → Deploy |
| CORS error в DevTools | Не задан `CORS_ORIGINS` на Render | Добавить домен фронта в `CORS_ORIGINS` через запятую |
| Лиды не приходят в Telegram | Не заданы `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Задать в Render env |
| Загруженные через CMS фото пропадают после рестарта Render | Render free tier очищает диск; но мы храним в MongoDB GridFS — не должно происходить | Убедиться что `MONGO_URL` указывает на постоянную БД (Atlas) |

---

## 5. Где хранятся фото / видео?

Все файлы, загруженные через админку, попадают в **MongoDB GridFS** (коллекция `media`). Это значит:
- Файлы хранятся **в той же базе**, что и контент сайта.
- При смене Render free → paid и при рестарте контейнера ничего не теряется (если БД — это Atlas, а не локальный Mongo).
- URL вида `/api/media/<id>` отдаются бекендом со стримингом и кешем на 1 год.
