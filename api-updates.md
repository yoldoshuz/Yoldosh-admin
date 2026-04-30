# API Updates — Admin & Super Admin (для фронтенда)

Дата: 2026-04-30
Ветка: `develop`
Контекст: расширение админки и супер-админки — список бронирований, унифицированные пресеты дат, новые статистики (bookings / searches / DAU-MAU), сегментация по источнику регистрации.

---

## 0. Универсальные параметры фильтра по дате

Применяются **ко всем GET-эндпойнтам списков и статистик** в админке и супер-админке.

| Query param | Допустимые значения | Поведение |
|---|---|---|
| `range` | `today`, `yesterday`, `week`, `month` (default), `quarter`, `year`, `custom`, `day` (alias для `today`) | Пресет диапазона |
| `from` | ISO date | Начало кастомного диапазона (нужно вместе с `to`) |
| `to` | ISO date | Конец кастомного диапазона |
| `startDate` / `endDate` | ISO date | **Legacy**, по-прежнему работают, маппятся в `custom` |

Канонические окна:
- `today` — `00:00:00` сегодня → `23:59:59` сегодня (час-bucket)
- `yesterday` — вся вчерашняя дата (час-bucket)
- `week` — последние 7 дней (день-bucket)
- `month` — последние 30 дней (день-bucket) **default**
- `quarter` — последние 90 дней (~13 недель, неделя-bucket)
- `year` — последние 12 месяцев (месяц-bucket)
- `custom` — `from..to`, bucket выбирается автоматически

Если пресет/диапазон не передан — сервер возвращает данные за `month`.

Все статистические эндпойнты возвращают в ответе:
```json
{ "range": "month", "from": "2026-04-01T00:00:00.000Z", "to": "2026-04-30T23:59:59.999Z", ... }
```

> Хелпер: [`shared/utils/dateRange.ts`](shared/utils/dateRange.ts) — `resolveDateRange()` / `getDateRangeBounds()`.

---

## 1. Bookings — новый раздел в админке и супер-админке

### Новое разрешение
- `AdminPermission.BOOKINGS = 'bookings'` — добавлено в [`src/admin/auth/models/Admin.ts`](src/admin/auth/models/Admin.ts)
- Новые админы получают `bookings: true` по умолчанию.
- Существующие админы получают `bookings: true` через миграцию [`20260430120000-add-bookings-permission.js`](sequelize/migrations/20260430120000-add-bookings-permission.js).
- Управление флагом — через существующий `PUT /super-admin/admins/:adminId/permissions` (ключ `bookings` в JSON-теле).

### `GET /admin/bookings`
**Permission:** `BOOKINGS`

**Query:**

| Param | Тип | Описание |
|---|---|---|
| `page` | number, default `1` | |
| `limit` | number, default `20`, max `200` | |
| `sortBy` | `createdAt` (default), `updatedAt`, `totalPrice`, `seatsBooked`, `status`, `departure_ts`, `passenger.firstName`, `driver.firstName` | |
| `sortOrder` | `ASC` / `DESC` (default) | |
| `search` | string | Ищет по from/to city, from/to address, имени/телефону пассажира, имени/телефону водителя; для UUID — точно по `id`/`tripId`/`passengerId` |
| `status` | `PENDING`/`CONFIRMED`/`CANCELLED`/`FAILED` | |
| `tripId` | UUID | |
| `passengerId` | UUID | |
| `driverId` | UUID | Фильтр по водителю поездки |
| `fromCity` / `toCity` | string | iLike-поиск |
| `dateField` | `createdAt` (default) / `departure_ts` | На какое поле применять диапазон дат |
| `range` / `from` / `to` / `startDate` / `endDate` | см. §0 | |

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [{
      "id": "uuid",
      "tripId": "uuid",
      "passengerId": "uuid",
      "from_city": "Tashkent",
      "to_city": "Samarkand",
      "from_address": "...",
      "to_address": "...",
      "seatsBooked": 1,
      "totalPrice": "120000.00",
      "status": "CONFIRMED",
      "cancellationReason": null,
      "createdAt": "...",
      "updatedAt": "...",
      "passenger": {
        "id": "uuid", "firstName": "...", "lastName": "...",
        "phoneNumber": "+998...", "avatar": "...", "rating": 4.8, "role": "Passenger"
      },
      "trip": {
        "id": "uuid", "driver_id": "uuid",
        "from_city": "Tashkent", "to_city": "Samarkand",
        "departure_ts": "...", "arrival_ts": "...",
        "price_per_person": "120000.00", "status": "CREATED",
        "driver": { "id": "uuid", "firstName": "...", ... }
      }
    }],
    "total": 123,
    "totalPages": 7,
    "currentPage": 1
  }
}
```

### `GET /admin/bookings/:bookingId`
**Permission:** `BOOKINGS`. Возвращает один booking c полным trip + driver + passenger (включая `registration_source`).

### `PATCH /admin/bookings/:bookingId/status` (изменено)
**Permission:** теперь `BOOKINGS` (раньше было `TRIPS`). Тело и поведение — без изменений.

### `GET /super-admin/bookings`, `GET /super-admin/bookings/:bookingId`
SuperAdmin не использует permission-чек (как и остальные super-admin страницы), параметры идентичны `/admin/bookings`.

---

## 2. Searches — отдельная страница для супер-админа

### `GET /super-admin/searches`
Агрегированный список маршрутов из таблицы `searches` (то, что искали пользователи и гости).

**Query:**

| Param | Тип | Описание |
|---|---|---|
| `page` / `limit` | number | По умолчанию `1` / `20` |
| `sortBy` | `count` (default) / `last_searched_at` | |
| `sortOrder` | `ASC` / `DESC` | |
| `search` | string | iLike по `from_city`/`to_city`/`from_address`/`to_address` |
| `range` / `from` / `to` / `startDate` / `endDate` | см. §0 | |

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [{
      "from_city": "Tashkent",
      "to_city": "Samarkand",
      "count": 142,
      "unique_users": 87,
      "unique_guests": 21,
      "last_searched_at": "2026-04-30T17:00:00.000Z",
      "active_trips": 3
    }],
    "total": 530,
    "totalPages": 27,
    "currentPage": 1
  }
}
```

