"use client";

import { DoorOpen, Info, UserPlus } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { Conversion, LowSampleNotice } from "@/components/shared/analytics/Metrics";
import { StatCard } from "@/components/shared/StatCard";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsSignupSources } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { entryPointLabel, formatPct, num } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Регистрации — через какую кнопку люди заводят аккаунт.
//
// Главный показатель — не доля регистраций, а conv_from_wall_pct:
// высокая доля при низкой конверсии означает, что точка просто
// самая посещаемая, а не лучшая.
// ============================================================

export const AnalyticsSignupSourcesPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const { data, isLoading, isError, refetch } = useAnalyticsSignupSources(query);

  const items = data?.data?.items ?? [];
  const total = data?.data?.total_signups ?? 0;
  const best = items.length
    ? [...items].sort((a, b) => num(b.conv_from_wall_pct) - num(a.conv_from_wall_pct))[0]
    : null;
  const biggest = items.length ? [...items].sort((a, b) => num(b.signups) - num(a.signups))[0] : null;
  const maxSignups = Math.max(...items.map((i) => num(i.signups)), 1);

  return (
    <AnalyticsPageShell
      title="Аналитика · Регистрации"
      subtitle="Источники регистраций и конверсия стены авторизации"
      icon={UserPlus}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      isError={isError}
      onRetry={refetch}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Всего регистраций" value={total} icon={UserPlus} loading={isLoading} />
        <StatCard
          title="Больше всего регистраций"
          value={biggest ? entryPointLabel(biggest.entry_point) : null}
          subtext={biggest ? `${formatNumber(biggest.signups)} · ${formatPct(biggest.share_pct)} от всех` : undefined}
          icon={DoorOpen}
          tone="sky"
          loading={isLoading}
        />
        <StatCard
          title="Лучшая конверсия стены"
          value={best ? entryPointLabel(best.entry_point) : null}
          subtext={best ? `${formatPct(best.conv_from_wall_pct)} из увидевших стену` : undefined}
          icon={DoorOpen}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      <LowSampleNotice users={total} />

      <StatsSection title="Точки входа" description="entry_point — экран, с которого пользователь упёрся в регистрацию">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Точка входа</TableHead>
                  <TableHead className="text-right">Регистрации</TableHead>
                  <TableHead className="w-[200px]">Доля</TableHead>
                  <TableHead className="text-right">Конверсия стены</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.entry_point}>
                    <TableCell className="font-medium">
                      {entryPointLabel(it.entry_point)}
                      <span className="text-muted-foreground ml-2 font-mono text-[11px]">{it.entry_point}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(it.signups)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{ width: `${Math.max(2, (num(it.signups) / maxSignups) * 100)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">
                          {formatPct(it.share_pct)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={it.conv_from_wall_pct}
                        numerator={it.signups}
                        denominator={
                          num(it.conv_from_wall_pct) > 0
                            ? Math.round((num(it.signups) / num(it.conv_from_wall_pct)) * 100)
                            : null
                        }
                        label="Зарегались из увидевших стену"
                        className="font-medium"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StatsSection>

      <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Знаменатель конверсии стены восстановлен из процента, который прислал бэк, — это оценка, а не точное число
        показов.
      </p>
    </AnalyticsPageShell>
  );
};
