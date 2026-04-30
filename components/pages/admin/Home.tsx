"use client";

import { useState } from "react";
import { CarFront, Flag, ShieldAlert, Ticket, UserCheck, Users } from "lucide-react";

import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { useGetAdminProfile, useGetAdminStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";

const statusToneByKey: Record<string, "emerald" | "sky" | "amber" | "red" | "violet" | "default"> = {
  COMPLETED: "emerald",
  CONFIRMED: "emerald",
  CREATED: "sky",
  PENDING: "amber",
  IN_PROGRESS: "amber",
  CANCELED: "red",
  CANCELLED: "red",
  RESOLVED: "sky",
  REJECTED: "red",
};

const StatusChips = ({ data }: { data: Record<string, number> | undefined }) => {
  if (!data) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {Object.entries(data).map(([k, v]) => {
        const tone = statusToneByKey[k] ?? "default";
        const cls =
          tone === "emerald"
            ? "pill-emerald"
            : tone === "amber"
              ? "pill-amber"
              : tone === "red"
                ? "pill-red"
                : tone === "sky"
                  ? "pill-sky"
                  : tone === "violet"
                    ? "pill-violet"
                    : "pill-slate";
        return (
          <span key={k} className={cls}>
            {k.replace("_", " ").toLowerCase()} · <span className="tabular-nums">{formatCompactNumber(v)}</span>
          </span>
        );
      })}
    </div>
  );
};

/**
 * Admin Home: rabotchaya, no-frills overview.
 * Sensitive aggregates (wallet balance, banned counts, financial KPIs) are
 * intentionally NOT shown here — those live in the SuperAdmin dashboard.
 */
export const Home = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data: profile } = useGetAdminProfile();
  const { data: stats, isLoading, isError, refetch } = useGetAdminStats(range);

  const pendingReports = stats?.reports?.byStatus?.PENDING ?? 0;
  const pendingApplications = stats?.applications?.pending ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-text">Привет{profile?.firstName ? `, ${profile.firstName}` : ""}!</h2>
          <p className="subtitle-text">Текущая сводка по платформе</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center justify-between">
            <span>Не удалось загрузить статистику.</span>
            <button onClick={() => refetch()} className="font-medium underline-offset-4 hover:underline">
              Повторить
            </button>
          </div>
        </div>
      )}

      {/* Compact KPI grid (no financial data) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Пользователи"
          value={stats?.users?.total}
          icon={Users}
          tone="emerald"
          subtext={
            stats?.users?.newInRange != null ? `+${formatCompactNumber(stats.users.newInRange)} за период` : undefined
          }
          loading={isLoading}
        />
        <StatCard title="Водителей" value={stats?.users?.drivers} icon={UserCheck} tone="sky" loading={isLoading} />
        <StatCard title="Поездок" value={stats?.trips?.total} icon={CarFront} tone="violet" loading={isLoading} />
        <StatCard title="Бронирований" value={stats?.bookings?.total} icon={Ticket} tone="sky" loading={isLoading} />
        <StatCard
          title="Жалоб открытых"
          value={pendingReports}
          icon={Flag}
          tone={pendingReports > 0 ? "red" : "default"}
          highlight={pendingReports > 0}
          loading={isLoading}
        />
        <StatCard
          title="Заявок водителей"
          value={pendingApplications}
          icon={ShieldAlert}
          tone={pendingApplications > 0 ? "amber" : "default"}
          highlight={pendingApplications > 0}
          loading={isLoading}
        />
      </div>

      {/* Status distribution chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Поездки по статусам</p>
          <StatusChips data={stats?.trips?.byStatus} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Бронирования</p>
          <StatusChips data={stats?.bookings?.byStatus} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Жалобы</p>
          <StatusChips data={stats?.reports?.byStatus} />
        </div>
      </div>

      {/* Two charts only — admin doesn't need full breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Регистрации"
          total={stats?.users?.newInRange}
          totalSuffix="за период"
          loading={isLoading}
          series={[
            { name: "Пользователи", data: stats?.users?.graph ?? [], color: "var(--chart-1)" },
            { name: "Водители", data: stats?.users?.driversGraph ?? [], color: "var(--chart-2)" },
          ]}
        />
        <OverviewChart
          title="Поездки"
          total={stats?.trips?.createdInRange}
          totalSuffix="создано"
          loading={isLoading}
          series={[{ name: "Создано", data: stats?.trips?.graph ?? [], color: "var(--chart-1)" }]}
        />
      </div>
    </div>
  );
};
