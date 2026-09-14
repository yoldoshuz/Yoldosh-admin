"use client";

import { Activity, BarChart3, CalendarRange, Layers, MonitorSmartphone, Timer, UserPlus, Users } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { DeltaBadge } from "@/components/shared/analytics/Metrics";
import { SeriesChart } from "@/components/shared/analytics/SeriesChart";
import { StatCard } from "@/components/shared/StatCard";
import { DistributionList, StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsOverview } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatDay, formatSeconds, platformLabel, previousPeriod } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Обзор — DAU/WAU/MAU, сессии, новые, график, топ-экраны.
//
// `/overview` не отдаёт delta_pct, поэтому предыдущий период того же
// размера запрашиваем вторым запросом и считаем динамику на фронте:
// абсолютное число без динамики ничего не значит.
// ============================================================

const deltaPct = (current?: number, prev?: number): number | null => {
  if (current == null || prev == null) return null;
  if (prev === 0) return current === 0 ? 0 : null;
  return ((current - prev) / prev) * 100;
};

export const AnalyticsOverviewPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const { data, isLoading, isError, refetch } = useAnalyticsOverview(query);

  const prevRange = previousPeriod(filters.from, filters.to);
  const { data: prevData } = useAnalyticsOverview({ ...query, ...prevRange });

  const o = data?.data;
  const p = prevData?.data;

  const cards: { title: string; value: number | string | null; delta: number | null; icon: any; subtext?: string }[] = [
    { title: "DAU", value: o?.dau ?? null, delta: deltaPct(o?.dau, p?.dau), icon: Activity },
    { title: "WAU", value: o?.wau ?? null, delta: deltaPct(o?.wau, p?.wau), icon: Users },
    { title: "MAU", value: o?.mau ?? null, delta: deltaPct(o?.mau, p?.mau), icon: Users },
    { title: "Новые", value: o?.new_users ?? null, delta: deltaPct(o?.new_users, p?.new_users), icon: UserPlus },
    { title: "Сессии", value: o?.sessions ?? null, delta: deltaPct(o?.sessions, p?.sessions), icon: Layers },
    {
      title: "Ср. сессия",
      value: o ? formatSeconds(o.avg_session_sec) : null,
      delta: deltaPct(o?.avg_session_sec, p?.avg_session_sec),
      icon: Timer,
    },
    {
      title: "Событий",
      value: o?.events_total ?? null,
      delta: deltaPct(o?.events_total, p?.events_total),
      icon: BarChart3,
    },
  ];

  const platformDist = Object.entries(o?.by_platform ?? {}).map(([label, count]) => ({
    label: platformLabel(label),
    count: Number(count) || 0,
  }));

  return (
    <AnalyticsPageShell
      title="Аналитика · Обзор"
      subtitle="Активность, сессии и новые пользователи по данным продуктового трекинга"
      icon={BarChart3}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      isError={isError}
      onRetry={refetch}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="relative">
            <StatCard title={c.title} value={c.value} icon={c.icon} loading={isLoading} />
            <div className="absolute right-4 bottom-3">
              <DeltaBadge value={c.delta} />
            </div>
          </div>
        ))}
      </div>

      <StatsSection
        title="Динамика по дням"
        description={`Сравнение с предыдущим периодом: ${formatDay(prevRange.from)} – ${formatDay(prevRange.to)}`}
      >
        <SeriesChart
          data={o?.series}
          xKey="day"
          loading={isLoading}
          series={[
            { key: "dau", label: "DAU", color: "#10b981" },
            { key: "sessions", label: "Сессии", color: "#0ea5e9" },
            { key: "new_users", label: "Новые", color: "#8b5cf6" },
          ]}
        />
      </StatsSection>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatsSection title="Платформы" description="DAU в разрезе ОС">
          <DistributionList data={platformDist} loading={isLoading} />
          {!isLoading && !platformDist.length && (
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
              <MonitorSmartphone className="size-3.5" /> Нет данных
            </p>
          )}
        </StatsSection>

        <StatsSection
          title="Топ экранов"
          description="Куда пользователи смотрят и сколько там проводят"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-lg" />
              ))}
            </div>
          ) : !o?.top_screens?.length ? (
            <p className="text-muted-foreground text-sm">Нет данных за период</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Экран</TableHead>
                    <TableHead className="text-right">Просмотры</TableHead>
                    <TableHead className="text-right">Ср. время</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.top_screens.map((s, i) => (
                    <TableRow key={s.screen ?? i}>
                      <TableCell className="font-medium">{s.screen ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(s.views)}</TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatSeconds(s.avg_sec)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </StatsSection>
      </div>

      <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <CalendarRange className="size-3.5" />
        Данные за прошлые дни финализируются в 03:00 и больше не меняются; сегодняшний день пересчитывается раз в 15
        минут.
      </p>
    </AnalyticsPageShell>
  );
};
