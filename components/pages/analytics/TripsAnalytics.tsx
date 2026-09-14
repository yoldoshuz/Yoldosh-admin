"use client";

import { useState } from "react";
import Link from "next/link";
import { Route } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { Conversion } from "@/components/shared/analytics/Metrics";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsTopTrips } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { useBasePath } from "@/hooks/useBasePath";
import { formatDate, formatNumber } from "@/lib/utils";
import type { AnalyticsTopTripMetric } from "@/types";

// ============================================================
// Трипы — топ по просмотрам, бронированиям или CTR.
// Детальный блок по конкретной поездке живёт в её карточке.
// ============================================================

const METRICS: { key: AnalyticsTopTripMetric; label: string }[] = [
  { key: "views", label: "По просмотрам" },
  { key: "bookings", label: "По бронированиям" },
  { key: "ctr", label: "По CTR" },
];

export const AnalyticsTripsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [metric, setMetric] = useState<AnalyticsTopTripMetric>("views");
  const base = useBasePath();

  const { data, isLoading } = useAnalyticsTopTrips({ ...query, metric, limit: 50 });
  const trips = data?.data ?? [];

  return (
    <AnalyticsPageShell
      title="Аналитика · Трипы"
      subtitle="Какие поездки видят и какие из них действительно бронируют"
      icon={Route}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      actions={
        <Select value={metric} onValueChange={(v) => setMetric(v as AnalyticsTopTripMetric)}>
          <SelectTrigger className="h-9 w-[180px] text-xs">
            <SelectValue placeholder="Метрика" />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <StatsSection
        title="Топ поездок"
        description="Клик по строке открывает карточку поездки с полным блоком аналитики"
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : !trips.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Поездка</TableHead>
                  <TableHead className="text-right">Показы</TableHead>
                  <TableHead className="text-right">Тапы</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Детали</TableHead>
                  <TableHead className="text-right">Чаты</TableHead>
                  <TableHead className="text-right">Брони</TableHead>
                  <TableHead className="text-right">Просмотр → бронь</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.trip_id}>
                    <TableCell>
                      <Link
                        href={`/${base}/trips/${t.trip_id}`}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        {t.from_city && t.to_city ? `${t.from_city} → ${t.to_city}` : t.trip_id}
                      </Link>
                      <p className="text-muted-foreground text-[11px]">
                        {t.departure_ts ? formatDate(t.departure_ts) : ""}
                        {t.driver_name ? ` · ${t.driver_name}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(t.card_impressions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(t.card_taps)}</TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={t.ctr_pct}
                        numerator={t.card_taps}
                        denominator={t.card_impressions}
                        label="Тапы из показов"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {formatNumber(t.detail_views)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {formatNumber(t.chats_started)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(t.bookings)}</TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={t.view_to_book_pct}
                        numerator={t.bookings}
                        denominator={t.detail_views}
                        label="Брони из просмотров деталей"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StatsSection>
    </AnalyticsPageShell>
  );
};
