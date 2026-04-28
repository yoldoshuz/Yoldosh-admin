# Yoldosh Admin API

Документация по всем эндпоинтам для админ-панели.

- **Base URL (prod):** `https://api.yoldosh.uz`
- **Base URL (test):** `https://test-api.yoldosh.uz`
- **Base URL (local):** `http://localhost:5000`

---

## Аутентификация

Все админ-роуты защищены JWT-токеном.

- Cookie: `admin-token` (HttpOnly) — приходит после `/admin/login`.
- Header: `Authorization: Bearer <token>` — альтернатива для клиентов без cookie.

После логина возвращается `accessToken` (30 дней). Также проставляется
`admin-refresh-token` cookie для обновления.

JWT содержит `id`, `role` и `sid` (session id). `sid` склеивает события
`LOGIN` и `LOGOUT` в одну сессию для таймлайна.

### Роли

| Роль         | Описание                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `Admin`      | Обычный админ. Доступ к функциям контролируется `permissions`.                                                          |
| `SuperAdmin` | Полный доступ. Bypass всех `checkPermission`. Эксклюзивно: управление админами, глобальный лог, расширенная статистика. |

### Permission flags (только для `Admin`)

`SuperAdmin` всегда `true` для всего.

| Ключ                  | Что разрешает                                        |
| --------------------- | ---------------------------------------------------- |
| `driver_applications` | `/admin/applications/*`                              |
| `reports`             | `/admin/reports/*`                                   |
| `trips`               | `/admin/trips/*`, `/admin/bookings/*`                |
| `notifications`       | `/admin/notifications/global*`                       |
| `promocodes`          | `/admin/promocodes/*`, `/admin/user-promocodes`      |
| `moderation`          | `/admin/moderation/words/*`                          |
| `blogs`               | `/admin/blog/*`                                      |
| `users` _(новый)_     | `/admin/users/*` — список, поиск, детали, бан/разбан |

---

## 1. Auth & профиль

### POST `/admin/login`

Логин по email + password (email — `*@yoldosh.uz`).

```json
// request
{ "email": "ivan@yoldosh.uz", "password": "secret" }

// response 200
{
  "success": true,
  "data": {
    "admin": { "id": "...", "email": "...", "role": "Admin" },
    "accessToken": "<jwt>"
  }
}
```

При первом логине `password` сохраняется как новый. Лог пишет
`AdminAction.LOGIN` с `sessionId`, `ipAddress`, `userAgent`.

### POST `/admin/logout`

Очищает refresh-cookie, пишет лог `AdminAction.LOGOUT` с тем же `sessionId`.

### GET `/admin/me`

Текущий админ.

---

## 2. Статистика

Все stats-эндпоинты доступны и Admin (через cookie), и SuperAdmin
(через `/super-admin/stats/*`).

**Query параметры (общие):**

- `range` — `day` | `week` | `month` | `year` | `custom` (default: `month`)
- `from`, `to` — ISO даты, обязательны при `range=custom`

### GET `/admin/stats` или `/admin/stats/overview`

Возвращает большой dashboard со всеми KPI разом:

```json
{
  "range": "month",
  "from": "...",
  "to": "...",
  "users": {
    "total": 12345,
    "passengers": 9000,
    "drivers": 3300,
    "verified": 4500,
    "banned": 12,
    "newInRange": 800,
    "newDriversInRange": 60,
    "graph": [{ "date": "1 апр", "timestamp": "...", "value": 30 }],
    "driversGraph": [...]
  },
  "trips": {
    "total": 56000,
    "byStatus": { "CREATED": 100, "IN_PROGRESS": 40, "COMPLETED": 50000, "CANCELED": 5860 },
    "createdInRange": 1500,
    "completedInRange": 1300,
    "graph": [...]
  },
  "bookings": {
    "total": 32000,
    "byStatus": { "CONFIRMED": 25000, "PENDING": 100, "CANCELLED": 6900 },
    "graph": [...]
  },
  "reports": {
    "total": 200,
    "byStatus": { "PENDING": 5, "RESOLVED": 180, "REJECTED": 15 },
    "graph": [...]
  },
  "wallet": { "totalBalance": 9_000_000, "topUpsInRange": 2_000_000, "graph": [...] },
  "applications": { "pending": 8, "verified": 200 },
  "admins": { "admins": 6, "superAdmins": 2 },
  "guests": { "uniqueInRange": 450 }
}
```

### GET `/admin/stats/users`

Сегментация юзеров: распределение по ролям/полу/языку/источнику регистрации,
флаги (verified / passport_verified / banned / wallet_blocked / withPromocode),
график регистраций, регистрации по часу дня, топ-10 водителей по поездкам,
топ-10 пассажиров по бронированиям.

