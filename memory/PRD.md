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

### 2026-08-09 — Mobile forms + Hero CTA + Quiz toggle (iteration 20)
- **Mobile inputs**: `viewport maximum-scale=1` + `@media 767px { input font-size 16px !important }` — iOS больше не зумит форму на focus, клавиатура открывается штатно
- **Touch UX**: `touch-action: manipulation` + минимальный `tap-highlight` на всех интерактивных элементах — двойной тап-зум отключён
- **Hero CTA**: `Рассчитать проект` теперь открывает LeadPopup (mode chooser с Telegram/WhatsApp/MAX/форма) — как кнопка «Записаться»
- **Quiz expert toggle**: новый CMS-переключатель `quiz.show_expert` — скрывает плашку менеджера (Максим), Quiz-карточка растягивается на всю ширину при `false`

### 2026-08-09 — Visibility toggle for sections (iteration 19)
- Секция BeforeAfter скрыта по умолчанию (`visible: False`)
- Универсальный toggle-переключатель в CMS: `{k:'visible', type:'toggle'}` — можно применить к любой секции
- Тумблер выводится в /admin над остальными полями секции

### 2026-08-09 — MAX + Yandex Metrika + Thank You page (iteration 18)
- **MAX API fix**: base URL `https://botapi.max.ru` (был неверный `platform-api2.max.ru`). Подтверждено curl — сообщения доставляются в чат «Заявки с сайта AutoHaus»
- **POST /api/max/webhook**: приёмник событий от MAX (message_created, callback и т.п.), отвечает 200 `{ok:true}` в <5с — соответствует требованию MAX «webhook ACK <30 сек». Nginx-alias `/max-webhook.php` → FastAPI
- **Yandex Metrika**: подключена в index.html (id 111530949, webvisor + clickmap + trackLinks). Хелпер `lib/metrika.js` с `reachGoal` / `trackLeadSubmit`
- **`/thank-you` страница**: после успешной отправки любой формы, редирект через 1.4с. Отправляет цели: `lead_submit_${source}`, `thank_you_view`, `thank_you_messenger_click`, `thank_you_maps_click`
- **CMS секция «Страница «Спасибо»»**: 11 полей (telegram_url, whatsapp_url, max_url, maps_url и т.д.) — редактируется без пересборки
- **Все 5 форм** трекают submits: LeadPopup, ExitIntent, Quiz, ContactForm, Configurator — каждая передаёт source в SuccessOverlay
- ExitIntent теперь отключён на `/thank-you` — не показывается сразу после отправки

### 2026-08-09 — Protocol mobile fix + Configurator CMS options (iterations 16-17)
- **Protocol mobile fix**: MobileStage теперь рендерит `<video autoPlay muted playsInline loop poster=...>` (как DesktopStage), с fallback на `<img>` или radial-gradient. До этого на мобилке был только `<img>` — при пустом poster карточки были полностью чёрными
- **Configurator options в CMS**: `film_types` / `finishes` / `coverage_options` / `addons` вынесены из хардкода в default_content.py, `Configurator.jsx` читает с валидацией + fallback. Admin.jsx расширен MultiListEditor — 3 списка в одной вкладке
- **Переименовано** «Винил» → «Цветной полиуретан» в дефолтном контенте

### 2026-08-09 — Gallery scroll + raw photos (iterations 14-15)
- **Gallery scroll fix**: динамический расчёт translate% + explicit `width: ${totalVW}vw` на motion.div — теперь все N фото (не только 3) проходят через viewport. Формула: `-(overflowVW/totalVW) * 100`. Высота обёртки: `max(240, 120 + count*45)vh`
- **Убраны эффекты с фото**: удалён `grayscale`, `bg-gradient-to-t` — фотки отображаются 1:1 как загружены. Title/meta вынесены в компактные chip'ы с `backdrop-blur` (только там где текст)
- Работает для любого количества работ в CMS

