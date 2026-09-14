import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { stripEmpty } from "@/hooks/_factory";
import { ANALYTICS_STALE_TIME, downloadCsv, MAX_EXPORT_DAYS, rangeLengthDays } from "@/lib/analytics";
import api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  AnalyticsChatsStats,
  AnalyticsConfig,
  AnalyticsConfigPatch,
  AnalyticsErrorRow,
  AnalyticsEventsResponse,
  AnalyticsEventTimeseries,
  AnalyticsExportReport,
  AnalyticsFormDetails,
  AnalyticsFormListItem,
  AnalyticsFunnel,
  AnalyticsMeta,
  AnalyticsNav,
  AnalyticsOverview,
  AnalyticsQuery,
  AnalyticsRegistry,
  AnalyticsResult,
  AnalyticsRetentionRow,
  AnalyticsSearchDemandRow,
  AnalyticsSearchFilterRow,
  AnalyticsSearchInput,
  AnalyticsSearchQuery,
  AnalyticsSignupSources,
  AnalyticsTimeline,
  AnalyticsTopTrip,
  AnalyticsTopTripMetric,
  AnalyticsTripStats,
  AnalyticsUnknownEvent,
} from "@/types";

// ============================================================
// Yoldosh Analytics — продуктовая аналитика.
//
// Базовый префикс: {api}/admin/analytics (api уже содержит /api/v1).
// Авторизация — обычный админский JWT, тот же, что и в остальных
// разделах; дополнительных ключей раздел не требует.
//
// Два исключения по правам:
//   • /user/:userId/timeline — требует право `users`, каждый просмотр
//     пишется в журнал админ-действий;
//   • PUT /super-admin/analytics/config — только супер-админ.
//
// Все ответы читаются из предрассчитанных витрин: данные за сегодня
// обновляются раз в ~15 минут, поэтому кэшируем на 5 минут и
// возвращаем `meta` вместе с данными — UI обязан показывать
// `calculated_at` и пометку неполного дня.
// ============================================================

const BASE = "/admin/analytics";

/** Разворачивает { data, meta } в пару, которую ждут все экраны раздела. */
const fetchAnalytics = async <T>(url: string, params: Record<string, any> = {}): Promise<AnalyticsResult<T>> => {
  const { data } = await api.get(url, { params: stripEmpty(params) });
  return { data: data.data as T, meta: (data.meta ?? {}) as AnalyticsMeta };
};

/**
 * То же, но для эндпоинтов, отдающих список.
 *
 * Часть витрин отдаёт голый массив (`/search/inputs`, `/retention`),
 * часть — обёртку `{ items: [...] }`. Нормализуем в одном месте,
 * чтобы экран не белел из-за формы ответа.
 */
const fetchAnalyticsList = async <T>(url: string, params: Record<string, any> = {}): Promise<AnalyticsResult<T[]>> => {
  const { data, meta } = await fetchAnalytics<T[] | { items?: T[] }>(url, params);
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return { data: list, meta };
};

/** Запрос имеет смысл только с обеими границами диапазона. */
const hasRange = (q: Partial<AnalyticsQuery>) => !!q.from && !!q.to;

