# Prompt — Yoldosh Admin Panel Frontend (продовая версия)

Используй этот документ как **starter prompt** для следующей сессии Claude Code,
в которой будем строить продовый фронтенд админ-панели Yoldosh с нуля или
переписывать существующий.

---

## Контекст

Бекенд: Node.js + TypeScript + Sequelize + PostgreSQL, REST API.
Полная документация всех админ-эндпоинтов: `docs/ADMIN_API.md` (читай в первую очередь).

Существуют две роли:

- **Admin** — granular permissions (см. `AdminPermission` enum).
- **SuperAdmin** — полный доступ + эксклюзивно: управление другими админами,
  глобальный лог, расширенная статистика, dashboard-страницы (`/wallet`,
  `/active-trips`, `/finished-trips`, `/guests`).

---

## Цели

1. **Глобальный редизайн.** Единый стиль для всех экранов:
   - Типографика: одна шрифтовая шкала (h1–h6, body, caption, mono),
     один шрифт. Никаких хаотичных размеров.
   - Палитра: 1 primary, 1 accent (для предупреждений/банов), neutral-шкала
     (50–950), success/warning/danger/info. Темная тема — обязательна, но
     дизайнить нужно сразу под обе.
   - Spacing: 4px-grid. Никаких magic-чисел в padding/margin.
   - Радиусы: 8/12/16, тени: 1 уровень mid-elevation, 1 high-elevation.
2. **Компонентная база.** Никаких inline-стилей и хаотичных CSS-классов.
   Один Button, один Input, один Select, одна Modal, один Drawer, одна
   Table с server-side пагинацией/сортировкой/фильтрами, один EmptyState,
   один Skeleton, один Toast, один Pill/Badge для статусов.
3. **Реальное использование всех новых эндпоинтов** (см. ниже).
4. **UX-качество.** Loading skeletons вместо спиннеров. Retry-кнопка при
   ошибке. Optimistic updates где безопасно. Confirm-modal перед
   деструктивными действиями (бан, удаление). Хоткеи для частых операций
   (`/` — поиск, `Esc` — закрыть модал, `Cmd+K` — командная палитра).
5. **Доступность.** Tab-order, focus-rings, aria-labels на иконках,
   контраст ≥ AA.

---

## Информационная архитектура (sidebar)

```
[ Главная ]              GET /admin/stats/overview
[ Пользователи ]         /users (USERS perm)
   ↳ Поиск
   ↳ Забаненные
[ Поездки ]              /trips (TRIPS perm)
   ↳ Активные
   ↳ Завершённые
[ Жалобы ]               /reports (REPORTS perm)
[ Заявки водителей ]     /applications (DRIVER_APPLICATIONS perm)
[ Уведомления ]          /notifications/global (NOTIFICATIONS perm)
[ Модерация ]            /moderation/words (MODERATION perm)
[ Промокоды ]            /promocodes (PROMOCODES perm)
[ Блог ]                 /blog (BLOGS perm)
─────────── (только SuperAdmin)
[ Аналитика ]
   ↳ Пользователи        /super-admin/stats/users
   ↳ Поездки             /super-admin/stats/trips
   ↳ Кошельки            /super-admin/stats/wallet
   ↳ Активные поездки    /super-admin/stats/active-trips
   ↳ Жалобы              /super-admin/stats/reports
   ↳ Админы              /super-admin/stats/admins
[ Финансы ]              /super-admin/wallets
[ Гости ]                /super-admin/guests
[ Админы ]               /super-admin/admins
[ Журнал действий ]      /super-admin/logs
```

Скрывай пункты, на которые у текущего админа нет permission, **на клиенте**
(отрисовка) — но всегда верь только бекенду (он вернёт 403, фронт это ловит
и показывает Forbidden-страницу).

---

## Ключевые экраны

### Главная (Overview)

`GET /admin/stats/overview?range=...`

Сетка KPI-карточек (StatCard):

- Пользователи всего / новых за период / водителей / пассажиров / забаненных
- Поездки всего / по статусам (как chip-распределение)
- Бронирования всего / CONFIRMED / PENDING / CANCELLED
- Жалобы (PENDING — ярко если > 0)
- Кошельки: общий баланс на руках
- Заявки водителей PENDING

Под карточками — 4 крупных графика (recharts AreaChart):

- Регистрации (users.graph + driversGraph как 2 линии)
- Поездки (trips.graph)
- Бронирования (bookings.graph)
- Пополнения (wallet.graph)

DateRangePicker сверху: пресеты (24ч / 7д / 30д / 12мес / custom).

### Юзеры

Таблица server-side: имя, телефон, роль, рейтинг, banned-pill, createdAt,
кнопки «Открыть», «Забанить». Поиск через `/users/search` (debounce 300мс).
Tab «Все» / «Забаненные» (`/users/banned`).

`/users/:id` — карточка профиля + табы:

- Общее (с банами)
- Поездки как водителя (если Driver)
- Бронирования как пассажира
- Кошелёк + история транзакций
- Жалобы на этого юзера / от этого юзера
- Действия (`POST /users/:id/ban`, `PATCH /users/:id/unban`)

### Журнал действий (SuperAdmin)

`GET /super-admin/logs` со всеми фильтрами.

