"use client";

import { CircleAlert, Info } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { StatCard } from "@/components/shared/StatCard";
import { DistributionList, StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsErrors } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { cn, formatNumber } from "@/lib/utils";

// ============================================================
// Ошибки клиента — api_error по версиям приложения.
//
// Часто половина потерь в воронке — это не UX, а падающий эндпоинт
// на конкретной версии. Поэтому разбивка по app_version здесь ключевая.
// ============================================================

const statusTone = (status: number): string => {
  if (status >= 500) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (status >= 400) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
};

export const AnalyticsErrorsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const { data, isLoading } = useAnalyticsErrors({ ...query, limit: 50 });

  const items = data?.data ?? [];
  const totalErrors = items.reduce((acc, i) => acc + i.cnt, 0);
  const affectedUsers = items.reduce((acc, i) => Math.max(acc, i.users), 0);
  const server5xx = items.filter((i) => i.status >= 500).reduce((acc, i) => acc + i.cnt, 0);

  const byVersion = Object.entries(
    items.reduce<Record<string, number>>((acc, i) => {
      const v = i.app_version ?? "—";
      acc[v] = (acc[v] ?? 0) + i.cnt;
      return acc;
    }, {})
  ).map(([label, count]) => ({ label, count }));

  return (
    <AnalyticsPageShell
      title="Аналитика · Ошибки"
      subtitle="Падающие эндпоинты в разрезе версий приложения"
      icon={CircleAlert}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      withRole={false}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Всего ошибок" value={totalErrors} icon={CircleAlert} tone="red" loading={isLoading} />
        <StatCard title="Из них 5xx" value={server5xx} icon={CircleAlert} tone="red" loading={isLoading} />
        <StatCard
          title="Затронуто пользователей"
          value={affectedUsers}
          subtext="максимум по одному эндпоинту"
          tone="amber"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatsSection title="По версиям" description="Всплеск на одной версии = баг релиза, а не поведение людей">
          <DistributionList data={byVersion} loading={isLoading} />
        </StatsSection>

        <StatsSection title="Эндпоинты" className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : !items.length ? (
            <p className="text-muted-foreground text-sm">Ошибок за период нет</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Эндпоинт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Версия</TableHead>
                    <TableHead className="text-right">Ошибок</TableHead>
                    <TableHead className="text-right">Пользователи</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((e, i) => (
                    <TableRow key={`${e.endpoint}-${e.status}-${e.app_version ?? ""}-${i}`}>
                      <TableCell className="font-mono text-xs font-medium">{e.endpoint}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            statusTone(e.status)
                          )}
                        >
                          {e.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {e.error_code ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{e.app_version ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(e.cnt)}</TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatNumber(e.users)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </StatsSection>
      </div>

      <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Прежде чем чинить UX просевшей воронки, проверьте этот экран: падающий эндпоинт на одной версии выглядит как
        «пользователи перестали бронировать».
      </p>
    </AnalyticsPageShell>
  );
};
