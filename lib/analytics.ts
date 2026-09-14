import type {
  AnalyticsFunnelCode,
  AnalyticsGranularity,
  AnalyticsMeta,
  AnalyticsPlatform,
  AnalyticsQuery,
  AnalyticsRole,
} from "@/types";

// ============================================================
// Yoldosh Analytics — общие правила раздела.
//
// Всё, что описано в разделе «1. Общие правила» документации бэкенда,
// живёт здесь: часовой пояс агрегации, границы диапазонов, подписи
// «Обновлено в 14:32» и словари человекочитаемых названий.
// ============================================================

/** Часовой пояс агрегации на бэке. День = сутки по Ташкенту. */
export const ANALYTICS_TZ = "Asia/Tashkent";

/** Максимум на один запрос — иначе бэк отвечает 400. */
export const MAX_RANGE_DAYS = 90;

/** CSV-экспорт ограничен 31 днём (осознанно, чтобы не блокировать выборку). */
export const MAX_EXPORT_DAYS = 31;

/** `granularity=hour` допустим только на диапазоне ≤ 3 дней. */
export const MAX_HOURLY_DAYS = 3;

/** Ниже этого числа пользователей выборка статистически незначима. */
export const LOW_SAMPLE_THRESHOLD = 100;

/** Витрины пересчитываются раз в 15 минут — дёргать API чаще незачем. */
export const ANALYTICS_STALE_TIME = 5 * 60 * 1000;

// ============================================================
// Даты. Аналитика работает с `YYYY-MM-DD` по Ташкенту, а не с ISO.
// ============================================================

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Сегодняшняя дата по Ташкенту в формате YYYY-MM-DD. */
export const analyticsToday = (): string => ymdFormatter.format(new Date());

/** Сдвиг YYYY-MM-DD на N дней (может быть отрицательным). */
export const shiftDay = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

/** Длина диапазона в днях, включительно с обеих сторон. */
export const rangeLengthDays = (from: string, to: string): number => {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
};

