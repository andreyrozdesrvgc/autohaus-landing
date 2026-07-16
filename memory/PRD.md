# AUTOHAUS — Product Requirements Document

## Original Problem Statement
Премиальный лендинг детейлинг-центра в Калининграде, специализация — оклейка авто (полиуретан + винил).
Стиль: Ultra Premium / Black & White / Minimal / Cinematic (Porsche/Apple/Tesla).
Секции: Hero, Interactive Before/After, Services, Premium Configurator, Safety Protocol, AutoHaus Live, Quiz (с manager chat), Stats, Gallery.
Требования: CMS/админка для правки текста/фото/видео; Telegram-бот для заявок; работа на внешнем хостинге (Selectel VPS); удалены все Emergent-пакеты/трекеры.

## User Personas
- **Клиент**: Владелец премиального авто в Калининграде (BMW, Mercedes, Porsche) — ищет качественный wrapping.
- **Менеджер AUTOHAUS**: Получает лиды в Telegram, редактирует контент через `/admin`.

## Core Requirements
### Frontend (React SPA)
- Full landing page (RU) с cinematic анимациями (Framer Motion)
- Адаптивная мобильная версия (viewport 390-430px)
- SEO: полная разметка Schema.org, Open Graph, canonical
- Favicon чёрный + белая A, theme-color #000000

### Backend (FastAPI + MongoDB)
- CMS API: `GET /api/content`, `POST /api/admin/login`, PUT для секций
- Media API: `GET /api/media/{id}` с HTTP Range support (видео streaming)
- Leads API: `POST /api/leads` → отправка в Telegram

### Deployment
- Selectel Ubuntu VPS, Nginx + PM2 + venv
- `bash deploy.sh` — one-command обновление с GitHub
- `INSTALL.md` — полная установка с нуля

## Completed Work (Changelog)

### 2026-07-15 — Deployment stabilization
- Исправлен black screen на VPS: ErrorBoundary + safe `content?.hero || {}` в Hero
- `REACT_APP_BACKEND_URL` теперь опциональный (fallback на относительный `/api` для nginx proxy)
- Nginx 500 fix: правильные права `chmod o+rX` на `/home/autohaus/app/frontend/build`
- Создан `deploy.sh` — one-command update script (git pull → yarn build → chmod → pm2 restart → nginx reload → HTTP check)
- Создан `INSTALL.md` — полная 15-шаговая инструкция для чистого Ubuntu VPS

### 2026-07-16 — UX refinements (iteration 6)
- **Hero mobile**: заголовок + подзаголовок + 2 CTA подтянуты в верхнюю треть экрана (spacer перенесён под CTA-блок)
- **Protocol mobile**: карточки этапов уменьшены с 78vh до 62vh (min-440, max-560) — меньше пустого пространства
- **AutoHaus Live**: `autoPlay` + `preload="auto"` + IntersectionObserver threshold 0.12 с rootMargin 20% — видео стартуют до полного попадания в вьюпорт, нет чёрных кадров
- **WhatsApp icon**: заменён на solid filled SVG (официальный glyph WhatsApp)
- **Favicon**: чёрный квадрат + белая A (favicon.ico multi-res + favicon.svg + apple-touch-icon 180 + logo192/512)
- **Browser tab color**: theme-color #000000 (light + dark scheme), apple-mobile-web-app-status-bar-style, msapplication-TileColor

## Backlog / Future

### P0 (готов к пользовательской проверке)
- Пользователь пересобирает и деплоит на Selectel VPS (139.100.226.220)
- SSL через certbot после привязки домена

### P1 (nice to have)
- Realtime notifications в админке о новых лидах
- Экспорт лидов в CSV
- Аналитика: Яндекс.Метрика / Google Analytics (по запросу)
- Мобильная версия админки (сейчас responsive но не оптимизирована)

### P2 (backlog)
- Multi-language (EN version)
- A/B testing разных Hero-заголовков
- Онлайн-запись с календарём (замена LeadPopup)

## Deployment Note
CRA dev server НЕ hot-reload'ит изменения в `/app/frontend/public/index.html`.
После правки этого файла обязательно: `sudo supervisorctl restart frontend`.

## Test Credentials
См. `/app/memory/test_credentials.md`