`active_trips` — сколько сейчас активных трипов (CREATED/IN_PROGRESS) по этому маршруту: т.е. сразу видно «спрос есть, предложения нет».

---

## 3. Statistics — новые и расширенные эндпойнты

Все доступны и под `/admin/stats/*` и под `/super-admin/stats/*`.
Все принимают `range` / `from` / `to` (§0).

### `GET /admin/stats/overview` *(расширено)*
В блок `users` добавлено:
```jsonc
{
  "users": {
    // ... существующие поля ...
    "bySource": {
      "byRole": { "drivers": 0, "passengers": 0 },
      "bySource": { "self": 0, "botImported": 0, "regBot": 0 },
      "byRoleAndSource": {
        "drivers":    { "self": 0, "botImported": 0, "regBot": 0 },
        "passengers": { "self": 0, "botImported": 0, "regBot": 0 }
      }
    },
    "newBySource": { /* такая же структура, но только за окно range */ },
    "dauMau": {
      "now": "2026-04-30T...",
      "dau": {
        "windowStart": "...",
        "total": 0,
        "byRole": { "drivers": 0, "passengers": 0 },
        "bySource": { "self": 0, "botImported": 0, "regBot": 0 }
      },
      "mau": { /* такая же структура */ },
      "stickiness": 0.0,        // DAU/MAU
      "totals": { /* всех зарегистрированных пользователей с разбивкой */ }
    }
  }
}
```

**Семантика источников (`registration_source` enum):**
- `self` — `registration_source = 'user'`: пользователь сам зарегистрировался через приложение.
- `botImported` — `registration_source = 'from_bot'`: водитель импортирован telegram-ботом, который читает каналы/группы с публикациями трипов.
- `regBot` — `registration_source = 'reg_bot'`: пользователь зарегистрирован через специального reg-бота.

**DAU/MAU** считается как **distinct user_id** с активностью за окно. Активность = одна из:
- запись в `searches` с `userId IS NOT NULL`
- запись в `bookings` (`passengerId`)
- запись в `trips` (`driver_id`)

DAU = последние 24 часа. MAU = последние 30 дней. Кеш 5 минут.

### `GET /admin/stats/users` *(расширено)*
Добавлены поля:
```jsonc
{
  "segmentation": {
    "allTime":  { /* aggregateUsersSource, см. выше */ },
    "newInRange": { /* такая же структура за окно range */ }
  },
  "dauMau": { /* как в overview.users.dauMau */ }
}
```