/** Человекочитаемая дата дня витрины: «14 сен». */
export const formatDay = (ymd: string | null | undefined): string => {
  if (!ymd) return "—";
  const dt = new Date(`${ymd}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return ymd;
  return dt.toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });
};

/** Точка на оси: день → «14 сен», час → «14:00». */
export const formatSeriesTick = (t: string | null | undefined, granularity: AnalyticsGranularity = "day"): string => {
  if (!t) return "—";
  if (granularity === "hour") {
    const dt = new Date(t);
    if (Number.isNaN(dt.getTime())) return t;
    return dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: ANALYTICS_TZ });
  }
  return formatDay(t.slice(0, 10));
};

/** `meta.calculated_at` → «14:32» по Ташкенту. */
export const formatCalculatedAt = (iso?: string | null): string | null => {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ANALYTICS_TZ,
  });
};

// ============================================================
// Фильтры. Один объект на все экраны раздела.
// ============================================================

export type AnalyticsPreset = "today" | "yesterday" | "7d" | "14d" | "30d" | "90d" | "custom";

export type AnalyticsFilterValue = {
  preset: AnalyticsPreset;
  from: string;
  to: string;
  platform?: AnalyticsPlatform;
  app_version?: string;
  role?: AnalyticsRole;
};

export const ANALYTICS_PRESETS: { key: AnalyticsPreset; label: string; shortLabel: string }[] = [
  { key: "today", label: "Сегодня", shortLabel: "Today" },
  { key: "yesterday", label: "Вчера", shortLabel: "Вчера" },
  { key: "7d", label: "7 дней", shortLabel: "7 дн" },
  { key: "14d", label: "14 дней", shortLabel: "14 дн" },
  { key: "30d", label: "30 дней", shortLabel: "30 дн" },
  { key: "90d", label: "90 дней", shortLabel: "90 дн" },
];

export const presetToRange = (preset: AnalyticsPreset): { from: string; to: string } => {
  const today = analyticsToday();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = shiftDay(today, -1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: shiftDay(today, -6), to: today };
    case "14d":
      return { from: shiftDay(today, -13), to: today };
    case "30d":
      return { from: shiftDay(today, -29), to: today };
    case "90d":
      return { from: shiftDay(today, -89), to: today };
    case "custom":
    default:
      return { from: shiftDay(today, -6), to: today };
  }
};

/** Дефолт раздела — последние 7 дней (как на бэке). */
export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterValue = {
  preset: "7d",
  ...presetToRange("7d"),
};

/** Фильтры → query-параметры запроса. Пустые значения не отправляем. */
export const filtersToQuery = (f: AnalyticsFilterValue): AnalyticsQuery => ({
  from: f.from,
  to: f.to,
  ...(f.platform ? { platform: f.platform } : {}),
  ...(f.app_version ? { app_version: f.app_version } : {}),
  ...(f.role ? { role: f.role } : {}),
});

/** Диапазон шире 90 дней бэк отклонит — обрезаем и предупреждаем в UI. */
export const clampRange = (from: string, to: string): { from: string; to: string; clamped: boolean } => {
  if (rangeLengthDays(from, to) <= MAX_RANGE_DAYS) return { from, to, clamped: false };
  return { from: shiftDay(to, -(MAX_RANGE_DAYS - 1)), to, clamped: true };
};

/** Предыдущий период той же длины — для подписи «с чем сравниваем». */
export const previousPeriod = (from: string, to: string): { from: string; to: string } => {
  const len = rangeLengthDays(from, to) || 1;
  return { from: shiftDay(from, -len), to: shiftDay(to, -len) };
};

/** Сегодняшний день неполный: либо бэк сказал, либо `to` = сегодня. */
export const isPartialToday = (meta: AnalyticsMeta | undefined, to?: string): boolean => {
  if (meta?.partial_today != null) return meta.partial_today;
  return !!to && to === analyticsToday();
};

// ============================================================
// Форматирование значений витрин.
//
// Витрины наполняются постепенно, и бэк регулярно отдаёт объекты
// без части полей. Поэтому арифметику ведём через `num`, а проценты
// считаем через `pctOf`: пустая витрина должна показывать «0» и «—»,
// а не ронять экран.
// ============================================================

/** Безопасное число: undefined / null / NaN → 0. */
export const num = (value: number | null | undefined): number => (Number.isFinite(value) ? (value as number) : 0);

/** Доля в процентах; null, если знаменатель пуст — делить не на что. */
export const pctOf = (numerator: number | null | undefined, denominator: number | null | undefined): number | null => {
  const d = num(denominator);
  if (d <= 0) return null;
  return (num(numerator) / d) * 100;
};

export const formatPct = (value: number | null | undefined, digits = 1): string => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
};

export const formatSeconds = (sec: number | null | undefined): string => {
  if (sec == null || Number.isNaN(sec)) return "—";
  if (sec < 60) return `${Math.round(sec)} с`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  if (m < 60) return s ? `${m} м ${s} с` : `${m} м`;
  const h = Math.floor(m / 60);
  return `${h} ч ${m - h * 60} м`;
};

export const formatMs = (ms: number | null | undefined): string => {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} мс`;
  return formatSeconds(ms / 1000);
};

/** `trip_card_tap` → «Trip card tap» — читаемо, но узнаваемо. */
export const humanizeEventName = (name: string | null | undefined): string => {
  if (!name) return "—";
  const clean = name.replace(/^srv_/, "").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/** Серверные факты (`srv_*`) отличаем визуально — это не клик, а запись в базе. */
export const isServerEvent = (name: string | null | undefined): boolean => !!name && name.startsWith("srv_");

// ============================================================
// Словари раздела.
// ============================================================

export const FUNNELS: { code: AnalyticsFunnelCode; label: string; description: string }[] = [
  {
    code: "search_to_booking",
    label: "Поиск → бронь",
    description: "Форма поиска до созданной брони — основная продуктовая воронка.",
  },
  { code: "signup", label: "Регистрация", description: "Стена авторизации до созданного аккаунта." },
  { code: "trip_create", label: "Создание поездки", description: "Водитель от начала формы до созданной поездки." },
  { code: "parcel", label: "Посылки", description: "Вход в посылки до созданной посылки." },
  { code: "topup", label: "Пополнение кошелька", description: "Кошелёк до успешного платежа." },
  { code: "chat_to_booking", label: "Чат → бронь", description: "Переписка с водителем до брони." },
];

export const funnelLabel = (code: string): string => FUNNELS.find((f) => f.code === code)?.label ?? code;

export const NAV_TAB_LABELS: Record<string, string> = {
  publications: "Публикации",
  trips: "Поездки",
  chat: "Чат",
  profile: "Профиль",
};

export const navTabLabel = (tab: string): string => NAV_TAB_LABELS[tab] ?? humanizeEventName(tab);

export const SEARCH_INPUT_METHOD_LABELS: Record<string, string> = {
  typed: "Набрал руками",
  suggest: "Выбрал подсказку",
  recent: "Из истории",
  map: "Точка на карте",
  swap: "Поменял местами",
};

export const searchMethodLabel = (method: string): string =>
  SEARCH_INPUT_METHOD_LABELS[method] ?? humanizeEventName(method);

export const SEARCH_FIELD_LABELS: Record<string, string> = {
  from: "Откуда",
  to: "Куда",
};

export const searchFieldLabel = (field: string): string => SEARCH_FIELD_LABELS[field] ?? field;

export const ENTRY_POINT_LABELS: Record<string, string> = {
  book_trip: "Бронирование поездки",
  create_trip: "Создание поездки",
  profile_tab: "Вкладка профиля",
  chat: "Чат",
  parcel: "Посылки",
  wallet: "Кошелёк",
};

export const entryPointLabel = (entry: string): string => ENTRY_POINT_LABELS[entry] ?? humanizeEventName(entry);

export const CHAT_SOURCE_LABELS: Record<string, string> = {
  trip_detail: "Карточка поездки",
  booking: "Бронирование",
  push: "Пуш-уведомление",
};

export const chatSourceLabel = (src: string): string => CHAT_SOURCE_LABELS[src] ?? humanizeEventName(src);

export const PLATFORM_LABELS: Record<string, string> = {
  android: "Android",
  ios: "iOS",
};

export const platformLabel = (p: string): string => PLATFORM_LABELS[p] ?? p;

export const ROLE_LABELS: Record<string, string> = {
  passenger: "Пассажир",
  driver: "Водитель",
};

// ============================================================
// CSV-экспорт: бэк отдаёт `text/csv` синхронно.
// ============================================================

export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