### GET `/admin/stats/trips`

Поездки: распределение по статусу и `booking_type`, временные ряды
(created / completed / canceled), средняя цена, средний `seats_available`,
**fill rate** (% занятости мест) по диапазону, топ-15 маршрутов, топ-10
городов отправления/прибытия, топ-10 водителей по числу поездок.

### GET `/admin/stats/wallet`

Финансы: общий баланс на руках у юзеров, распределение по бакетам
(0 / negative / <50k / <200k / <1m / >=1m), транзакции по типам/статусам,
сумма по типам COMPLETED, график пополнений (PAYMENT/COMPLETED), средний
чек, число пополнений, число `is_wallet_blocked` юзеров, топ-10 кошельков.

### GET `/admin/stats/active-trips`

Снапшот текущей нагрузки: `inProgress`, `created`, `departingToday`,
`startedLast24h`, разбивка по городам отправления, средняя длительность
поездки за 30 дней, средняя задержка старта (factual `trip_start_ts -
declared departure_ts`).

### GET `/admin/stats/reports`

Жалобы: по статусам, графики created/resolved, среднее время резолва в
минутах, топ причин, топ пользователей-нарушителей.

### GET `/admin/stats/admins` _(SuperAdmin)_

Активность админов: распределение по ролям, количество действий по
категориям, график действий, топ-20 самых активных админов с last_action_at,
последние 20 логинов с IP/UA.

---

## 3. Управление пользователями

> Все защищены permission `users` (либо SuperAdmin).

### GET `/admin/users`

Список пользователей. Query: `page`, `limit`, `sortBy`, `sortOrder`,
`search`, `role` (`Passenger`|`Driver`), `hasPromoCode` (`true`|`false`).

### GET `/admin/users/search?query=`

Поиск (минимум 1 символ). Логирует `SEARCH_USERS`.

### GET `/admin/users/banned`

Список забаненных. Query: `page`, `limit`, `sortBy`, `sortOrder`.

### GET `/admin/users/:userId`

Детальный профиль (с поездками, бронями, рейтингами, кошельком). Логирует
`VIEW_USER_DETAILS` с snapshot имени и роли.

### POST `/admin/users/:userId/ban`

```json
{ "durationInDays": 7, "reason": "Спам" }
```

`durationInDays: null` → бан навсегда. Лог `BAN_USER` с metadata.

### PATCH `/admin/users/:userId/unban`

Логирует `UNBAN_USER`.

---

## 4. Поездки и бронирования

> permission `trips`

| Метод  | Путь                                | Что делает                                                    |
| ------ | ----------------------------------- | ------------------------------------------------------------- |
| GET    | `/admin/trips`                      | Список с фильтрами `status`, `search`, `startDate`, `endDate` |
| GET    | `/admin/trips/details/:tripId`      | Детали трипа (driver, car, bookings)                          |
| PATCH  | `/admin/trips/:tripId`              | Редактирование (`EDIT_TRIP` лог с before/after)               |
| DELETE | `/admin/trips/:tripId`              | Удаление (`DELETE_TRIP`)                                      |
| PATCH  | `/admin/trips/:tripId/force-status` | Смена статуса (`CHANGE_TRIP_STATUS`)                          |
| PATCH  | `/admin/bookings/:bookingId/status` | Смена статуса брони (`CHANGE_BOOKING_STATUS`)                 |

---

## 5. Жалобы (Reports)

> permission `reports`

| Метод | Путь                            | Описание                                                 |
| ----- | ------------------------------- | -------------------------------------------------------- |
| GET   | `/admin/reports?status=PENDING` | Список (фильтры: `search`, `startDate`, `endDate`)       |
| PATCH | `/admin/reports/:reportId`      | Смена статуса (`RESOLVED` / `REJECTED`)                  |
| POST  | `/admin/reports/:reportId/ban`  | Бан юзера по жалобе (Body: `{ reason, durationInDays }`) |

---

## 6. Заявки водителей

> permission `driver_applications`

| Метод | Путь                                        | Описание        |
| ----- | ------------------------------------------- | --------------- |
| GET   | `/admin/applications`                       | Список          |
| PATCH | `/admin/applications/:applicationId/status` | Verify / Reject |

---

## 7. Уведомления

> permission `notifications`

| Метод | Путь                          | Описание                                         |
| ----- | ----------------------------- | ------------------------------------------------ |
| POST  | `/admin/notifications/global` | Body: `{ title, content, type, targetAudience }` |
| GET   | `/admin/notifications/global` | История с пагинацией                             |

---

## 8. Модерация (стоп-слова)

> permission `moderation`

`GET / POST / DELETE` `/admin/moderation/words`.

