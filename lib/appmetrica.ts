// Yandex AppMetrica API client.
// Docs: https://appmetrica.yandex.ru/docs/ru/mobile-api/
//
// All requests are proxied through /api/appmetrica/* (Next.js route handler).
// Yandex's API does NOT send CORS headers, so the browser cannot call it directly.
// The OAuth token lives server-side and is attached by the proxy.

// Browser-only flag — used by the page to render a setup hint when the token is missing.
// We mirror the server token into NEXT_PUBLIC_OAUTH_TOKEN purely for this UX check.
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_OAUTH_TOKEN ?? "";

const PROXY_PREFIX = "/api/appmetrica";

const buildUrl = (path: string, params?: Record<string, string | number | string[] | undefined>) => {
  // Strip leading slash from upstream path; we mount it under /api/appmetrica/
  const clean = path.replace(/^\/+/, "");
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === "") continue;
      qs.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  }
  const query = qs.toString();
  return `${PROXY_PREFIX}/${clean}${query ? `?${query}` : ""}`;
};

const headers = (): HeadersInit => ({
  Accept: "application/json",
  "Content-Type": "application/json",
});

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let message = `AppMetrica API ${res.status}`;
    try {
      const data = await res.json();
      const err =
        (data as any)?.errors?.[0]?.message ??
        (data as any)?.message ??
        (data as any)?.error_text ??
        (data as any)?.error;
      if (err) message = err;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
};

// ---------- Types ----------
export type AppMetricaApplication = {
  id: number;
  name: string;
  status: string; // "Active" | "Deleted" | ...
  category?: string | null;
  time_zone_name?: string;
  time_zone_offset?: number;
  hide_address?: boolean;
  use_universal_links?: boolean;
  permission?: string; // edit | view | agency_view | agency_edit
  type?: string;
  app_id_on_platform?: { platform: string; id: string }[];
  metrica_counter?: { id: number };
  label_ids?: number[];
  create_date?: string;
  owner_login?: string;
};

export type StatResponse = {
  query?: any;
  data?: Array<{
    dimensions: Array<{ name?: string | null; id?: string | null } | null>;
    metrics: number[];
  }>;
  totals?: number[];
  total_rows?: number;
  total_rows_rounded?: boolean;
  sampled?: boolean;
  sampleable?: boolean;
  contains_sensitive_data?: boolean;
  sample_share?: number;
  sample_size?: number;
  sample_space?: number;
  data_lag?: number;
  max_sample_share?: number;
  min_sample_size?: number;
};

export type ByTimeResponse = StatResponse & {
  time_intervals?: [string, string][];
  data?: Array<{
    dimensions: Array<{ name?: string | null; id?: string | null } | null>;
    metrics: number[][];
  }>;
};

// ---------- Endpoints ----------
export const appmetricaApi = {
  // Management
  async listApplications(): Promise<{ applications: AppMetricaApplication[] }> {
    const res = await fetch(buildUrl("/management/v1/applications"), { headers: headers() });
    return handle(res);
  },

  async getApplication(id: number): Promise<{ application: AppMetricaApplication }> {
    const res = await fetch(buildUrl(`/management/v1/application/${id}`), { headers: headers() });
    return handle(res);
  },

  // Stat — flat report (totals + rows)
  async getStat(params: {
    ids: number;
    metrics: string[];
    dimensions?: string[];
    date1: string; // YYYY-MM-DD
    date2: string; // YYYY-MM-DD
    sort?: string;
    limit?: number;
    offset?: number;
    accuracy?: string; // "1" | "0.1" | "low" | "medium" | "high" | "full"
    filters?: string;
    group?: "day" | "hour" | "week" | "month";
    proposedAccuracy?: boolean;
    includeUndefined?: boolean;
  }): Promise<StatResponse> {
    const url = buildUrl("/stat/v1/data", {
      id: params.ids,
      metrics: params.metrics,
      dimensions: params.dimensions,
      date1: params.date1,
      date2: params.date2,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
      accuracy: params.accuracy ?? "full",
      filters: params.filters,
      group: params.group,
      proposed_accuracy: params.proposedAccuracy ? "true" : undefined,
      include_undefined: params.includeUndefined ? "true" : undefined,
    });
    const res = await fetch(url, { headers: headers() });
    return handle(res);
  },

  // Stat — time series
  async getStatByTime(params: {
    ids: number;
    metrics: string[];
    dimensions?: string[];
    date1: string;
    date2: string;
    group?: "day" | "hour" | "week" | "month";
    accuracy?: string;
    filters?: string;
    limit?: number;
    sort?: string;
  }): Promise<ByTimeResponse> {
    const url = buildUrl("/stat/v1/data/bytime", {
      id: params.ids,
      metrics: params.metrics,
      dimensions: params.dimensions,
      date1: params.date1,
      date2: params.date2,
      group: params.group ?? "day",
      accuracy: params.accuracy ?? "full",
      filters: params.filters,
      limit: params.limit,
      sort: params.sort,
    });
    const res = await fetch(url, { headers: headers() });
    return handle(res);
  },
};

// True when the public hint says the token exists. The actual auth happens server-side,
// so even without NEXT_PUBLIC_OAUTH_TOKEN the proxy will work as long as a server var
// (APPMETRICA_OAUTH_TOKEN / NEXT_PULIC_OAUTH_TOKEN) is set.
export const isAppmetricaConfigured = () => Boolean(PUBLIC_TOKEN);

// ---------- Date helpers ----------
export const toAmDate = (d: Date | string): string => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