// =============================================================
// 2.1 Обзор
// =============================================================
export const useAnalyticsOverview = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.overview(q),
    queryFn: () => fetchAnalytics<AnalyticsOverview>(`${BASE}/overview`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.2 События
// =============================================================
type EventsQuery = AnalyticsQuery & {
  name?: string;
  search?: string;
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export const useAnalyticsEvents = (q: EventsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.events(q),
    queryFn: () => fetchAnalytics<AnalyticsEventsResponse>(`${BASE}/events`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const useAnalyticsEventSeries = (name: string, q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.eventSeries(name, q),
    queryFn: () => fetchAnalytics<AnalyticsEventTimeseries>(`${BASE}/events/timeseries`, { ...q, name }),
    enabled: !!name && hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.3 Воронки
// =============================================================
export const useAnalyticsFunnel = (funnel: string, q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.funnel(funnel, q),
    queryFn: () => fetchAnalytics<AnalyticsFunnel>(`${BASE}/funnel`, { ...q, funnel }),
    enabled: !!funnel && hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.4 Источники регистраций
// =============================================================
export const useAnalyticsSignupSources = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.signupSources(q),
    queryFn: () => fetchAnalytics<AnalyticsSignupSources>(`${BASE}/signup-sources`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// 2.4.1 Нижнее меню (таб-бар)
export const useAnalyticsNav = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.nav(q),
    queryFn: () => fetchAnalytics<AnalyticsNav>(`${BASE}/nav`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// 2.4.2 Ввод «откуда / куда»
export const useAnalyticsSearchInputs = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.searchInputs(q),
    queryFn: () => fetchAnalyticsList<AnalyticsSearchInput>(`${BASE}/search/inputs`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const useAnalyticsSearchQueries = (q: AnalyticsQuery & { limit?: number; unmatched?: boolean }) =>
  useQuery({
    queryKey: queryKeys.analytics.searchQueries(q),
    queryFn: () =>
      fetchAnalyticsList<AnalyticsSearchQuery>(`${BASE}/search/queries`, {
        ...q,
        // stripEmpty срезает undefined, поэтому флаг либо есть строкой, либо
        // не уходит в запрос вовсе.
        unmatched: q.unmatched ? "true" : undefined,
      }),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.5 Формы
// =============================================================
export const useAnalyticsForms = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.forms(q),
    queryFn: () => fetchAnalyticsList<AnalyticsFormListItem>(`${BASE}/forms`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const useAnalyticsFormDetails = (form: string, q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.formDetails(form, q),
    queryFn: () => fetchAnalytics<AnalyticsFormDetails>(`${BASE}/forms/${form}`, q),
    enabled: !!form && hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.6 Поиск
// =============================================================
export const useAnalyticsSearchDemand = (q: AnalyticsQuery & { limit?: number }) =>
  useQuery({
    queryKey: queryKeys.analytics.searchDemand(q),
    queryFn: () => fetchAnalyticsList<AnalyticsSearchDemandRow>(`${BASE}/search/demand`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const useAnalyticsSearchFilters = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.searchFilters(q),
    queryFn: () => fetchAnalyticsList<AnalyticsSearchFilterRow>(`${BASE}/search/filters`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.7 Трипы
// =============================================================
/** Встраивается в существующую карточку трипа в админке. */
export const useAnalyticsTripStats = (tripId: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.analytics.tripStats(tripId),
    queryFn: () => fetchAnalytics<AnalyticsTripStats>(`${BASE}/trips/${tripId}/stats`),
    enabled: !!tripId && enabled,
    staleTime: ANALYTICS_STALE_TIME,
    retry: false,
  });

export const useAnalyticsTopTrips = (q: AnalyticsQuery & { metric?: AnalyticsTopTripMetric; limit?: number }) =>
  useQuery({
    queryKey: queryKeys.analytics.topTrips(q),
    queryFn: () => fetchAnalyticsList<AnalyticsTopTrip>(`${BASE}/trips/top`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.8 Чаты
// =============================================================
export const useAnalyticsChats = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: queryKeys.analytics.chats(q),
    queryFn: () => fetchAnalytics<AnalyticsChatsStats>(`${BASE}/chats/stats`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.9 Таймлайн пользователя
//
// Требует право `users`. Курсорная пагинация, по 200 событий.
// Каждый просмотр логируется на бэке в admin_logs.
// =============================================================
export const useAnalyticsUserTimeline = (userId: string, q: { from?: string; to?: string; limit?: number } = {}) =>
  useInfiniteQuery({
    queryKey: queryKeys.analytics.userTimeline(userId, q),
    queryFn: ({ pageParam }) =>
      fetchAnalytics<AnalyticsTimeline>(`${BASE}/user/${userId}/timeline`, {
        ...q,
        limit: q.limit ?? 200,
        cursor: pageParam || undefined,
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.data?.next_cursor || undefined,
    enabled: !!userId,
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.10 Ретеншн и когорты
// =============================================================
export const useAnalyticsRetention = (q: AnalyticsQuery & { depth?: number }) =>
  useQuery({
    queryKey: queryKeys.analytics.retention(q),
    queryFn: () => fetchAnalyticsList<AnalyticsRetentionRow>(`${BASE}/retention`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.11 Ошибки клиента
// =============================================================
export const useAnalyticsErrors = (q: AnalyticsQuery & { limit?: number }) =>
  useQuery({
    queryKey: queryKeys.analytics.errors(q),
    queryFn: () => fetchAnalyticsList<AnalyticsErrorRow>(`${BASE}/errors`, q),
    enabled: hasRange(q),
    staleTime: ANALYTICS_STALE_TIME,
  });

// =============================================================
// 2.12 Экспорт — синхронный CSV, диапазон ограничен 31 днём.
// =============================================================
export const useAnalyticsExport = () =>
  useMutation({
    mutationFn: async ({
      report,
      ...q
    }: AnalyticsQuery & { report: AnalyticsExportReport; funnel?: string; form?: string }) => {
      if (rangeLengthDays(q.from, q.to) > MAX_EXPORT_DAYS) {
        throw new Error(`Экспорт доступен максимум за ${MAX_EXPORT_DAYS} дней`);
      }
      const { data } = await api.get(`${BASE}/export`, {
        params: stripEmpty({ report, ...q }),
        responseType: "text",
      });
      downloadCsv(typeof data === "string" ? data : String(data), `yoldosh-${report}-${q.from}_${q.to}.csv`);
    },
    onSuccess: () => toast.success("CSV выгружен"),
    onError: (e: any) => {
      // Ошибки сети уже показаны перехватчиком api — здесь только наши проверки.
      if (!e?.response) toast.error(e?.message ?? "Не удалось выгрузить CSV");
    },
  });

// =============================================================
// 2.13 Управление трекингом
// =============================================================
export const useAnalyticsConfig = () =>
  useQuery({
    queryKey: queryKeys.analytics.config(),
    queryFn: () => fetchAnalytics<AnalyticsConfig>(`${BASE}/config`),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const useAnalyticsRegistry = () =>
  useQuery({
    queryKey: queryKeys.analytics.registry(),
    queryFn: () => fetchAnalytics<AnalyticsRegistry>(`${BASE}/registry`),
    staleTime: ANALYTICS_STALE_TIME,
  });

/** Имена событий, пришедшие мимо реестра — индикатор рассинхрона релиза. */
export const useAnalyticsUnknownEvents = () =>
  useQuery({
    queryKey: queryKeys.analytics.unknownEvents(),
    queryFn: () => fetchAnalyticsList<AnalyticsUnknownEvent>(`${BASE}/registry/unknown`),
    staleTime: ANALYTICS_STALE_TIME,
  });

/** Только супер-админ. Каждая правка инкрементит `version` на бэке. */
export const useUpdateAnalyticsConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: AnalyticsConfigPatch) => {
      const { data } = await api.put("/super-admin/analytics/config", patch);
      return data.data as AnalyticsConfig;
    },
    onSuccess: (cfg) => {
      toast.success(`Конфиг трекинга сохранён (версия ${cfg?.version ?? "—"})`);
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.config() });
    },
  });
};
