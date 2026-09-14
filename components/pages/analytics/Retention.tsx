"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAnalyticsRetention } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatDay, LOW_SAMPLE_THRESHOLD, num } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";

// ============================================================
// Ретеншн — когорты по дню регистрации.
//
// Ячейка тем насыщеннее, чем выше удержание. Маленькие когорты
// (< 100) приглушаем: на них проценты скачут и вводят в заблуждение.
// ============================================================

const DEPTHS = [7, 14, 30];

const cellTone = (pct: number): string => {
  if (pct >= 60) return "bg-emerald-500 text-white";
  if (pct >= 40) return "bg-emerald-500/70 text-white";
  if (pct >= 25) return "bg-emerald-500/45 text-emerald-950 dark:text-emerald-50";
  if (pct >= 12) return "bg-emerald-500/25 text-emerald-950 dark:text-emerald-50";
  if (pct > 0) return "bg-emerald-500/10";
  return "bg-muted/50 text-muted-foreground";
};

export const AnalyticsRetentionPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [depth, setDepth] = useState(7);

  const { data, isLoading, isError, refetch } = useAnalyticsRetention({ ...query, depth });
  const rows = data?.data ?? [];
  const columns = Math.max(...rows.map((r) => r.retention?.length ?? 0), depth + 1);

  return (
    <AnalyticsPageShell
      title="Аналитика · Ретеншн"
      subtitle="Сколько из пришедших в день N возвращаются потом"
      icon={CalendarDays}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      isError={isError}
      onRetry={refetch}
      actions={
        <Select value={String(depth)} onValueChange={(v) => setDepth(Number(v))}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPTHS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                Глубина {d} дн
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <StatsSection title="Когорты" description="Строка — день регистрации, колонка — день после неё">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        ) : !rows.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-2 py-1.5 text-left font-medium">Когорта</th>
                  <th className="px-2 py-1.5 text-right font-medium">Размер</th>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="px-1 py-1.5 text-center font-medium">
                      D{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, rowIndex) => {
                  const size = num(r.size);
                  const small = size < LOW_SAMPLE_THRESHOLD;
                  return (
                    <tr key={r.cohort ?? rowIndex}>
                      <td className="px-2 py-1 font-medium whitespace-nowrap">{formatDay(r.cohort)}</td>
                      <td
                        className={cn("px-2 py-1 text-right tabular-nums", small && "text-muted-foreground")}
                        title={small ? `Меньше ${LOW_SAMPLE_THRESHOLD} польз. — выводы ненадёжны` : undefined}
                      >
                        {formatNumber(size)}
                        {small && " *"}
                      </td>
                      {Array.from({ length: columns }).map((_, i) => {
                        const pct = r.retention?.[i];
                        if (pct == null) return <td key={i} className="px-1 py-1" />;
                        return (
                          <td key={i} className="px-0.5 py-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "rounded px-1 py-1 text-center tabular-nums",
                                      cellTone(pct),
                                      small && "opacity-60"
                                    )}
                                  >
                                    {num(pct).toFixed(0)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    День {i}: {formatNumber(Math.round((size * num(pct)) / 100))} из{" "}
                                    {formatNumber(size)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-muted-foreground mt-3 text-xs">
          * когорта меньше {LOW_SAMPLE_THRESHOLD} пользователей — проценты статистически незначимы.
        </p>
      </StatsSection>
    </AnalyticsPageShell>
  );
};