### 2026-08-09 — Team refinement + Clients color + MAX integration (iteration 13)
- **Team**: убраны CTA-кнопки под сотрудниками и связанный LeadPopup. Убрана per-card fade-анимация (карточки больше не «летают» при горизонтальном скролле — это была основная жалоба). Уменьшены до 260px десктоп / 242px мобилка, фото aspect 3:4 (было 4:5)
- **Clients**: убран `invert brightness-0` — логотипы теперь показываются в оригинальных цветах. Размер логотипа увеличен с `h-10 md:h-14` до `h-16 md:h-20 max-w-[80%]`
- **MAX integration**: новый `backend/max_service.py` — отправляет лиды в MAX-чат через `POST https://platform-api2.max.ru/messages?chat_id=X` c заголовком `Authorization: {token}`. Параллельно с Telegram. Env vars: `MAX_BOT_TOKEN`, `MAX_CHAT_ID`. Health-check показывает статус обеих переменных
- Endpoint `/api/leads` теперь сохраняет `max_sent` в MongoDB рядом с `telegram_sent`. Graceful skip если MAX creds не установлены (< 300ms response)

### 2026-08-08 — Team + Clients sections, Live video→photo (iteration 12)
- **Наша команда** (`/team`): 6 сотрудников (фото, имя, должность, специализация, стаж) с CTA «Записаться к [Имя]» — русские имена автосклоняются в дательный падеж. Framer-motion staggered fade-in при скролле
- **Наши клиенты** (`/clients`): 4-5 логотипов клиентов, компьютер = 1 ряд auto-fit, мобилка = 2 колонки. Без анимации логотипов
- **AutoHaus Live**: видео заменены на фото (аспект 9:16 сохранён), PhotoLightbox вместо VideoLightbox. Backward-compat: `item.image || item.poster`
- **CMS**: 2 новых таба (Наша команда, Наши клиенты). Live tab упрощён — только 4 поля на кадр (title, meta, cta_label, image). Количество лого/сотрудников/кадров любое
- Порядок секций: Hero → Protocol → Quiz → BeforeAfter → Services → Configurator → Stats → Gallery → **Live → Team → Clients** → Contact → Footer

### 2026-07-16 — Auth diagnostics + Yandex Disk auto-import (iterations 9-10)
- **GET /api/health** — публичный health-check: MongoDB ping, admin seeded, все env vars set. Помогает диагностировать проблемы на VPS
- **Improved AdminLogin errors**: 401→неверный пароль, 404→nginx misconfig, 502→pm2 down, 5xx→server error, network→backend недоступен
- **Startup logging**: логгер теперь явно пишет `❌ MISSING critical env vars` при старте если .env неполный
- **POST /api/admin/media/import-url**: принимает любую публичную ссылку (в т.ч. `disk.yandex.ru/i/...`), автоматически разрешает через Yandex Disk API, скачивает файл (макс 80 MB), сохраняет в GridFS
- **MediaPicker**: кнопка «Импортировать по ссылке» + жёлтая плашка-подсказка при вставке Yandex Disk share URL
- **mediaUrls.js**: добавлено большое предупреждение сверху — это НЕ источник контента, а fallback; правки в этом файле не отображаются на сайте

### 2026-07-16 — CMS reliability fixes (iterations 7-8)
- **Cache-buster**: `GET /api/content?t=${Date.now()}` + `Cache-Control: no-cache` header — обходит любой CDN/browser HTTP кэш
- **BroadcastChannel cross-tab sync**: при сохранении в `/admin` открытые лендинг-вкладки автоматически перезагружают контент без hard-reload (канал `autohaus-content-updates`)
- Улучшен toast после сохранения: "Сохранено. Изменения уже видны на сайте (если открыт — обновится сам)"
- Проверено E2E: полный save flow (admin → API → refresh → DOM) работает 100% на всех сценариях

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
