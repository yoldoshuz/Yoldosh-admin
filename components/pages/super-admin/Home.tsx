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
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wallet,
  Zap,
} from "lucide-react";

import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList, toRoutesList, toUserTopList } from "@/components/shared/stats/normalize";
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
  const { data: dauMau, isLoading: isDauMauLoading } = useGetDauMau();
  const { data: searchesStats, isLoading: isSearchesLoading } = useGetSearchesStats(params);

  const pendingReports = stats?.reports?.byStatus?.PENDING ?? 0;
  const pendingApplications = stats?.applications?.pending ?? 0;
  const inProgressTrips = stats?.trips?.byStatus?.IN_PROGRESS ?? 0;

  // Derived: drivers with >= 1 trip from users-stats top list
  const activeDriversCount = (usersData?.top?.driversByTrips ?? []).length;
  const topDrivers = toUserTopList(usersData?.top?.driversByTrips, "trips_count");
  const topPassengers = toUserTopList(usersData?.top?.passengersByBookings, "bookings_count");

  const topRoutes = toRoutesList(tripsData?.top?.routes);
  const topDepCities = toCitiesList(tripsData?.top?.departureCities, "from_city");
  const topSearchRoutes = toRoutesList(searchesStats?.top?.routes);

  const topWallets = toUserTopList(walletData?.top?.usersByBalance, "balance");

  // DAU/MAU with new prop (admin/stats/dau-mau or stats.users.dauMau fallback)
  const dauMauBlock = dauMau ?? stats?.users?.dauMau;
  const segmentation = stats?.users?.bySource?.byRoleAndSource;
  const newBySource = stats?.users?.newBySource?.bySource;

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
        <Link href="/super-admin/bookings" className="contents">
          <StatCard
            title="Бронирований"
            value={stats?.bookings?.total}
            icon={Ticket}
            tone="sky"
            loading={isLoading}
            subtext="Перейти к списку →"
            className="cursor-pointer transition hover:ring-2 hover:ring-sky-500/30"
          />
        </Link>
      </div>

      {/* DAU / MAU / Stickiness */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="DAU"
          value={dauMauBlock?.dau?.total}
          icon={Activity}
          tone="emerald"
          subtext="Активных за 24 ч"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="MAU"
          value={dauMauBlock?.mau?.total}
          icon={Users}
          tone="sky"
          subtext="Активных за 30 дней"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Stickiness"
          value={dauMauBlock?.stickiness != null ? `${(Number(dauMauBlock.stickiness) * 100).toFixed(1)}%` : undefined}
          icon={Zap}
          tone="violet"
          subtext="DAU / MAU"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Активных водителей (DAU)"
          value={dauMauBlock?.dau?.byRole?.drivers}
          icon={UserCheck}
          tone="amber"
          subtext={`Пассажиров: ${formatCompactNumber(dauMauBlock?.dau?.byRole?.passengers ?? 0)}`}
          loading={isDauMauLoading || isLoading}
        />
      </div>

      {/* Segmentation by registration_source */}
      {segmentation && (
        <StatsSection
          title="Сегментация: роль × источник регистрации"
          description="Откуда пришли пользователи: сами (через приложение), импорт из telegram-бота, reg-бот"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {(["drivers", "passengers"] as const).map((role) => {
              const data = segmentation[role];
              const total = (data?.self ?? 0) + (data?.botImported ?? 0) + (data?.regBot ?? 0) || 1;
              const items = [
                { label: "Сами", value: data?.self ?? 0, color: "from-emerald-500 to-teal-500" },
                { label: "Бот-импорт", value: data?.botImported ?? 0, color: "from-violet-500 to-purple-500" },
                { label: "Reg-бот", value: data?.regBot ?? 0, color: "from-sky-500 to-blue-500" },
              ];
              return (
                <div key={role} className="bg-card rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{role === "drivers" ? "Водители" : "Пассажиры"}</p>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatCompactNumber(total === 1 ? 0 : total)}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li key={it.label} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span>{it.label}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {formatCompactNumber(it.value)}{" "}
                            <span className="text-[11px]">({Math.round((it.value / total) * 100)}%)</span>
                          </span>
                        </div>
                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${it.color}`}
                            style={{ width: `${Math.max(2, (it.value / total) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {newBySource && (
                    <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
                      Новых за период: сами{" "}
                      <span className="text-foreground tabular-nums">{formatCompactNumber(newBySource.self ?? 0)}</span>
                      , бот-импорт{" "}
                      <span className="text-foreground tabular-nums">
                        {formatCompactNumber(newBySource.botImported ?? 0)}
                      </span>
                      , reg-бот{" "}
                      <span className="text-foreground tabular-nums">
                        {formatCompactNumber(newBySource.regBot ?? 0)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </StatsSection>
      )}

      {/* Status distribution chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Поездки по статусам</p>
            <QuickLink href="/super-admin/stats/trips" label="Подробнее" />
          </div>
          <StatusChips data={stats?.trips?.byStatus} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Бронирования</p>
            <QuickLink href="/super-admin/bookings" label="Подробнее" />
          </div>
          <StatusChips data={stats?.bookings?.byStatus} />
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Жалобы</p>
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

      {/* Top routes — published vs searched */}
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
              Все маршруты поиска
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </StatsSection>
      </div>

      {/* Cities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ городов отправления">
          <TopList data={topDepCities} loading={isTripsLoading} limit={10} />
        </StatsSection>
        {searchesStats?.unmatched?.routes?.length > 0 && (
          <StatsSection title="Спрос без предложения" description="Ищут, но активных трипов нет">
            <ul className="space-y-1.5">
              {searchesStats.unmatched.routes.slice(0, 8).map((r: any, i: number) => (
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
              Все маршруты
              <ChevronRight className="size-3" />
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

      {/* Quick deep-link cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { href: "/super-admin/bookings", title: "Бронирования", icon: Ticket, tone: "sky" as const },
          { href: "/super-admin/searches", title: "Маршруты поиска", icon: Search, tone: "emerald" as const },
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
