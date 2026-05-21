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
  Search,
  ShieldAlert,
  Ticket,
  UserCheck,
  Users,
  UserX,
  Wallet,
  Zap,
} from "lucide-react";

import { ActiveTripsSnapshotBlock } from "@/components/shared/active-trips/ActiveTripsSnapshot";
import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList, toRoutesList, toUserTopList } from "@/components/shared/stats/normalize";
import { RateCard } from "@/components/shared/stats/RateCard";
import { pickSegmentBlock } from "@/components/shared/stats/segments";
import { SegmentTabs } from "@/components/shared/stats/SegmentTabs";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams } from "@/components/shared/stats/StatsPageShell";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import {
  useGetAdminStats,
  useGetDauMau,
  useGetSearchesStats,
  useGetTripsStats,
  useGetUsersStats,
  useGetWalletStats,
} from "@/hooks/adminHooks";
import { useGetSuperAdminProfile } from "@/hooks/superAdminHooks";
import { formatCompactNumber, formatNumber } from "@/lib/utils";
import type { Pair, UserSegment } from "@/types";

const getPeriodLabel = (range: DateRangeValue): string => {
  const labels: Record<string, string> = {
    today: "сегодня",
    yesterday: "вчера",
    week: "за неделю",
    month: "за месяц",
    quarter: "за квартал",
    year: "за год",
    custom: "за период",
  };
  return labels[range.preset ?? ""] ?? "за период";
};

