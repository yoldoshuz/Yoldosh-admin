import { DistItem, TopItem } from "@/components/shared/stats/StatsSections";

const num = (v: any): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Convert API rows of variable shape into a {label, count} list for DistributionList.
 * `keys` is the priority list of which property holds the label.
 * Empty/null labels are filtered out (or replaced with the fallback if provided).
 */
export const toDistribution = (
  rows: any[] | undefined,
  keys: string[],
  options?: { countKey?: string; fallback?: string; nullLabel?: string }
): DistItem[] => {
  const countKey = options?.countKey ?? "count";
  const fallback = options?.fallback;
  const nullLabel = options?.nullLabel ?? "Не указано";
  return (Array.isArray(rows) ? rows : [])
    .map((r) => {
      let label: any = undefined;
      for (const k of keys) {
        if (r?.[k] != null) {
          label = r[k];
          break;
        }
      }
      if (label == null) {
        if (Object.prototype.hasOwnProperty.call(r ?? {}, keys[0])) label = nullLabel;
        else label = fallback;
      }
      if (label == null) return null;
      return { label: String(label), count: num(r?.[countKey]) };
    })
    .filter((x): x is DistItem => x !== null);
};

/**
 * Convert hour-of-day rows into a 0..23 ordered DistItem list.
 */
export const toHourDistribution = (rows: any[] | undefined): DistItem[] => {
  const rowsArr = Array.isArray(rows) ? rows : [];
  return rowsArr
    .map((r) => ({ label: `${r?.hour ?? r?.h ?? 0}:00`, count: num(r?.count ?? r?.value), order: num(r?.hour) }))
    .sort((a, b) => a.order - b.order)
    .map(({ label, count }) => ({ label, count }));
};

/**
 * Build a top-list of users (driver/passenger/wallet holder).
 * Tries common firstName/lastName/phoneNumber columns and falls back gracefully.
 */
export const toUserTopList = (rows: any[] | undefined, countKey: string): TopItem[] => {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const fullName = `${r?.firstName ?? ""} ${r?.lastName ?? ""}`.trim();
      const label = fullName || r?.phoneNumber || r?.email || r?.id?.slice(0, 8) || "—";
      const sub = fullName ? r?.phoneNumber : undefined;
      return { label: String(label), sub: sub ? String(sub) : undefined, count: num(r?.[countKey]) };
    })
    .filter((x) => x.label !== "—");
};

/**
 * Build a top-list of routes (from_city → to_city + count).
 */
export const toRoutesList = (rows: any[] | undefined): TopItem[] =>
  (Array.isArray(rows) ? rows : []).map((r) => ({
    label: `${r?.from_city ?? r?.fromCity ?? "—"} → ${r?.to_city ?? r?.toCity ?? "—"}`,
    sub: r?.avg_price != null ? `≈ ${num(r.avg_price)} UZS` : undefined,
    count: num(r?.count),
  }));

/**
 * Build a top-list of cities.
 */
export const toCitiesList = (rows: any[] | undefined, key: "from_city" | "to_city" | "city" = "city"): TopItem[] =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({ label: String(r?.[key] ?? r?.city ?? r?.name ?? "—"), count: num(r?.count) }))
    .filter((x) => x.label && x.label !== "—");
