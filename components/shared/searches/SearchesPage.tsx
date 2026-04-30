"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, MapPin, Search as SearchIcon, TriangleAlert, UserRound, X } from "lucide-react";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";

import { DateRangePicker, DateRangeValue, rangeToQuery } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList, toHourDistribution, toRoutesList } from "@/components/shared/stats/normalize";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSearchesStats } from "@/hooks/adminHooks";
import { useGetSuperAdminSearches } from "@/hooks/superAdminHooks";
import { cn, formatCompactNumber, formatRelativeTime } from "@/lib/utils";
import { SearchRow } from "@/types";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const toWeekdayDistribution = (rows: any[] | undefined) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      label: DAY_LABELS[Number(r?.dayOfWeek ?? 0)] ?? "—",
      count: Number(r?.count ?? 0),
      order: Number(r?.dayOfWeek ?? 0),
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ label, count }) => ({ label, count }));

export const SearchesPage = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounceValue(searchTerm, 400);
  const [sort, setSort] = useState<{ sortBy: "count" | "last_searched_at"; sortOrder: "ASC" | "DESC" }>({
    sortBy: "count",
    sortOrder: "DESC",
  });

  const rangeParams = rangeToQuery(range);

  // === Stats block ===
  const { data: stats, isLoading: statsLoading } = useGetSearchesStats(rangeParams);

  // === List ===
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
      ...rangeParams,
    }),
    [debouncedSearch, sort.sortBy, sort.sortOrder, rangeParams]
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetSuperAdminSearches(filters);

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const rows: SearchRow[] = data?.pages.flatMap((p: any) => p.rows) ?? [];
  const total: number | undefined = data?.pages?.[0]?.total;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-text flex items-center gap-2">
            <SearchIcon className="size-6 text-emerald-500" />
            Маршруты поиска
          </h2>
          <p className="subtitle-text">Что ищут пользователи и гости — спрос на маршруты</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          title="Поисков"
          value={stats?.counts?.totalSearches}
          icon={SearchIcon}
          tone="emerald"
          loading={statsLoading}
        />
        <StatCard
          title="Уникальных юзеров"
          value={stats?.counts?.uniqueUsers}
          icon={UserRound}
          tone="sky"
          loading={statsLoading}
        />
        <StatCard
          title="Уникальных гостей"
          value={stats?.counts?.uniqueGuests}
          icon={UserRound}
          tone="violet"
          loading={statsLoading}
        />
      </div>

      <OverviewChart
        title="Динамика поисков"
        total={stats?.counts?.totalSearches}
        loading={statsLoading}
        series={[{ name: "Поиски", data: stats?.timeSeries?.total ?? [], color: "var(--chart-1)" }]}
      />

      {/* Unmatched routes — спрос без предложения */}
      {stats?.unmatched?.routes?.length > 0 && (
        <StatsSection
          title="Спрос без предложения"
          description="Маршруты, которые ищут, но активных трипов нет (за последние 30 дней)"
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <TriangleAlert className="size-4" />
              Возможность для роста: {stats.unmatched.routes.length} маршрутов
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {stats.unmatched.routes.map((r: any, i: number) => (
                <li
                  key={`${r.from_city}-${r.to_city}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/60 px-3 py-1.5 text-sm dark:bg-black/20"
                >
                  <span className="font-medium">
                    {r.from_city} → {r.to_city}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCompactNumber(Number(r.searches_count))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </StatsSection>
      )}

      {/* Top lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ маршрутов поиска">
          <TopList data={toRoutesList(stats?.top?.routes)} loading={statsLoading} limit={15} />
        </StatsSection>
        <div className="grid gap-4">
          <StatsSection title="Топ городов отправления">
            <TopList data={toCitiesList(stats?.top?.fromCities, "from_city")} loading={statsLoading} limit={10} />
          </StatsSection>
          <StatsSection title="Топ городов назначения">
            <TopList data={toCitiesList(stats?.top?.toCities, "to_city")} loading={statsLoading} limit={10} />
          </StatsSection>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Распределение по часам">
          <DistributionList data={toHourDistribution(stats?.distribution?.byHour)} loading={statsLoading} />
        </StatsSection>
        <StatsSection title="Распределение по дням недели">
          <DistributionList data={toWeekdayDistribution(stats?.distribution?.byDayOfWeek)} loading={statsLoading} />
        </StatsSection>
      </div>

      {/* List header */}
      <div className="mt-2 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Все маршруты поиска</h3>
          <p className="text-muted-foreground text-sm">
            {total != null ? <span className="font-medium">{total}</span> : "—"} строк
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Поиск по городу…"
              className="pl-8 sm:w-[260px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={sort.sortBy} onValueChange={(v) => setSort((s) => ({ ...s, sortBy: v as any }))}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">По количеству</SelectItem>
              <SelectItem value="last_searched_at">По последнему поиску</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSort((s) => ({ ...s, sortOrder: s.sortOrder === "ASC" ? "DESC" : "ASC" }))}
          >
            <ArrowUpDown className={cn("size-4 transition", sort.sortOrder === "DESC" ? "rotate-180" : "")} />
          </Button>
        </div>
      </div>

      {/* Routes table — desktop */}
      <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Маршрут</th>
              <th className="px-4 py-3 text-right">Поисков</th>
              <th className="px-4 py-3 text-right">Юзеров</th>
              <th className="px-4 py-3 text-right">Гостей</th>
              <th className="px-4 py-3 text-right">Активные трипы</th>
              <th className="px-4 py-3 text-left">Последний поиск</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td colSpan={6} className="p-3">
                    <Skeleton className="h-9 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground p-8 text-center">
                  Маршрутов не найдено
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.from_city}-${r.to_city}-${i}`} className="hover:bg-muted/30 border-t transition">
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="text-muted-foreground size-3.5" />
                      {r.from_city} → {r.to_city}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCompactNumber(Number(r.count))}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                    {formatCompactNumber(Number(r.unique_users))}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                    {formatCompactNumber(Number(r.unique_guests))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(r.active_trips) > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        {r.active_trips}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        нет
                      </Badge>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {formatRelativeTime(r.last_searched_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : rows.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-2xl border p-6 text-center text-sm">
            Маршрутов не найдено
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={`${r.from_city}-${r.to_city}-${i}`} className="bg-card rounded-2xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">
                  {r.from_city} → {r.to_city}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border-0",
                    Number(r.active_trips) > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  )}
                >
                  {Number(r.active_trips) > 0 ? `${r.active_trips} трипов` : "нет трипов"}
                </Badge>
              </div>
              <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs">
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Поисков</span>
                  <span className="text-foreground tabular-nums">{formatCompactNumber(Number(r.count))}</span>
                </span>
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Юзеров</span>
                  <span className="text-foreground tabular-nums">{formatCompactNumber(Number(r.unique_users))}</span>
                </span>
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Гостей</span>
                  <span className="text-foreground tabular-nums">{formatCompactNumber(Number(r.unique_guests))}</span>
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-[11px]">
                Последний поиск: {formatRelativeTime(r.last_searched_at)}
              </p>
            </div>
          ))
        )}
      </div>

      {hasNextPage && (
        <div ref={ref} className="flex h-12 items-center justify-center">
          {isFetchingNextPage && <Skeleton className="h-8 w-32" />}
        </div>
      )}
    </div>
  );
};