const statusToneByKey: Record<string, "emerald" | "sky" | "amber" | "red" | "violet" | "default"> = {
  COMPLETED: "emerald",
  CONFIRMED: "emerald",
  CREATED: "sky",
  RESOLVED: "sky",
  PENDING: "amber",
  IN_PROGRESS: "amber",
  CANCELED: "red",
  CANCELLED: "red",
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
        const cls = {
          emerald: "pill-emerald",
          amber: "pill-amber",
          red: "pill-red",
          sky: "pill-sky",
          violet: "pill-violet",
          default: "pill-slate",
        }[tone];
        return (
          <span key={k} className={cls}>
            {k.replace(/_/g, " ").toLowerCase()} · <span className="tabular-nums">{formatCompactNumber(v)}</span>
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
  const [segment, setSegment] = useState<UserSegment>("real");
  const params = rangeToParams(range);
  const periodLabel = getPeriodLabel(range);

  const { data: superAdmin } = useGetSuperAdminProfile();
  const { data: stats, isLoading, isError, refetch } = useGetAdminStats(params);
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersStats(params);
  const { data: tripsData, isLoading: isTripsLoading } = useGetTripsStats(params);
  const { data: walletData, isLoading: isWalletLoading } = useGetWalletStats(params);
  const { data: dauMau, isLoading: isDauMauLoading } = useGetDauMau();
  const { data: searchesStats, isLoading: isSearchesLoading } = useGetSearchesStats(params);

  const pendingReports = stats?.reports?.byStatusInRange?.PENDING ?? 0;
  const pendingApplications = stats?.applications?.pendingCounts?.totalInRange ?? 0;
  const activeTripsSnapshot = stats?.activeTrips ?? stats?.trips?.active;
  const inProgressTrips = activeTripsSnapshot?.counts?.inProgress ?? stats?.trips?.byStatusInRange?.IN_PROGRESS ?? 0;

  const topDrivers = toUserTopList(usersData?.top?.driversByTrips, "trips_count");
  const topPassengers = toUserTopList(usersData?.top?.passengersByBookings, "bookings_count");
  const topRoutes = toRoutesList(tripsData?.top?.routes);
  const topDepCities = toCitiesList(tripsData?.top?.departureCities, "from_city");
  const topSearchRoutes = toRoutesList(searchesStats?.top?.routes);
  const topWallets = toUserTopList(walletData?.top?.usersByBalance, "balance");

  // DAU/MAU — prefer the segmented bySegment block, fall back to legacy fields.
  const dauMauSegment = dauMau?.bySegment?.[segment === "guests" ? "guests" : segment];
  const dauValue = dauMauSegment?.dau?.count ?? dauMau?.dau?.total;
  const mauValue = dauMauSegment?.mau?.count ?? dauMau?.mau?.total;
  const stickiness = dauMauSegment?.stickiness ?? dauMau?.stickiness;
  const dauDrivers = dauMauSegment?.dau?.drivers ?? dauMau?.dau?.byRole?.drivers;
  const dauPassengers = dauMauSegment?.dau?.passengers ?? dauMau?.dau?.byRole?.passengers;

  const segmentBlock = pickSegmentBlock(stats?.segments, segment);
  const usersPair: Pair | undefined = segmentBlock
    ? { total: segmentBlock.total, totalInRange: segmentBlock.totalInRange }
    : undefined;
  const driversPair = segment === "guests" ? undefined : segmentBlock?.drivers;
  const passengersPair = segment === "guests" ? undefined : segmentBlock?.passengers;
  const guestsPair = stats?.guests?.counts;

  const balanceTotal = stats?.wallet?.balance?.total;
  const verifiedAppsPair = stats?.applications?.verifiedCounts;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Сегмент пользователей</p>
        <SegmentTabs value={segment} onChange={setSegment} />
      </div>

      {/* ── ROW 1: Real-time / fixed metrics (no totalInRange — снапшоты) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="В пути сейчас"
          value={inProgressTrips}
          icon={Activity}
          tone={inProgressTrips > 0 ? "emerald" : "default"}
          highlight={inProgressTrips > 0}
          subtext="Активные поездки"
          loading={isLoading}
        />
        <StatCard
          title="Баланс кошельков"
          value={balanceTotal != null ? `${formatNumber(balanceTotal)} UZS` : undefined}
          icon={Wallet}
          tone="emerald"
          subtext="На руках у пользователей"
          loading={isLoading}
        />
        <StatPairCard
          title="Заявки водителей"
          pair={stats?.applications?.pendingCounts}
          icon={ShieldAlert}
          tone={pendingApplications > 0 ? "amber" : "default"}
          highlight={pendingApplications > 0}
          loading={isLoading}
        />
        <StatCard
          title="Заявок одобрено"
          value={verifiedAppsPair?.totalInRange}
          subtext={`всего: ${formatCompactNumber(verifiedAppsPair?.total ?? 0)}`}
          icon={ShieldAlert}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      {/* ── Active trips snapshot ── */}
      {activeTripsSnapshot && (
        <StatsSection
          title="Сейчас на платформе"
          description="Снимок активных поездок · обновляется вместе с остальной сводкой"
        >
          <ActiveTripsSnapshotBlock snapshot={activeTripsSnapshot} loading={isLoading} variant="compact" />
          <div className="mt-3">
            <QuickLink href="/super-admin/stats/active-trips" label="Открыть страницу активных" />
          </div>
        </StatsSection>
      )}

      {/* ── ROW 2: Пользователи (по сегменту) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPairCard title="Пользователи" pair={usersPair} icon={Users} tone="emerald" loading={isLoading} />
        <StatPairCard title="Пассажиры" pair={passengersPair} icon={Users} tone="sky" loading={isLoading} />
        <StatPairCard title="Водители" pair={driversPair} icon={UserCheck} tone="sky" loading={isLoading} />
        <StatPairCard title="Гости (без акк.)" pair={guestsPair} icon={Users} tone="violet" loading={isLoading} />
      </div>

      {/* ── ROW 3: Поездки / Бронирования / Жалобы (range-agnostic of segment) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPairCard title="Поездок" pair={stats?.trips?.counts} icon={CarFront} tone="sky" loading={isLoading} />
        <StatPairCard
          title="Завершено"
          pair={
            stats?.trips
              ? {
                  total: stats.trips.byStatusTotals?.COMPLETED?.total ?? 0,
                  totalInRange: stats.trips.byStatusTotals?.COMPLETED?.totalInRange ?? 0,
                }
              : undefined
          }
          icon={CarFront}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Бронирований"
          pair={stats?.bookings?.counts}
          icon={Ticket}
          tone="sky"
          loading={isLoading}
        />
        <StatPairCard
          title="Жалоб"
          pair={stats?.reports?.counts}
          icon={Flag}
          tone={pendingReports > 0 ? "red" : "default"}
          highlight={pendingReports > 0}
          loading={isLoading}
        />
      </div>

      {/* ── Rates (4 cards) ── */}
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

      {/* ── ROW 4: Финансы — по всем потокам, total + totalInRange ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPairCard
          title="Пополнения · сумма"
          pair={stats?.wallet?.topUps}
          money
          icon={Wallet}
          tone="emerald"
          loading={isLoading || isWalletLoading}
        />
        <StatPairCard
          title="Платежи · сумма"
          pair={stats?.wallet?.payments}
          money
          icon={Banknote}
          tone="sky"
          loading={isLoading || isWalletLoading}
        />
        <StatPairCard
          title="Возвраты · сумма"
          pair={stats?.wallet?.refunds}
          money
          icon={CircleDollarSign}
          tone="amber"
          loading={isLoading || isWalletLoading}
        />
        <StatCard
          title="Забанено"
          value={stats?.users?.flags?.banned?.totalInRange}
          subtext={`всего: ${formatCompactNumber(stats?.users?.flags?.banned?.total ?? 0)}`}
          icon={UserX}
          tone="red"
          loading={isLoading}
        />
      </div>

      {/* ── ROW 5: DAU / MAU / Stickiness (segmented) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="DAU"
          value={dauValue}
          icon={Activity}
          tone="emerald"
          subtext={`Сегмент: ${segment === "guests" ? "гости" : segment === "real" ? "реальные" : segment === "bots" ? "боты" : "все"}`}
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="MAU"
          value={mauValue}
          icon={Users}
          tone="sky"
          subtext="Активных за 30 дней"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Stickiness"
          value={stickiness != null ? `${(Number(stickiness) * 100).toFixed(1)}%` : undefined}
          icon={Zap}
          tone="violet"
          subtext="DAU ÷ MAU — удержание"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Водителей в DAU"
          value={dauDrivers}
          icon={UserCheck}
          tone="amber"
          subtext={`Пассажиров: ${formatCompactNumber(dauPassengers ?? 0)}`}
          loading={isDauMauLoading || isLoading}
        />
      </div>

      {/* ── Status chips ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Поездки по статусам · в периоде
            </p>
            <QuickLink href="/super-admin/stats/trips" label="Подробнее" />
          </div>
          <StatusChips data={stats?.trips?.byStatusInRange} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Бронирования · в периоде
            </p>
            <QuickLink href="/super-admin/bookings" label="Подробнее" />
          </div>
          <StatusChips data={stats?.bookings?.byStatusInRange} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Жалобы · в периоде</p>
            <QuickLink href="/super-admin/stats/reports" label="Подробнее" />
          </div>
          <StatusChips data={stats?.reports?.byStatusInRange} />
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Регистрации"
          total={stats?.users?.counts?.totalInRange?.real}
          totalSuffix={periodLabel}
          loading={isLoading}
          series={[
            { name: "Реальные", data: stats?.users?.graph ?? [], color: "var(--chart-1)" },
            { name: "Все сегменты", data: stats?.users?.graphAll ?? [], color: "var(--chart-2)" },
          ]}
        />
        <OverviewChart
          title="Поездки"
          total={stats?.trips?.counts?.totalInRange}
          totalSuffix={`создано ${periodLabel}`}
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
          total={stats?.bookings?.counts?.totalInRange}
          totalSuffix={periodLabel}
          loading={isLoading}
          series={[{ name: "Бронирования", data: stats?.bookings?.graph ?? [], color: "var(--chart-3)" }]}
        />
        <OverviewChart
          title="Пополнения кошельков"
          total={stats?.wallet?.topUps?.totalInRange}
          totalSuffix="UZS"
          loading={isLoading || isWalletLoading}
          series={[
            { name: "Сумма", data: walletData?.topUps?.graph ?? stats?.wallet?.graph ?? [], color: "var(--chart-1)" },
          ]}
        />
      </div>

      {/* ── Top lists ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ маршрутов (опубликованные трипы)">
          <TopList data={topRoutes} loading={isTripsLoading} limit={10} />
        </StatsSection>
        <StatsSection title="Топ маршрутов поиска">
          <div className="flex flex-col gap-2">
            <TopList data={topSearchRoutes} loading={isSearchesLoading} limit={10} />
            <Link
              href="/super-admin/searches"
              className="inline-flex items-center gap-1 self-end text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Все маршруты поиска <ChevronRight className="size-3" />
            </Link>
          </div>
        </StatsSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ городов отправления">
          <TopList data={topDepCities} loading={isTripsLoading} limit={10} />
        </StatsSection>
        {(searchesStats?.unmatched?.routes?.length ?? 0) > 0 && (
          <StatsSection title="Спрос без предложения" description="Ищут маршрут, но активных трипов нет">
            <ul className="space-y-1.5">
              {searchesStats!.unmatched!.routes!.slice(0, 8).map((r: any, i: number) => (
                <li
                  key={`${r.from_city}-${r.to_city}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-amber-50/40 px-3 py-1.5 text-sm dark:bg-amber-900/10"
                >
                  <span className="font-medium">
                    {r.from_city} → {r.to_city}
                  </span>
                  <span className="text-amber-700 tabular-nums dark:text-amber-300">
                    {formatCompactNumber(Number(r.searches_count))}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/super-admin/searches"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Все маршруты <ChevronRight className="size-3" />
            </Link>
          </StatsSection>
        )}
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

      {/* ── Quick links ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { href: "/super-admin/bookings", title: "Бронирования", icon: Ticket, tone: "sky" as const },
          { href: "/super-admin/searches", title: "Маршруты поиска", icon: Search, tone: "emerald" as const },
          { href: "/super-admin/stats/users", title: "Аналитика пользователей", icon: Users, tone: "emerald" as const },
          {
            href: "/super-admin/stats/engagement",
            title: "Engagement / Funnel",
            icon: Activity,
            tone: "violet" as const,
          },
          { href: "/super-admin/stats/wallet", title: "Финансовая аналитика", icon: Banknote, tone: "sky" as const },
          { href: "/super-admin/stats/dau-mau", title: "DAU / MAU", icon: Zap, tone: "amber" as const },
        ].map((q) => {
          const Icon = q.icon;
          const tone = {
            emerald: "text-emerald-500 bg-emerald-500/10",
            sky: "text-sky-500 bg-sky-500/10",
            amber: "text-amber-500 bg-amber-500/10",
            violet: "text-violet-500 bg-violet-500/10",
          }[q.tone];
          return (
            <Link key={q.href} href={q.href} className="stats-card group flex items-center gap-3 p-4">
              <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <span className="flex-1 font-medium">{q.title}</span>
              <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 transition group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
