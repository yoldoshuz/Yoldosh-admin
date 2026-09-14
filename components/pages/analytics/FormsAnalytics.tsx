"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { ExportButton } from "@/components/shared/analytics/ExportButton";
import { Conversion, LowSampleNotice } from "@/components/shared/analytics/Metrics";
import { StatCard } from "@/components/shared/StatCard";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsFormDetails, useAnalyticsForms } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatMs, formatPct, formatSeconds, humanizeEventName, num, pctOf } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";

// ============================================================
// Формы — drop-off по полям.
//
// Воронка по полям сверху вниз: видно, на каком поле люди
// закрывают форму и какое поле дольше всего заполняют.
// ============================================================

export const AnalyticsFormsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [form, setForm] = useState<string>("");

  const listQ = useAnalyticsForms(query);
  const forms = listQ.data?.data ?? [];
  const firstForm = listQ.data?.data?.[0]?.form;

  // Первую форму выбираем автоматически, чтобы экран не был пустым.
  useEffect(() => {
    if (!form && firstForm) setForm(firstForm);
  }, [form, firstForm]);

  const detailsQ = useAnalyticsFormDetails(form, query);
  const d = detailsQ.data?.data;
  const maxFocused = Math.max(...(d?.fields ?? []).map((f) => num(f.focused)), 1);

  return (
    <AnalyticsPageShell
      title="Аналитика · Формы"
      subtitle="На каком поле пользователи закрывают форму"
      icon={ClipboardList}
      meta={listQ.data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      isError={listQ.isError || detailsQ.isError}
      onRetry={() => {
        listQ.refetch();
        detailsQ.refetch();
      }}
      actions={<ExportButton report="forms" filters={filters} form={form || undefined} />}
    >
      <StatsSection title="Формы" description="Общая конверсия: сколько начавших дошли до отправки">
        {listQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : !forms.length ? (
          <p className="text-muted-foreground text-sm">Нет данных за период</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Форма</TableHead>
                  <TableHead className="text-right">Начали</TableHead>
                  <TableHead className="text-right">Отправили</TableHead>
                  <TableHead className="text-right">Конверсия</TableHead>
                  <TableHead className="text-right">Ср. время</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((f) => (
                  <TableRow
                    key={f.form}
                    onClick={() => setForm(f.form)}
                    className={cn("cursor-pointer", form === f.form && "bg-emerald-500/5 hover:bg-emerald-500/10")}
                  >
                    <TableCell className="font-medium">{humanizeEventName(f.form)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(f.started)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(f.submitted)}</TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={f.completion_pct}
                        numerator={f.submitted}
                        denominator={f.started}
                        label="Отправили из начавших"
                        className="font-semibold"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {f.avg_time_sec != null ? formatSeconds(f.avg_time_sec) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StatsSection>

      {form && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Начали" value={d?.started ?? null} loading={detailsQ.isLoading} />
            <StatCard title="Отправили" value={d?.submitted ?? null} tone="emerald" loading={detailsQ.isLoading} />
            <StatCard
              title="Конверсия"
              value={d ? formatPct(d.completion_pct) : null}
              tone="sky"
              loading={detailsQ.isLoading}
            />
            <StatCard
              title="Ср. время"
              value={d ? formatSeconds(d.avg_time_sec) : null}
              tone="amber"
              loading={detailsQ.isLoading}
            />
          </div>

          <LowSampleNotice users={d?.started} />

          <StatsSection
            title={`Поля формы «${humanizeEventName(form)}»`}
            description="Сверху вниз в порядке заполнения: где фокус теряется, там форму и закрывают"
          >
            {detailsQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : !d?.fields?.length ? (
              <p className="text-muted-foreground text-sm">Нет данных за период</p>
            ) : (
              <ol className="space-y-2.5">
                {[...d.fields]
                  .sort((a, b) => num(a.index) - num(b.index))
                  .map((f) => (
                    <li key={f.field} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="bg-muted flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums">
                            {f.index ?? "?"}
                          </span>
                          {f.field}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          фокус <span className="text-foreground font-semibold">{formatNumber(f.focused)}</span> ·
                          заполнено{" "}
                          <Conversion
                            pct={pctOf(f.filled, f.focused)}
                            numerator={f.filled}
                            denominator={f.focused}
                            className="text-foreground font-medium"
                          />{" "}
                          · ушли отсюда{" "}
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {formatNumber(f.abandoned_here)}
                          </span>{" "}
                          · {formatMs(f.avg_fill_ms)}
                          {num(f.errors) > 0 && (
                            <>
                              {" · "}
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {formatNumber(f.errors)} ошибок
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${Math.max(2, (num(f.focused) / maxFocused) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </StatsSection>

          {!!d?.drop_off_top?.length && (
            <StatsSection title="Где чаще всего бросают" description="Топ полей по доле ушедших">
              <ul className="space-y-2">
                {d.drop_off_top.map((row) => (
                  <li key={row.field} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <span className="font-medium">{row.field}</span>
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {formatNumber(row.users)} польз. · {formatPct(row.share_pct)}
                    </span>
                  </li>
                ))}
              </ul>
            </StatsSection>
          )}
        </>
      )}
    </AnalyticsPageShell>
  );
};