Таблица: timestamp, admin (avatar+имя→ссылка `/admins/:id`), category-badge
(цвет по категории), action, **сущность** (label из `entitySnapshot.label`,
ссылка через `EntityLink` на нужную страницу), IP.

При клике на строку — Drawer с полным JSON `metadata` (для diff-операций
рисуй before/after side-by-side, например для `EDIT_TRIP`).

Фильтры: DateRangePicker, multi-select по `category`, multi-select
`adminIds`, search, entityType + entityId.

### Профиль админа (SuperAdmin)

`GET /super-admin/admins/:id`

Layout:

1. Заголовок: avatar (initials), имя, email, role-badge, кнопка «Удалить»
   (confirm modal), кнопка «Управление правами» (модал с чекбоксами на
   каждый AdminPermission, `PUT /admins/:id/permissions`).
2. KPI-полоска: total действий, в этом месяце, последний логин (relative
   time), всего сессий.
3. **Таймлайн сессий** — вертикальный таймлайн где каждая сессия = карточка:
   - LOGIN время → LOGOUT время (если есть)
   - длительность (форматировать `durationMinutes` в человеко-читаемый вид)
   - IP + краткий UA (с tooltip-ом полный)
   - Если LOGOUT-а нет → серая «активна или прервана»-метка.
4. **Распределение действий** — donut chart по `stats.byCategory` (цвета
   совпадают с category-badge).
5. **Топ действий** — bar chart по `stats.byAction` (top 10).
6. Таб «Действия» — `GET /admins/:id/logs` с теми же фильтрами что в
   глобальном логе, плюс секция fastest-выбор по category.

### Аналитика по страницам (SuperAdmin)

Каждая страница `/stats/*` рендерит соответствующие данные. Не
«дашборд везде одинаковый» — у каждой свой фокус:

- **Users**: горизонтальные баркарт-сравнения (по полу, языку, источнику),
  heatmap «час дня × день недели» (если потом расширим бэк) и leaderboard'ы
  топ водителей/пассажиров.
- **Trips**: KPI «fill rate %», карта-плотность маршрутов (placeholder
  пока — топ маршрутов в виде список). Линии created vs completed.
- **Wallet**: бакеты как stacked bar, transactions table с группировкой,
  top wallet-холдеры.
- **Active trips**: live-обновление каждые 30s, KPI inProgress + средняя
  задержка старта (объясни словами что значит).
- **Reports**: KPI avg resolution time, pending vs resolved trend,
  топ-причины как теги-облако.
- **Admins**: тот же layout что в /super-admin/admins/:id, но агрегатно.

---

## Permissions UI

`hooks/usePermission.ts`:

```ts
const { hasPermission, isSuperAdmin } = usePermission();
hasPermission("users"); // true для SuperAdmin всегда
isSuperAdmin; // показывает super-only пункты
```

Скрывай sidebar-пункты по этому хуку. На router-уровне — guard, который
пишет 403-страницу при попытке прямого URL-входа без прав.

---

## Дизайн-токены (стартовые значения)

```css
:root {
  --color-primary: 222 89% 56%; /* hsl */
  --color-primary-fg: 0 0% 100%;
  --color-bg: 0 0% 100%;
  --color-fg: 222 47% 11%;
  --color-muted: 220 14% 96%;
  --color-border: 220 13% 91%;
  --color-success: 142 76% 36%;
  --color-warning: 38 92% 50%;
  --color-danger: 0 84% 60%;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 16px rgb(0 0 0 / 0.08);

  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}

[data-theme="dark"] {
  --color-bg: 224 71% 4%;
  --color-fg: 210 20% 98%;
  --color-muted: 215 28% 17%;
  --color-border: 217 19% 27%;
}
```

Типографическая шкала (Tailwind config):

- `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18,
- `text-xl` 20, `text-2xl` 24, `text-3xl` 30, `text-4xl` 36 — никаких
  других значений.

---

## Edge cases которые нельзя забыть

- 401 от бэка → редирект на `/login` + сохранить redirect-back.
- 403 → отдельная страница «У вас нет прав на …», подсказка обратиться к
  SuperAdmin-у.
- Очень длинные `details` / `metadata` в логе → truncate + «развернуть».
- Когда `entitySnapshot` пустой (старые логи без снапшота) → fallback
  показать `relatedEntityType + entityId` как текст со ссылкой.
- `LOGIN` без `sessionId` (legacy) → секция «Старые сессии» с предупреждением.
- Карточки KPI с `null`/`undefined` значениями → плейсхолдер «—», не «0».
- Пустые таблицы → EmptyState с иллюстрацией и CTA («Создать»/«Сбросить фильтр»).
- `/admin/users/:userId` где `userId` равен «search» / «banned» — НЕ
  попадай в эту ловушку, бэкенд уже расставил порядки роутов так чтобы
  это работало, но сам тоже типизируй на фронте.

---

## Definition of Done

- Все 35+ эндпоинтов из `docs/ADMIN_API.md` имеют свой UI.
- Один и тот же визуальный язык во всех экранах (никаких «двух Button-ов
  с разной высотой»).
- Светлая и тёмная темы работают одинаково.
- Нет inline-стилей кроме абсолютно неизбежных.
- Все мутации показывают toast (success/error) и инвалидируют нужные
  query-keys.
- Build без warnings, линтер чистый.
- README с инструкцией как поднять локально + переменными окружения.
