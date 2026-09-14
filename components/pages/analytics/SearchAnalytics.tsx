"use client";

import { useState } from "react";
import { Info, Search, TriangleAlert } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { ExportButton } from "@/components/shared/analytics/ExportButton";
import { Conversion } from "@/components/shared/analytics/Metrics";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAnalyticsSearchDemand,
  useAnalyticsSearchFilters,
  useAnalyticsSearchInputs,
  useAnalyticsSearchQueries,
} from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatMs, formatPct, searchFieldLabel, searchMethodLabel } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Поиск — спрос по направлениям, нулевая выдача, фильтры,
// способы ввода «откуда/куда» и ненайденные запросы.
//
// Направления с высоким searches и высоким zero_results — прямой
// сигнал, где не хватает водителей. Ненайденные запросы с
// unmatched=true — готовый список городов и синонимов для справочника.
// ============================================================

const TableSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-9 rounded-lg" />
    ))}
  </div>
);

export const AnalyticsSearchPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const [onlyUnmatched, setOnlyUnmatched] = useState(true);

  const demandQ = useAnalyticsSearchDemand({ ...query, limit: 50 });
  const inputsQ = useAnalyticsSearchInputs(query);
  const queriesQ = useAnalyticsSearchQueries({ ...query, limit: 100, unmatched: onlyUnmatched });
  const filtersQ = useAnalyticsSearchFilters(query);

  const demand = demandQ.data?.data ?? [];
  const inputs = inputsQ.data?.data ?? [];
  const queries = queriesQ.data?.data ?? [];
  const searchFilters = filtersQ.data?.data ?? [];

  // «Не хватает водителей»: сначала много спроса, потом много пустой выдачи.
  const starving = [...demand]
    .filter((d) => d.zero_results > 0)
    .sort((a, b) => b.zero_results - a.zero_results)
    .slice(0, 10);

  const inputsByField = inputs.reduce<Record<string, typeof inputs>>((acc, row) => {
    (acc[row.field] ??= []).push(row);
    return acc;
  }, {});

  return (
    <AnalyticsPageShell
      title="Аналитика · Поиск"
      subtitle="Спрос по направлениям, нулевая выдача, ввод городов и фильтры"
      icon={Search}
      meta={demandQ.data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      actions={<ExportButton report="search" filters={filters} />}
    >
      <Tabs defaultValue="demand" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="demand">Спрос</TabsTrigger>
          <TabsTrigger value="inputs">Ввод городов</TabsTrigger>
          <TabsTrigger value="queries">Ненайденное</TabsTrigger>
          <TabsTrigger value="filters">Фильтры</TabsTrigger>
        </TabsList>

        {/* ===================== Спрос по направлениям ===================== */}
        <TabsContent value="demand" className="mt-4 flex flex-col gap-4 sm:gap-6">
          <StatsSection
            title="Где не хватает водителей"
            description="Высокий спрос при пустой выдаче — направления, которые некому закрыть"
          >
            {demandQ.isLoading ? (
              <TableSkeleton rows={4} />
            ) : !starving.length ? (
              <p className="text-muted-foreground text-sm">Нулевой выдачи за период нет</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {starving.map((d) => (
                  <li
                    key={`${d.from_city}-${d.to_city}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-300/50 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-900/10"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <TriangleAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="truncate font-medium">
                        {d.from_city} → {d.to_city}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {formatNumber(d.zero_results)} пусто / {formatNumber(d.searches)} поисков
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </StatsSection>

          <StatsSection title="Направления" description="Поиски, уникальные пользователи и конверсия в бронь">
            {demandQ.isLoading ? (
              <TableSkeleton />
            ) : !demand.length ? (
              <p className="text-muted-foreground text-sm">Нет данных за период</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Направление</TableHead>
                      <TableHead className="text-right">Поиски</TableHead>
                      <TableHead className="text-right">Пользователи</TableHead>
                      <TableHead className="text-right">Пустая выдача</TableHead>
                      <TableHead className="text-right">Брони</TableHead>
                      <TableHead className="text-right">Конверсия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demand.map((d) => (
                      <TableRow key={`${d.from_city}-${d.to_city}`}>
                        <TableCell className="font-medium">
                          {d.from_city} → {d.to_city}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(d.searches)}</TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {formatNumber(d.users)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {d.zero_results > 0 ? (
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {formatNumber(d.zero_results)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(d.bookings)}</TableCell>
                        <TableCell className="text-right">
                          <Conversion
                            pct={d.conv_pct}
                            numerator={d.bookings}
                            denominator={d.searches}
                            label="Брони из поисков"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </StatsSection>
        </TabsContent>

        {/* ===================== Ввод «откуда / куда» ===================== */}
        <TabsContent value="inputs" className="mt-4 flex flex-col gap-4 sm:gap-6">
          {inputsQ.isLoading ? (
            <StatsSection title="Способы ввода">
              <TableSkeleton />
            </StatsSection>
          ) : !inputs.length ? (
            <StatsSection title="Способы ввода">
              <p className="text-muted-foreground text-sm">Нет данных за период</p>
            </StatsSection>
          ) : (
            Object.entries(inputsByField).map(([field, rows]) => (
              <StatsSection
                key={field}
                title={`Поле «${searchFieldLabel(field)}»`}
                description="Высокая доля ручного ввода при высокой пустой выдаче означает, что подсказки не справляются"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Способ</TableHead>
                        <TableHead className="text-right">Использований</TableHead>
                        <TableHead className="text-right">Пользователи</TableHead>
                        <TableHead className="text-right">Ср. время</TableHead>
                        <TableHead className="text-right">Поиски</TableHead>
                        <TableHead className="text-right">Пустая выдача</TableHead>
                        <TableHead className="text-right">Доля в поле</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={`${r.field}-${r.method}`}>
                          <TableCell className="font-medium">
                            {searchMethodLabel(r.method)}
                            <span className="text-muted-foreground ml-2 font-mono text-[11px]">{r.method}</span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(r.cnt)}</TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">
                            {formatNumber(r.users)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatMs(r.avg_time_ms)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(r.searches)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Conversion
                              pct={r.searches > 0 ? (r.zero_results / r.searches) * 100 : null}
                              numerator={r.zero_results}
                              denominator={r.searches}
                              label="Пустая выдача"
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatPct(r.share_in_field_pct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </StatsSection>
            ))
          )}
        </TabsContent>

        {/* ===================== Ненайденные запросы ===================== */}
        <TabsContent value="queries" className="mt-4">
          <StatsSection
            title="Что набирают руками"
            description="С фильтром «только ненайденные» — готовый список городов и синонимов для справочника"
          >
            <div className="mb-4 flex items-center gap-2">
              <Switch id="unmatched" checked={onlyUnmatched} onCheckedChange={setOnlyUnmatched} />
              <label htmlFor="unmatched" className="cursor-pointer text-sm">
                Только ненайденные справочником
              </label>
            </div>

            {queriesQ.isLoading ? (
              <TableSkeleton />
            ) : !queries.length ? (
              <p className="text-muted-foreground text-sm">Нет данных за период</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Запрос</TableHead>
                      <TableHead>Поле</TableHead>
                      <TableHead className="text-right">Раз</TableHead>
                      <TableHead className="text-right">Пользователи</TableHead>
                      <TableHead className="text-right">Нашлось</TableHead>
                      <TableHead className="text-right">Не нашлось</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queries.map((q, i) => (
                      <TableRow key={`${q.field}-${q.query}-${i}`}>
                        <TableCell className="font-mono text-sm font-medium">{q.query}</TableCell>
                        <TableCell className="text-muted-foreground">{searchFieldLabel(q.field)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(q.cnt)}</TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {formatNumber(q.users)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(q.matched)}</TableCell>
                        <TableCell className="text-right">
                          <Conversion
                            pct={q.unmatched_pct}
                            numerator={q.unmatched}
                            denominator={q.cnt}
                            label="Не нашлось"
                            className="font-medium text-amber-600 dark:text-amber-400"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <p className="text-muted-foreground mt-4 flex items-start gap-1.5 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Текст запроса нормализован (нижний регистр, обрезка до 64 символов), персональных данных там нет.
            </p>
          </StatsSection>
        </TabsContent>

        {/* ===================== Фильтры поиска ===================== */}
        <TabsContent value="filters" className="mt-4">
          <StatsSection title="Какими фильтрами реально пользуются">
            {filtersQ.isLoading ? (
              <TableSkeleton />
            ) : !searchFilters.length ? (
              <p className="text-muted-foreground text-sm">Нет данных за период</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Фильтр</TableHead>
                      <TableHead>Значение</TableHead>
                      <TableHead className="text-right">Применений</TableHead>
                      <TableHead className="text-right">Пользователи</TableHead>
                      <TableHead className="text-right">Доля</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchFilters.map((f, i) => (
                      <TableRow key={`${f.filter}-${f.value ?? ""}-${i}`}>
                        <TableCell className="font-medium">{f.filter}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{f.value ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(f.uses)}</TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {formatNumber(f.users)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatPct(f.share_pct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </StatsSection>
        </TabsContent>
      </Tabs>
    </AnalyticsPageShell>
  );
};