---

## 9. Промокоды

> permission `promocodes`

| Метод  | Путь                             | Описание              |
| ------ | -------------------------------- | --------------------- |
| GET    | `/admin/promocodes`              | Глобальные промокоды  |
| POST   | `/admin/promocodes`              | Создать               |
| DELETE | `/admin/promocodes/:promoCodeId` | Удалить               |
| GET    | `/admin/user-promocodes`         | Использования юзерами |

---

## 10. Блог

> permission `blogs`

| Метод  | Путь                 | Описание                                          |
| ------ | -------------------- | ------------------------------------------------- |
| GET    | `/admin/blog`        | Список с фильтрами                                |
| POST   | `/admin/blog`        | Создать (Body — `BlogDto`)                        |
| PUT    | `/admin/blog/:id`    | Обновить                                          |
| DELETE | `/admin/blog/:id`    | Удалить                                           |
| POST   | `/admin/blog/upload` | Загрузка изображения (multipart, optimize → webp) |

---

## 11. SuperAdmin: управление админами

> Только `SuperAdmin`. Префикс `/super-admin`.

### GET `/super-admin/admins`

Все админы со всеми полями (без password).

### POST `/super-admin/admins`

```json
{ "email": "user@yoldosh.uz", "firstName": "Иван", "lastName": "Иванов" }
```

Создаётся без пароля; первый логин его установит.

### GET `/super-admin/admins/:adminId` _(новый)_

Полный профиль админа:

```json
{
  "admin": { "id": "...", "email": "...", "permissions": {...} },
  "stats": {
    "total": 845,
    "byCategory": [{ "category": "USERS", "count": 230 }, ...],
    "byAction":   [{ "action": "Изменил поездку", "count": 100 }, ...],
    "firstActionAt": "2026-01-12T...",
    "lastActionAt":  "2026-04-28T..."
  },
  "sessions": {
    "tracked": [
      {
        "sessionId": "uuid",
        "loginAt":  "2026-04-28T08:00:00Z",
        "logoutAt": "2026-04-28T17:30:00Z",
        "ipAddress": "1.2.3.4",
        "userAgent": "Mozilla/...",
        "durationMinutes": 570
      }
    ],
    "legacyLogins": [...],
    "legacyLogouts": [...]
  },
  "recentActions": [/* последние 25 логов */]
}
```

Query: `from`, `to` — ISO для фильтра `stats` по диапазону.

### PUT `/super-admin/admins/:adminId/permissions`

```json
{ "blogs": true, "trips": false, "users": true }
```

Принимает любой набор ключей `AdminPermission` (case-insensitive). Мерджится
с текущими permissions, лог `UPDATE_ADMIN_PERMISSIONS` хранит в `metadata`
итоговый объект и список изменённых ключей.

### DELETE `/super-admin/admins/:adminId`

Каскадно удаляет AdminLog. Лог `DELETE_ADMIN` пишется уже после на имя
SuperAdmin (с snapshot удалённого).

### GET `/super-admin/admins/:adminId/logs`

Логи конкретного админа. Query:

- `page`, `limit`, `sortBy`, `sortOrder`
- `search` — по action / details / admin_name / related_entity_id
- `startDate`, `endDate`
- `category` — `SESSION` | `USERS` | `TRIPS` | ...
- `action` — точное значение `AdminAction`
- `entityType` — `USER` | `TRIP` | `BOOKING` | ...
- `entityId` — фильтр по id связанной сущности

---

## 12. SuperAdmin: глобальный лог _(новый)_

### GET `/super-admin/logs`

Логи всех админов с теми же фильтрами что выше плюс:

- `adminIds=id1,id2,id3` — список админов через запятую

### Структура одного лога

```json
{
  "id": "uuid",
  "adminId": "uuid",
  "adminName": "Иван Иванов",
  "action": "Изменил поездку",
  "category": "TRIPS",
  "details": null,
  "timestamp": "2026-04-28T12:34:56Z",
  "relatedEntityId": "trip-uuid",
  "relatedEntityType": "TRIP",
  "entitySnapshot": {
    "label": "Tashkent → Samarkand",
    "subLabel": "2026-04-28T10:00:00Z",
    "meta": { "status": "CREATED", "price": 80000, "seats": 3, "driverId": "..." }
  },
  "metadata": {
    "changes": { "price_per_person": 90000 },
    "before": { "price_per_person": 80000, ... }
  },
  "ipAddress": "1.2.3.4",
  "userAgent": "Mozilla/...",
  "sessionId": "uuid",
  "isReverted": false
}
```

**Кликабельность:** фронт строит ссылку на сущность из
`relatedEntityType` + `relatedEntityId`. Например:

