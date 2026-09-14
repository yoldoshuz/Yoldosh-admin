"use client";

import { useState } from "react";
import { Info, LayoutGrid } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { Conversion } from "@/components/shared/analytics/Metrics";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyticsNav } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { formatPct, navTabLabel } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";

// ============================================================
// Меню — через какую вкладку таб-бара гость уходит регистрироваться.
//
// Вкладка может собирать больше всего тапов и при этом конвертить
// хуже всех, поэтому главная колонка — signup_conv_pct, а не taps.
// ============================================================

const FUNNEL_STAGES = [
  { key: "guest_taps", label: "Тапы гостей" },
  { key: "blocked_by_auth", label: "Упёрлись в регистрацию" },
  { key: "signups", label: "Зарегистрировались" },
] as const;

export const AnalyticsNavPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const { data, isLoading } = useAnalyticsNav(query);
  const [selected, setSelected] = useState<string | null>(null);

  const items = data?.data?.items ?? [];
  const totalSignups = data?.data?.total_signups ?? 0;
  const active = items.find((i) => i.tab === selected) ?? items[0] ?? null;
  const stageMax = active ? active.guest_taps || 1 : 1;

  return (
    <AnalyticsPageShell
      title="Аналитика · Меню"
      subtitle="Нижний таб-бар: тапы → упёрлись в регистрацию → аккаунт"
      icon={LayoutGrid}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
    >
      <StatsSection title="Вкладки таб-бара" description={`Всего регистраций за период: ${formatNumber(totalSignups)}`}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
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
                  <TableHead>Вкладка</TableHead>
                  <TableHead className="text-right">Тапы</TableHead>
                  <TableHead className="text-right">Гости</TableHead>
                  <TableHead className="text-right">Упёрлись</TableHead>
                  <TableHead className="text-right">Доля упёршихся</TableHead>
                  <TableHead className="text-right">Регистрации</TableHead>
                  <TableHead className="text-right">Конверсия</TableHead>
                  <TableHead className="text-right">Доля регистраций</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow
                    key={it.tab}
                    onClick={() => setSelected(it.tab)}
                    className={cn(
                      "cursor-pointer",
                      active?.tab === it.tab && "bg-emerald-500/5 hover:bg-emerald-500/10"
                    )}
                  >
                    <TableCell className="font-medium">
                      {navTabLabel(it.tab)}
                      <span className="text-muted-foreground ml-2 font-mono text-[11px]">{it.tab}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(it.taps)}</TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {formatNumber(it.guest_taps)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(it.blocked_by_auth)}</TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={it.block_rate_pct}
                        numerator={it.blocked_by_auth}
                        denominator={it.guest_taps}
                        label="Упёрлись из тапов гостей"
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(it.signups)}</TableCell>
                    <TableCell className="text-right">
                      <Conversion
                        pct={it.signup_conv_pct}
                        numerator={it.signups}
                        denominator={it.blocked_by_auth}
                        label="Зарегались из упёршихся"
                        className="font-semibold"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {formatPct(it.share_of_signups_pct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StatsSection>

      {active && (
        <StatsSection
          title={`Воронка вкладки «${navTabLabel(active.tab)}»`}
          description="Тапы гостей → упёрлись в стену регистрации → завели аккаунт"
        >
          <ul className="space-y-2.5">
            {FUNNEL_STAGES.map((stage, i) => {
              const value = active[stage.key];
              const prev = i > 0 ? active[FUNNEL_STAGES[i - 1].key] : null;
              return (
                <li key={stage.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
                      {stage.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      <span className="text-foreground font-semibold tabular-nums">{formatNumber(value)}</span>
                      {prev != null && (
                        <>
                          {" · "}
                          <Conversion
                            pct={prev > 0 ? (value / prev) * 100 : null}
                            numerator={value}
                            denominator={prev}
                            className="text-foreground font-medium"
                          />
                        </>
                      )}
                    </span>
                  </div>
                  <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${Math.max(2, (value / stageMax) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </StatsSection>
      )}

      <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        «Упёрлись» считается по паре сессия+пользователь, поэтому события auth_required_redirect и auth_wall_shown не
        дают двойного счёта.
      </p>
    </AnalyticsPageShell>
  );
};