### `GET /admin/stats/bookings` ⭐ NEW
```jsonc
{
  "range": "month", "from": "...", "to": "...",
  "total": 12345,
  "byStatus": [{ "status": "CONFIRMED", "count": "..." }, ...],
  "timeSeries": {
    "created":   [{ "date": "1 Apr", "timestamp": "...", "value": 42 }],
    "confirmed": [...],
    "cancelled": [...]
  },
  "financials": {
    "revenueInRange": 0,           // SUM(totalPrice) для CONFIRMED
    "avgBookingPrice": 0,
    "avgSeatsBooked": 0
  },
  "top": {
    "routes": [{ "from_city": "...", "to_city": "...", "count": 0, "revenue": 0 }],
    "passengers": [{
      "id": "uuid", "firstName": "...", "lastName": "...", "phoneNumber": "...",
      "registration_source": "user",
      "bookings_count": 0, "spent": 0
    }]
  },
  "segmentation": {
    "bySource": { "self": 0, "botImported": 0, "regBot": 0 }
  }
}
```

### `GET /admin/stats/searches` ⭐ NEW
```jsonc
{
  "range": "month", "from": "...", "to": "...",
  "counts": {
    "totalSearches": 0,
    "uniqueUsers": 0,
    "uniqueGuests": 0
  },
  "timeSeries": { "total": [{ "date": "...", "timestamp": "...", "value": 0 }] },
  "top": {
    "routes":      [{ "from_city": "...", "to_city": "...", "count": 0 }],  // топ-30
    "fromCities":  [{ "from_city": "...", "count": 0 }],                    // топ-20
    "toCities":    [{ "to_city": "...", "count": 0 }]                       // топ-20
  },
  "distribution": {
    "byHour":      [{ "hour": 0..23, "count": 0 }],
    "byDayOfWeek": [{ "dayOfWeek": 0..6, "count": 0 }]   // 0 = воскресенье
  },
  "unmatched": {
    // маршруты, где искали но активных трипов за 30д не было
    "routes": [{ "from_city": "...", "to_city": "...", "searches_count": 0 }]
  }
}
```

### `GET /admin/stats/dau-mau` ⭐ NEW
Возвращает только блок `dauMau` (тот же, что в overview/users), без диапазона. Кеш 5 минут.

### `GET /admin/stats/trips` *(уже было)*
Внутри `top.routes` — топ маршрутов по созданным трипам. Это — то, что было раньше «топ запросов по маршрутам». Дополнительные «какие маршруты искали» — теперь в `/stats/searches.top.routes` + `/super-admin/searches`.

---

## 4. Изменения в существующих списках

Все нижеперечисленные эндпойнты теперь принимают `range` / `from` / `to` (§0) **дополнительно** к `startDate`/`endDate` (которые остаются для обратной совместимости).

### `GET /admin/trips`
Дополнительно:
- `dateField` — `departure_ts` (default) / `created_at`. Контролирует, на какое поле применяется диапазон дат.
- `search` теперь дополнительно матчит `from_city`/`to_city` (в дополнение к `from_address`/`to_address`).

### `GET /admin/users`
Дополнительные query-параметры:
- `registrationSource` — `user` / `from_bot` / `reg_bot`. Фильтрация по источнику.
- `verified` — `true` / `false`.
- `banned` — `true` / `false`.
- `range` / `from` / `to` / `startDate` / `endDate` — фильтрует по `createdAt`.

### `GET /admin/users/banned`
Принимает `range` / `from` / `to` / `startDate` / `endDate` — фильтрует по `updatedAt`.

### `GET /admin/reports`
Принимает `range` / `from` / `to` (фильтрует по `createdAt`). `startDate`/`endDate` — legacy.

### `GET /super-admin/active-trips`
- + `range` / `from` / `to` / `startDate` / `endDate` — фильтр по `departure_ts`.
- + `sortBy` / `sortOrder`.

### `GET /super-admin/finished-trips`
То же — + `range`/`from`/`to`/`startDate`/`endDate`/`sortBy`/`sortOrder`.

### `GET /super-admin/wallets`
- + `range` / `from` / `to` / `startDate` / `endDate` — фильтр по `createdAt` транзакции.
- + `sortBy` / `sortOrder`.

### `GET /super-admin/reports`
- + `range` / `from` / `to` / `startDate` / `endDate`.
- + `sortBy` / `sortOrder`.

---

## 5. Миграции

Одна новая миграция: [`sequelize/migrations/20260430120000-add-bookings-permission.js`](sequelize/migrations/20260430120000-add-bookings-permission.js).

Применить:
```bash
npm run migrate
```

Откатить:
```bash
npm run migrate:undo
```

