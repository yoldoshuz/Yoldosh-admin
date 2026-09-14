"use client";

import { useState } from "react";
import { Filter, Info } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { ExportButton } from "@/components/shared/analytics/ExportButton";
import { FunnelSteps } from "@/components/shared/analytics/FunnelSteps";
import { Conversion, DeltaBadge, LowSampleNotice } from "@/components/shared/analytics/Metrics";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsFunnel } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatDay, formatPct, FUNNELS, humanizeEventName, num, previousPeriod } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";
import type { AnalyticsFunnelCode } from "@/types";

// ============================================================
// Воронки — селектор воронки, столбцы конверсии, сравнение периодов.
//
// Произвольные воронки «на лету» бэк не поддерживает намеренно:
// такой запрос сканирует сырые события. Новая воронка добавляется
// в реестр на бэке и появляется здесь после первого пересчёта.
// ============================================================

export const AnalyticsFunnelsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [funnel, setFunnel] = useState<AnalyticsFunnelCode>("search_to_booking");

  const { data, isLoading, isError, refetch } = useAnalyticsFunnel(funnel, query);
  const prevRange = previousPeriod(filters.from, filters.to);
  const { data: prevData } = useAnalyticsFunnel(funnel, { ...query, ...prevRange });

  const steps = data?.data?.steps ?? [];
  const prevSteps = prevData?.data?.steps ?? [];
  const meta = FUNNELS.find((f) => f.code === funnel);
  const startUsers = steps[0]?.users;
  const last = steps[steps.length - 1];
  const prevLast = prevSteps[prevSteps.length - 1];
  // Дельта сквозной конверсии: считаем только когда есть с чем сравнивать.
  const prevEndToEnd = num(prevLast?.conv_from_start);
  const endToEndDelta =
    last && prevLast && prevEndToEnd > 0 ? ((num(last.conv_from_start) - prevEndToEnd) / prevEndToEnd) * 100 : null;

  return (
    <AnalyticsPageShell
      title="Аналитика · Воронки"
      subtitle={meta?.description}
      icon={Filter}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      isError={isError}
      onRetry={refetch}
      actions={
        <>
          <Select value={funnel} onValueChange={(v) => setFunnel(v as AnalyticsFunnelCode)}>
            <SelectTrigger className="h-9 w-[210px] text-xs">
              <SelectValue placeholder="Воронка" />
            </SelectTrigger>
            <SelectContent>
              {FUNNELS.map((f) => (
                <SelectItem key={f.code} value={f.code}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton report="funnel" filters={filters} funnel={funnel} />
        </>
      }
    >
      <LowSampleNotice users={startUsers} />

      <StatsSection
        title={meta?.label ?? funnel}
        description={
          data?.data?.window_minutes != null
            ? `Окно между соседними шагами — ${data.data.window_minutes} мин. Единица воронки — пользователь за сутки.`
            : "Единица воронки — пользователь за сутки, а не сессия."
        }
      >
        <FunnelSteps steps={steps} loading={isLoading} />
      </StatsSection>

      <StatsSection
        title="Сравнение с предыдущим периодом"
        description={`${formatDay(prevRange.from)} – ${formatDay(prevRange.to)}`}
      >
        {!steps.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Сквозная конверсия:</span>
              <span className="font-semibold tabular-nums">{formatPct(last?.conv_from_start)}</span>
              <span className="text-muted-foreground text-xs">было {formatPct(prevLast?.conv_from_start)}</span>
              <DeltaBadge value={endToEndDelta} />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Шаг</TableHead>
                    <TableHead className="text-right">Пользователи</TableHead>
                    <TableHead className="text-right">Было</TableHead>
                    <TableHead className="text-right">От пред. шага</TableHead>
                    <TableHead className="text-right">От старта</TableHead>
                    <TableHead className="text-right">Динамика</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((s, i) => {
                    const prev = prevSteps.find((x) => x.name === s.name);
                    const prevUsers = num(prev?.users);
                    const d = prev && prevUsers > 0 ? ((num(s.users) - prevUsers) / prevUsers) * 100 : null;
                    return (
                      <TableRow key={`${s.step}-${s.name}`}>
                        <TableCell className="font-medium">
                          <span className="text-muted-foreground mr-2 tabular-nums">{s.step ?? i + 1}.</span>
                          {humanizeEventName(s.name)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(s.users)}</TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {prev ? formatNumber(prev.users) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Conversion
                            pct={s.conv_from_prev}
                            numerator={s.users}
                            denominator={i > 0 ? steps[i - 1].users : s.users}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Conversion pct={s.conv_from_start} numerator={s.users} denominator={steps[0].users} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DeltaBadge value={d} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </StatsSection>

      <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Шаги считаются строго по порядку и в пределах окна между соседними шагами — иначе «забронировал, потом поискал»
        попадало бы в воронку. Нужна новая воронка — её добавляют в реестр на бэке.
      </p>
    </AnalyticsPageShell>
  );
};
