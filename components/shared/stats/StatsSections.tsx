"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompactNumber, formatNumber } from "@/lib/utils";

// ===== Section wrapper =====
export const StatsSection = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={cn("stats-card", className)}>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// ===== Distribution bar list =====
export type DistItem = { label: string; count: number };

export const DistributionList = ({
  data,
  loading,
  formatter,
}: {
  data: DistItem[] | undefined;
  loading?: boolean;
  formatter?: (v: number) => string;
}) => {
  if (loading)
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    );
  const items = (data ?? []).filter((x) => x && x.label != null);
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Нет данных</p>;
  const max = Math.max(...items.map((x) => x.count), 1);
  const fmt = formatter ?? formatCompactNumber;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={`${it.label}-${i}`} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate capitalize">{String(it.label).replace(/_/g, " ").toLowerCase()}</span>
            <span className="tabular-nums text-muted-foreground">{fmt(it.count)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${Math.max(2, (it.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

// ===== Top list =====
export type TopItem = {
  label: string;
  sub?: string;
  count: number;
};

export const TopList = ({
  data,
  loading,
  format = "number",
  emptyText,
  limit = 15,
}: {
  data: TopItem[] | undefined;
  loading?: boolean;
  format?: "number" | "money";
  emptyText?: string;
  limit?: number;
}) => {
  if (loading)
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" />
        ))}
      </div>
    );
  const items = (data ?? []).filter((x) => x && x.label);
  if (!items.length) return <p className="text-sm text-muted-foreground">{emptyText ?? "Нет данных"}</p>;

  const fmt = (v: number) => (format === "money" ? `${formatNumber(v)} UZS` : formatCompactNumber(v));

  return (
    <ol className="space-y-1.5">
      {items.slice(0, limit).map((it, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{it.label}</p>
            {it.sub && <p className="truncate text-xs text-muted-foreground">{it.sub}</p>}
          </div>
          <span className="tabular-nums text-muted-foreground">{fmt(Number(it.count))}</span>
        </li>
      ))}
    </ol>
  );
};
