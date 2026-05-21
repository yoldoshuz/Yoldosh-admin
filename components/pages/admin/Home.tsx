"use client";

import { useState } from "react";
import { CarFront, Flag, ShieldAlert, Ticket, UserCheck, Users } from "lucide-react";

import { ActiveTripsSnapshotBlock } from "@/components/shared/active-trips/ActiveTripsSnapshot";
import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { RateCard } from "@/components/shared/stats/RateCard";
import { pickSegmentBlock } from "@/components/shared/stats/segments";
import { SegmentTabs } from "@/components/shared/stats/SegmentTabs";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { useGetAdminProfile, useGetAdminStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";
import type { Pair, UserSegment } from "@/types";

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
  const entries = Object.entries(data);
  if (!entries.length) return <p className="text-muted-foreground mt-3 text-sm">Нет данных</p>;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => {
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
            {k.replace(/_/g, " ").toLowerCase()} · <span className="tabular-nums">{formatCompactNumber(v)}</span>
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
  const [segment, setSegment] = useState<UserSegment>("real");
  const { data: profile } = useGetAdminProfile();
  const { data: stats, isLoading, isError, refetch } = useGetAdminStats(range);

  const pendingReports = stats?.reports?.byStatusInRange?.PENDING ?? 0;
  const pendingApplications = stats?.applications?.pendingCounts?.totalInRange ?? 0;
  const activeTripsSnapshot = stats?.activeTrips ?? stats?.trips?.active;

  // Pull segmented counts off overview.segments (real/bots/guests/all).
  const segmentBlock = pickSegmentBlock(stats?.segments, segment);
  const usersPair: Pair | undefined =
    segmentBlock != null ? { total: segmentBlock.total, totalInRange: segmentBlock.totalInRange } : undefined;
  const driversPair = segment === "guests" ? undefined : segmentBlock?.drivers;
  const passengersPair = segment === "guests" ? undefined : segmentBlock?.passengers;

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

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Сегмент пользователей</p>
        <SegmentTabs value={segment} onChange={setSegment} />
      </div>

      {/* Compact KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPairCard title="Пользователи" pair={usersPair} icon={Users} tone="emerald" loading={isLoading} />
        <StatPairCard title="Водители" pair={driversPair} icon={UserCheck} tone="sky" loading={isLoading} />
        <StatPairCard title="Пассажиры" pair={passengersPair} icon={Users} tone="violet" loading={isLoading} />
        <StatPairCard title="Поездки" pair={stats?.trips?.counts} icon={CarFront} tone="violet" loading={isLoading} />
        <StatPairCard
          title="Бронирования"
          pair={stats?.bookings?.counts}
          icon={Ticket}
          tone="sky"
          loading={isLoading}
        />
        <StatPairCard
          title="Жалоб открытых"
          pair={
            stats?.reports
              ? {
                  total: stats.reports.byStatusInRange?.PENDING ?? 0,
                  totalInRange: stats.reports.byStatusInRange?.PENDING ?? 0,
                }
              : undefined
          }
          icon={Flag}
          tone={pendingReports > 0 ? "red" : "default"}
          highlight={pendingReports > 0}
          loading={isLoading}
        />
        <StatPairCard
          title="Заявок водителей"
          pair={stats?.applications?.pendingCounts}
          icon={ShieldAlert}
          tone={pendingApplications > 0 ? "amber" : "default"}
          highlight={pendingApplications > 0}
          loading={isLoading}
        />
      </div>

      {/* Active trips snapshot */}
      {activeTripsSnapshot && (
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Сейчас на платформе
          </p>
          <ActiveTripsSnapshotBlock snapshot={activeTripsSnapshot} loading={isLoading} variant="compact" />
        </div>
      )}

      {/* Rates */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RateCard
          title="Завершено поездок"
          inRange={stats?.trips?.rates?.completionRateInRange}
          allTime={stats?.trips?.rates?.completionRateAllTime}
          tone="emerald"
          loading={isLoading}
        />
        <RateCard
          title="Отменено поездок"
          inRange={stats?.trips?.rates?.cancellationRateInRange}
          allTime={stats?.trips?.rates?.cancellationRateAllTime}
          tone="red"
          loading={isLoading}
        />
        <RateCard
          title="Подтверждено броней"
          inRange={stats?.bookings?.rates?.confirmationRateInRange}
          allTime={stats?.bookings?.rates?.confirmationRateAllTime}
          tone="sky"
          loading={isLoading}
        />
        <RateCard
          title="Отменено броней"
          inRange={stats?.bookings?.rates?.cancellationRateInRange}
          allTime={stats?.bookings?.rates?.cancellationRateAllTime}
          tone="red"
          loading={isLoading}
        />
      </div>

      {/* Status distribution chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Поездки по статусам · в периоде
          </p>
          <StatusChips data={stats?.trips?.byStatusInRange} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Бронирования · в периоде
          </p>
          <StatusChips data={stats?.bookings?.byStatusInRange} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Жалобы · в периоде</p>
          <StatusChips data={stats?.reports?.byStatusInRange} />
        </div>
      </div>

      {/* Two charts only — admin doesn't need full breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Регистрации (real)"
          total={stats?.users?.counts?.totalInRange?.real}
          totalSuffix="за период"
          loading={isLoading}
          series={[
            { name: "Реальные", data: stats?.users?.graph ?? [], color: "var(--chart-1)" },
            { name: "Все сегменты", data: stats?.users?.graphAll ?? [], color: "var(--chart-2)" },
          ]}
        />
        <OverviewChart
          title="Поездки"
          total={stats?.trips?.counts?.totalInRange}
          totalSuffix="создано"
          loading={isLoading}
          series={[{ name: "Создано", data: stats?.trips?.graph ?? [], color: "var(--chart-1)" }]}
        />
      </div>
    </div>
  );
};
