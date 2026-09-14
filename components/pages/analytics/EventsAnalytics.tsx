"use client";

import { useState } from "react";
import { Activity, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { ExportButton } from "@/components/shared/analytics/ExportButton";
import { DeltaBadge } from "@/components/shared/analytics/Metrics";
import { SeriesChart } from "@/components/shared/analytics/SeriesChart";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsEvents, useAnalyticsEventSeries } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { humanizeEventName, isServerEvent, MAX_HOURLY_DAYS, rangeLengthDays } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";
import type { AnalyticsGranularity } from "@/types";

// ============================================================
// События — таблица всех событий + график по одному.
//
// Сортировка и пагинация серверные: клиентская сортировка одной
// страницы из ~96 событий дала бы неверный топ за период.
// ============================================================

const PAGE_SIZE = 25;

type SortKey = "cnt" | "users" | "sessions" | "delta_pct" | "name";

export const AnalyticsEventsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("cnt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string>("");
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");

  const days = rangeLengthDays(filters.from, filters.to);
  const hourlyAllowed = days <= MAX_HOURLY_DAYS;
  const effectiveGranularity: AnalyticsGranularity = hourlyAllowed ? granularity : "day";

  const { data, isLoading } = useAnalyticsEvents({
    ...query,
    search: search || undefined,
    limit: PAGE_SIZE,
    page,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const seriesQ = useAnalyticsEventSeries(selected, { ...query, granularity: effectiveGranularity });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const SortHead = ({
    label,
    sortKey,
    align = "right",
  }: {
    label: string;
    sortKey: SortKey;
    align?: "left" | "right";
  }) => (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        onClick={() => toggleSort(sortKey)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 transition",
          sortBy === sortKey && "text-foreground font-semibold"
        )}
      >
        {label}
        {sortBy === sortKey &&
          (sortOrder === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
      </button>
    </TableHead>
  );

  return (
    <AnalyticsPageShell
      title="Аналитика · События"
      subtitle="Сырое исследование: какие события летят чаще всего и как меняется их объём"
      icon={Activity}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      actions={<ExportButton report="events" filters={filters} />}
    >
      <StatsSection title="Все события" description={`Найдено: ${formatNumber(total)}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              onBlur={applySearch}
              placeholder="Поиск по имени события"
              className="h-9 w-[240px] pl-8 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label="Событие" sortKey="name" align="left" />
                    <SortHead label="Событий" sortKey="cnt" />
                    <SortHead label="Пользователи" sortKey="users" />
                    <SortHead label="Сессии" sortKey="sessions" />
                    <SortHead label="Динамика" sortKey="delta_pct" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((e) => (
                    <TableRow
                      key={e.name}
                      onClick={() => setSelected(e.name)}
                      className={cn(
                        "cursor-pointer",
                        selected === e.name && "bg-emerald-500/5 hover:bg-emerald-500/10"
                      )}
                    >
                      <TableCell>
                        <span className="font-medium">{humanizeEventName(e.name)}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-[11px]">{e.name}</span>
                        {isServerEvent(e.name) && (
                          <span className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            сервер
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.cnt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.users)}</TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatNumber(e.sessions)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaBadge value={e.delta_pct} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                Страница {page} из {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </StatsSection>

      <StatsSection
        title={selected ? `График события «${humanizeEventName(selected)}»` : "График события"}
        description={
          hourlyAllowed
            ? "Диапазон ≤ 3 дней — доступна разбивка по часам"
            : `Разбивка по часам доступна только на диапазоне ≤ ${MAX_HOURLY_DAYS} дней`
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-9 w-[260px] text-xs">
              <SelectValue placeholder="Выберите событие" />
            </SelectTrigger>
            <SelectContent>
              {items.map((e) => (
                <SelectItem key={e.name} value={e.name}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={effectiveGranularity}
            onValueChange={(v) => setGranularity(v as AnalyticsGranularity)}
            disabled={!hourlyAllowed}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">По дням</SelectItem>
              <SelectItem value="hour">По часам</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!selected ? (
          <p className="text-muted-foreground text-sm">Выберите событие в таблице выше или в списке</p>
        ) : (
          <SeriesChart
            data={seriesQ.data?.data?.points}
            xKey="t"
            granularity={effectiveGranularity}
            loading={seriesQ.isLoading}
            series={[
              { key: "cnt", label: "События", color: "#10b981" },
              { key: "users", label: "Пользователи", color: "#0ea5e9" },
            ]}
          />
        )}
      </StatsSection>
    </AnalyticsPageShell>
  );
};
