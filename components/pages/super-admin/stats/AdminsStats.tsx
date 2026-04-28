"use client";

import { useState } from "react";
import Link from "next/link";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { toDistribution } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection } from "@/components/shared/stats/StatsSections";
import { useGetAdminsStats } from "@/hooks/adminHooks";
import { adminLogCategoryMeta, formatDate, formatRelativeTime, shortUserAgent } from "@/lib/utils";

export const AdminsStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetAdminsStats(rangeToParams(range));

  const byRole = toDistribution(data?.byRole, ["role"]);
  const byCategory = (Array.isArray(data?.actionsByCategory) ? data.actionsByCategory : []).map((c: any) => ({
    category: String(c.category ?? "OTHER"),
    count: Number(c.count ?? 0),
  }));
  const graph = (Array.isArray(data?.actionsGraph) ? data.actionsGraph : []).map((p: any) => ({
    date: p.date,
    timestamp: p.timestamp,
    value: Number(p.value ?? p.count ?? 0),
  }));
  const topAdmins = Array.isArray(data?.topActiveAdmins) ? data.topActiveAdmins : [];
  const recentLogins = Array.isArray(data?.recentLogins) ? data.recentLogins : [];

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Активность админов"
        subtitle="Распределение действий и недавние логины"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatsSection title="По ролям">
          <DistributionList data={byRole} loading={isLoading} />
        </StatsSection>

        <StatsSection title="Действий по категории" className="lg:col-span-2">
          {byCategory.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ul className="space-y-1.5">
              {byCategory.map((c: any) => {
                const meta = adminLogCategoryMeta[c.category] ?? adminLogCategoryMeta.OTHER;
                return (
                  <li
                    key={c.category}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-1.5 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{c.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </StatsSection>
      </div>

      <OverviewChart
        title="Действия за период"
        loading={isLoading}
        series={[{ name: "Действий", data: graph, color: "var(--chart-1)" }]}
      />

      <StatsSection title="Топ-20 активных админов">
        {topAdmins.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden">
            {topAdmins.map((a: any) => {
              const fullName = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email || a.id?.slice(0, 8) || "—";
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    {a.id ? (
                      <Link href={`/super-admin/admins/${a.id}`} className="link-text font-medium truncate">
                        {fullName}
                      </Link>
                    ) : (
                      <span className="font-medium truncate">{fullName}</span>
                    )}
                    {a.email && <p className="truncate text-xs text-muted-foreground">{a.email}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="pill-slate">{a.role ?? "—"}</span>
                    <span className="tabular-nums">{Number(a.actions_count ?? a.actionsCount ?? 0)} действий</span>
                    {a.last_action_at && <span>{formatRelativeTime(a.last_action_at)}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </StatsSection>

      <StatsSection title="Последние логины">
        {recentLogins.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden text-sm">
            {recentLogins.map((l: any, i: number) => (
              <li
                key={`${l.admin_id ?? "x"}-${l.timestamp ?? i}-${i}`}
                className="grid grid-cols-12 items-center gap-3 px-3 py-2"
              >
                <div className="col-span-12 sm:col-span-3 min-w-0">
                  {l.admin_id ? (
                    <Link href={`/super-admin/admins/${l.admin_id}`} className="link-text font-medium truncate">
                      {l.admin_name ?? "—"}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{l.admin_name ?? "—"}</span>
                  )}
                </div>
                <span className="col-span-6 sm:col-span-2 font-mono text-xs text-muted-foreground truncate">
                  {l.ip_address ?? l.ipAddress ?? "—"}
                </span>
                <span
                  className="col-span-6 sm:col-span-4 truncate text-xs text-muted-foreground"
                  title={l.user_agent ?? l.userAgent ?? ""}
                >
                  {shortUserAgent(l.user_agent ?? l.userAgent)}
                </span>
                <span className="col-span-12 sm:col-span-3 text-right text-xs text-muted-foreground">
                  {l.timestamp ? formatDate(l.timestamp) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </StatsSection>
    </div>
  );
};