| `relatedEntityType`  | URL во фронте                                       |
| -------------------- | --------------------------------------------------- |
| `USER`               | `/users/<id>`                                       |
| `TRIP`               | `/trips/<id>`                                       |
| `BOOKING`            | `/bookings/<id>` или `/trips/<tripId>?booking=<id>` |
| `REPORT`             | `/reports/<id>`                                     |
| `DRIVER_APPLICATION` | `/applications/<id>`                                |
| `ADMIN`              | `/admins/<id>`                                      |
| `BLOG`               | `/blog/<id>`                                        |
| `NOTIFICATION`       | `/notifications/<id>`                               |
| `RESTRICTED_WORD`    | `/moderation/words/<id>`                            |
| `PROMOCODE`          | `/promocodes/<id>`                                  |

`entitySnapshot.label` используется как читаемое имя сущности (например
«Иван Иванов» вместо UUID), `subLabel` — для подзаголовка.

### Категории действий (`category`)

| Категория       | Действия                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| `SESSION`       | `LOGIN`, `LOGOUT`                                                         |
| `USERS`         | `BAN_USER`, `UNBAN_USER`, `VIEW_USER_DETAILS`, `SEARCH_USERS`             |
| `TRIPS`         | `EDIT_TRIP`, `DELETE_TRIP`, `CHANGE_TRIP_STATUS`, `CHANGE_BOOKING_STATUS` |
| `REPORTS`       | `VIEW_REPORTS`, `CHANGE_REPORT_STATUS`                                    |
| `APPLICATIONS`  | `REVIEW_DRIVER_APP`, `CHANGE_APP_STATUS`                                  |
| `ADMINS`        | `CREATE_ADMIN`, `DELETE_ADMIN`, `UPDATE_ADMIN_PERMISSIONS`                |
| `NOTIFICATIONS` | `CREATE_GLOBAL_NOTIFICATION`                                              |
| `MODERATION`    | `ADD_RESTRICTED_WORD`, `DELETE_RESTRICTED_WORD`                           |
| `BLOG`          | `CREATE_BLOG`, `UPDATE_BLOG`, `DELETE_BLOG`                               |
| `PROMOCODES`    | `CREATE_PROMOCODE`, `DELETE_PROMOCODE`                                    |
| `OTHER`         | fallback                                                                  |

---

## 13. SuperAdmin: dashboard-страницы

| Метод | Путь                          | Возвращает                                         |
| ----- | ----------------------------- | -------------------------------------------------- |
| GET   | `/super-admin/active-trips`   | Активные трипы (`status = IN_PROGRESS`), пагинация |
| GET   | `/super-admin/finished-trips` | Завершённые трипы                                  |
| GET   | `/super-admin/wallets`        | Транзакции пополнения с user-данными               |
| GET   | `/super-admin/guests`         | Гость-аккаунты (уникальные `guestId`)              |
| GET   | `/super-admin/reports`        | Все жалобы (все статусы), пагинация                |
| GET   | `/super-admin/me`             | Текущий SuperAdmin                                 |

---

## Формат ошибок

```json
{
  "details": "...",
  "error": "Сообщение",
  "success": false
}
```

| Код | Когда                                         |
| --- | --------------------------------------------- |
| 400 | Невалидный body / query (zod / валидаторы)    |
| 401 | Нет / битый токен                             |
| 403 | Permission denied / неверная роль             |
| 404 | Сущность не найдена                           |
| 409 | Конфликт (уже забанен, дубликат email и т.д.) |
| 500 | Внутренняя ошибка                             |

---

## Миграции

Этот рефактор требует выполнения миграции
`20260428120000-extend-admin-log-and-permissions.js`. Запустить:

```bash
npx sequelize-cli db:migrate
```

Миграция:

1. Добавляет в `admin_logs` колонки: `category`, `entity_snapshot` (JSONB),
   `metadata` (JSONB), `ip_address`, `user_agent`, `session_id`.
2. Расширяет `details` до `TEXT`.
3. Добавляет ENUM `enum_admin_logs_category` и backfill категорий для
   существующих логов.
4. Расширяет `enum_admin_logs_action` новыми action'ами (`UNBAN_USER`,
   `VIEW_USER_DETAILS`, `SEARCH_USERS`, `CHANGE_TRIP_STATUS`,
   `CHANGE_BOOKING_STATUS`, `CREATE_PROMOCODE`, `DELETE_PROMOCODE`).
5. Создаёт индексы: `(admin_id, timestamp DESC)`, `(category)`,
   `(related_entity_type, related_entity_id)`, `(session_id)`.
6. Backfill `permissions.users = true` и `permissions.blogs = true` всем
   существующим админам, у которых этих ключей ещё нет.