Что делает:
- В `admins.permissions` JSONB у каждой записи добавляет `"bookings": true`, если ключа ещё нет.
- Откат удаляет ключ `bookings`.
- Никаких новых таблиц/колонок не требуется — данные booking-листа берутся из существующей таблицы `bookings`.

---

## 6. Чеклист для фронта (что ему делать)

1. **Сайдбар админки/супер-админки** — добавить пункт `Bookings` (рядом с Trips). Проверять `permissions.bookings` в админке.
2. **Страница `/admin/bookings`** — список с фильтрами:
   - search, status (`PENDING`/`CONFIRMED`/`CANCELLED`/`FAILED`),
   - тот же date-range presets-компонент, что для трипов (Today / Yesterday / Week / Month / Quarter / Year / Custom),
   - сортировки (`createdAt`, `totalPrice`, `seatsBooked`, `departure_ts`).
   - В строку: пассажир, водитель, маршрут, места, сумма, дата отправления, статус, действия (открыть detail / отменить).
3. **Date-range компонент** — единый универсальный selector с пресетами, который пробрасывает `range` (или `range=custom` + `from`+`to`). Использовать **на всех списках и статистиках**.
4. **Overview супер-админа** — добавить карточки/виджеты:
   - DAU / MAU / Stickiness (`users.dauMau`),
   - Сегментация: водители/пассажиры × self/bot-imported/reg-bot (`users.bySource.byRoleAndSource`),
   - Новые в окне (`users.newBySource`).
5. **Страница пользователей супер-админа** — добавить:
   - `dauMau` блок,
   - `segmentation.allTime` / `segmentation.newInRange`.
   - Фильтр списка по `registrationSource` (новый query-параметр).
6. **Страница bookings-stats** — отрисовать `GET /super-admin/stats/bookings` (графики created/confirmed/cancelled, KPI, top routes, top passengers, segmentation).
7. **Страница маршрутов поиска** — `GET /super-admin/searches` (главный список) + `GET /super-admin/stats/searches` (карточки/графики). Особое внимание — блок `unmatched.routes` (маршруты со спросом, но без предложения).

---

## 7. Файлы, которые тронуты на бэкенде

**Новые:**
- `shared/utils/dateRange.ts`
- `src/admin/bookings/{controller,service,repository}/*`
- `sequelize/migrations/20260430120000-add-bookings-permission.js`

**Изменены:**
- `src/admin/admin.ts` — роуты `/admin/bookings`, `/admin/stats/{bookings,searches,dau-mau}`
- `src/admin/superAdmin.ts` — роуты `/super-admin/{bookings,bookings/:id,searches,stats/{bookings,searches,dau-mau}}`
- `src/admin/auth/models/Admin.ts` — `AdminPermission.BOOKINGS`
- `src/admin/statistics/service/statisticsService.ts` — `getBookingsStatistics`, `getSearchesStatistics`, `getDauMauSegmentation`, расширения overview/users
- `src/admin/statistics/controller/statisticsController.ts` — обработчики `getBookings`, `getSearches`, `getDauMau`
- `src/admin/super-admin/{controller,service}/*` — `getSearchesPage`, расширение date-range параметров для существующих pages
- `src/admin/trips/repository/tripsRepository.ts` — поддержка новых date-range пресетов + `dateField`
- `src/admin/trips/service/tripsService.ts` — проброс новых параметров
- `src/admin/reports/{controller,repository,service}/*` — поддержка новых date-range пресетов
- `src/admin/users/{controller,service}/*` — пробрасывает фильтры
- `src/user/repository/userRepository.ts` — `findAllUsers` теперь принимает `registrationSource`/`verified`/`banned`/диапазон, `findBannedUsers` принимает диапазон
- `src/user/service/userService.ts` — пробрасывает новые параметры

---

## 8. Полная карта новых endpoint'ов (cheat sheet)

```
GET    /admin/bookings
GET    /admin/bookings/:bookingId
PATCH  /admin/bookings/:bookingId/status        (permission переехал TRIPS → BOOKINGS)
GET    /admin/stats/bookings
GET    /admin/stats/searches
GET    /admin/stats/dau-mau

GET    /super-admin/bookings
GET    /super-admin/bookings/:bookingId
GET    /super-admin/searches
GET    /super-admin/stats/bookings
GET    /super-admin/stats/searches
GET    /super-admin/stats/dau-mau
```

Все принимают пресеты дат `range/from/to` из §0.
