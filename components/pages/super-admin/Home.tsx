"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Banknote,
  CarFront,
  ChevronRight,
  CircleDollarSign,
  Flag,
  ShieldAlert,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from "lucide-react";

import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList, toRoutesList, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams } from "@/components/shared/stats/StatsPageShell";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetAdminStats, useGetTripsStats, useGetUsersStats, useGetWalletStats } from "@/hooks/adminHooks";
import { useGetSuperAdminProfile } from "@/hooks/superAdminHooks";
import { formatCompactNumber, formatNumber } from "@/lib/utils";

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

const QuickLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="group inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
  >
    {label}
    <ChevronRight className="size-3 transition group-hover:translate-x-0.5" />
  </Link>
);

export const Home = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const params = rangeToParams(range);
  const { data: superAdmin } = useGetSuperAdminProfile();
  const { data: stats, isLoading, isError, refetch } = useGetAdminStats(params);
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersStats(params);
  const { data: tripsData, isLoading: isTripsLoading } = useGetTripsStats(params);
  const { data: walletData, isLoading: isWalletLoading } = useGetWalletStats(params);

  const pendingReports = stats?.reports?.byStatus?.PENDING ?? 0;
  const pendingApplications = stats?.applications?.pending ?? 0;
  const inProgressTrips = stats?.trips?.byStatus?.IN_PROGRESS ?? 0;

  // Derived: drivers with >= 1 trip from users-stats top list
  const activeDriversCount = (usersData?.top?.driversByTrips ?? []).length;
  const topDrivers = toUserTopList(usersData?.top?.driversByTrips, "trips_count");
  const topPassengers = toUserTopList(usersData?.top?.passengersByBookings, "bookings_count");

  const topRoutes = toRoutesList(tripsData?.top?.routes);
  const topDepCities = toCitiesList(tripsData?.top?.departureCities, "from_city");

  const topWallets = toUserTopList(walletData?.top?.usersByBalance, "balance");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-text">Привет{superAdmin?.firstName ? `, ${superAdmin.firstName}` : ""}!</h2>
          <p className="subtitle-text">Полная сводка по платформе Yoldosh</p>
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

      {/* TOP ROW: rich KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Активные поездки"
          value={inProgressTrips}
          icon={Activity}
          tone={inProgressTrips > 0 ? "emerald" : "default"}
          highlight={inProgressTrips > 0}
          subtext="В пути сейчас"
          loading={isLoading}
        />
        <StatCard
          title="Кошельки"
          value={stats?.wallet?.totalBalance != null ? `${formatNumber(stats.wallet.totalBalance)} UZS` : undefined}
          icon={Wallet}
          tone="emerald"
          subtext="Баланс на руках"
          loading={isLoading}
        />
        <StatCard
          title="Гости"
          value={stats?.guests?.uniqueInRange}
          icon={Users}
          tone="violet"
          subtext="Уникальных за период"
          loading={isLoading}
        />
        <StatCard
          title="Завершено"
          value={stats?.trips?.byStatus?.COMPLETED}
          icon={CarFront}
          tone="sky"
          subtext="Успешные поездки"
          loading={isLoading}
        />
        <StatCard
          title="Жалобы"
          value={stats?.reports?.total}
          icon={Flag}
          tone={pendingReports > 0 ? "red" : "default"}
          highlight={pendingReports > 0}
          subtext={`${formatCompactNumber(pendingReports)} открытых`}
          loading={isLoading}
        />
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Пользователи"
          value={stats?.users?.total}
          icon={Users}
          tone="emerald"
          subtext={
            stats?.users?.newInRange != null ? `+${formatCompactNumber(stats.users.newInRange)} новых` : undefined
          }
          loading={isLoading}
        />
        <StatCard
          title="Водители"
          value={stats?.users?.drivers}
          icon={UserCheck}
          tone="sky"
          subtext={
            stats?.users?.newDriversInRange != null
              ? `+${formatCompactNumber(stats.users.newDriversInRange)} новых`
              : undefined
          }
          loading={isLoading}
        />
        <StatCard
          title="Активные водители"
          value={activeDriversCount}
          icon={TrendingUp}
          tone="emerald"
          subtext="С поездками"
          loading={isUsersLoading}
        />
        <StatCard title="Забанено" value={stats?.users?.banned} icon={UserX} tone="red" loading={isLoading} />
        <StatCard
          title="Заявки водителей"
          value={pendingApplications}
          icon={ShieldAlert}
          tone={pendingApplications > 0 ? "amber" : "default"}
          highlight={pendingApplications > 0}
          subtext={`Подтв.: ${formatCompactNumber(stats?.applications?.verified ?? 0)}`}
          loading={isLoading}
        />
        <StatCard title="Бронирований" value={stats?.bookings?.total} icon={Ticket} tone="sky" loading={isLoading} />
      </div>

      {/* Status distribution chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Поездки по статусам</p>
            <QuickLink href="/super-admin/stats/trips" label="Подробнее" />
          </div>
          <StatusChips data={stats?.trips?.byStatus} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Бронирования</p>
            <QuickLink href="/super-admin/stats/trips" label="Подробнее" />
          </div>
          <StatusChips data={stats?.bookings?.byStatus} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Жалобы</p>
            <QuickLink href="/super-admin/stats/reports" label="Подробнее" />
          </div>
          <StatusChips data={stats?.reports?.byStatus} />
        </div>
      </div>

      {/* Charts grid */}
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
          series={[
            {
              name: "Создано",
              data: tripsData?.timeSeries?.created ?? stats?.trips?.graph ?? [],
              color: "var(--chart-1)",
            },
            { name: "Завершено", data: tripsData?.timeSeries?.completed ?? [], color: "var(--chart-2)" },
            { name: "Отменено", data: tripsData?.timeSeries?.canceled ?? [], color: "var(--chart-4)" },
          ]}
        />
        <OverviewChart
          title="Бронирования"
          total={stats?.bookings?.total}
          loading={isLoading}
          series={[{ name: "Бронирования", data: stats?.bookings?.graph ?? [], color: "var(--chart-3)" }]}
        />
        <OverviewChart
          title="Пополнения кошельков"
          total={walletData?.topUps?.total ?? stats?.wallet?.topUpsInRange}
          totalSuffix="UZS"
          loading={isLoading || isWalletLoading}
          series={[
            { name: "Сумма", data: walletData?.topUps?.graph ?? stats?.wallet?.graph ?? [], color: "var(--chart-1)" },
          ]}
        />
      </div>

      {/* Top routes / cities / users */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ маршрутов">
          <TopList data={topRoutes} loading={isTripsLoading} limit={10} />
        </StatsSection>
        <StatsSection title="Топ городов отправления">
          <TopList data={topDepCities} loading={isTripsLoading} limit={10} />
        </StatsSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ водителей по поездкам">
          <TopList data={topDrivers} loading={isUsersLoading} limit={10} />
        </StatsSection>
        <StatsSection title="Топ пассажиров по бронированиям">
          <TopList data={topPassengers} loading={isUsersLoading} limit={10} />
        </StatsSection>
      </div>

      <StatsSection title="Топ кошельков по балансу">
        <TopList data={topWallets} loading={isWalletLoading} format="money" limit={10} />
      </StatsSection>

      {/* Quick deep-link cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/super-admin/stats/users", title: "Аналитика пользователей", icon: Users, tone: "emerald" as const },
          { href: "/super-admin/stats/wallet", title: "Финансовая аналитика", icon: Banknote, tone: "sky" as const },
          {
            href: "/super-admin/stats/active-trips",
            title: "Активные поездки",
            icon: Activity,
            tone: "amber" as const,
          },
          {
            href: "/super-admin/stats/admins",
            title: "Активность админов",
            icon: CircleDollarSign,
            tone: "violet" as const,
          },
        ].map((q) => {
          const Icon = q.icon;
          const tone =
            q.tone === "emerald"
              ? "text-emerald-500 bg-emerald-500/10"
              : q.tone === "sky"
                ? "text-sky-500 bg-sky-500/10"
                : q.tone === "amber"
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-violet-500 bg-violet-500/10";
          return (
            <Link key={q.href} href={q.href} className="stats-card group p-4 flex items-center gap-3">
              <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <span className="flex-1 font-medium">{q.title}</span>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
