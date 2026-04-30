"use client";

import { useState } from "react";
import { Activity, ShieldCheck, ShieldOff, UserPlus, Users, UserX, Zap } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toHourDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetDauMau, useGetUsersStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";

const SourceBars = ({ data }: { data?: { self?: number; botImported?: number; regBot?: number } }) => {
  if (!data) return <p className="text-muted-foreground text-sm">Нет данных</p>;
  const items = [
    { label: "Сами", value: data.self ?? 0, color: "from-emerald-500 to-teal-500" },
    { label: "Бот-импорт", value: data.botImported ?? 0, color: "from-violet-500 to-purple-500" },
    { label: "Reg-бот", value: data.regBot ?? 0, color: "from-sky-500 to-blue-500" },
  ];
  const total = items.reduce((s, it) => s + it.value, 0) || 1;
  return (
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
  );
};

export const UsersStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetUsersStats(rangeToParams(range));
  const { data: dauMau, isLoading: isDauMauLoading } = useGetDauMau();

  const distribution = data?.distribution ?? {};
  const flags = data?.flags ?? {};
  const registrations = data?.registrations ?? {};
  const top = data?.top ?? {};

  const byRole = toDistribution(distribution.byRole, ["role"]);
  const byGender = toDistribution(distribution.byGender, ["gender"]);
  const byLanguage = toDistribution(distribution.byLanguage, ["preferred_language", "language"]);
  const bySource = toDistribution(distribution.bySource, ["registration_source", "source"]);
  const byHour = toHourDistribution(registrations.byHourOfDay);

  const total = byRole.reduce((s, x) => s + x.count, 0);
  const drivers = byRole.find((x) => /driver/i.test(x.label))?.count ?? 0;
  const passengers = byRole.find((x) => /passenger/i.test(x.label))?.count ?? 0;

  const topDrivers = toUserTopList(top.driversByTrips, "trips_count");
  const topPassengers = toUserTopList(top.passengersByBookings, "bookings_count");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика пользователей"
        subtitle="Сегментация и динамика регистраций"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Всего" value={total} icon={Users} loading={isLoading} />
        <StatCard title="Водители" value={drivers} icon={Users} tone="sky" loading={isLoading} />
        <StatCard title="Пассажиры" value={passengers} icon={Users} tone="violet" loading={isLoading} />
        <StatCard title="Верифицировано" value={flags.verified} icon={ShieldCheck} tone="emerald" loading={isLoading} />
        <StatCard title="Забанено" value={flags.banned} icon={UserX} tone="red" loading={isLoading} />
        <StatCard title="С промокодом" value={flags.withPromocode} icon={UserPlus} tone="amber" loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          title="Паспорт верифицирован"
          value={flags.passportVerified}
          icon={ShieldCheck}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Кошелёк заблокирован"
          value={flags.walletBlocked}
          icon={ShieldOff}
          tone="red"
          loading={isLoading}
        />
      </div>

      {/* DAU / MAU / Stickiness */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="DAU"
          value={(dauMau?.dau?.total ?? data?.dauMau?.dau?.total) as number | undefined}
          icon={Activity}
          tone="emerald"
          subtext="Активных за 24 ч"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="MAU"
          value={(dauMau?.mau?.total ?? data?.dauMau?.mau?.total) as number | undefined}
          icon={Users}
          tone="sky"
          subtext="Активных за 30 дней"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Stickiness"
          value={
            (dauMau?.stickiness ?? data?.dauMau?.stickiness) != null
              ? `${(Number(dauMau?.stickiness ?? data?.dauMau?.stickiness) * 100).toFixed(1)}%`
              : undefined
          }
          icon={Zap}
          tone="violet"
          subtext="DAU / MAU"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Активные водители (DAU)"
          value={(dauMau?.dau?.byRole?.drivers ?? data?.dauMau?.dau?.byRole?.drivers) as number | undefined}
          icon={Users}
          tone="amber"
          subtext={`Пассажиров: ${formatCompactNumber((dauMau?.dau?.byRole?.passengers ?? data?.dauMau?.dau?.byRole?.passengers ?? 0) as number)}`}
          loading={isDauMauLoading || isLoading}
        />
      </div>

      {/* Segmentation: all-time vs new-in-range */}
      {(data?.segmentation || data?.dauMau) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StatsSection title="Сегментация — все пользователи">
            <SourceBars data={data?.segmentation?.allTime?.bySource} />
          </StatsSection>
          <StatsSection title="Сегментация — новые за период">
            <SourceBars data={data?.segmentation?.newInRange?.bySource} />
          </StatsSection>
        </div>
      )}

      <OverviewChart
        title="Регистрации"
        loading={isLoading}
        series={[{ name: "Регистраций", data: registrations.graph ?? [], color: "var(--chart-1)" }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="По ролям">
          <DistributionList data={byRole} loading={isLoading} />
        </StatsSection>
        <StatsSection title="По полу">
          <DistributionList data={byGender} loading={isLoading} />
        </StatsSection>
        <StatsSection title="По языку">
          <DistributionList data={byLanguage} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Источник регистрации">
          <DistributionList data={bySource} loading={isLoading} />
        </StatsSection>
      </div>

      <StatsSection title="Регистрации по часу суток" description="Когда пользователи чаще всего регистрируются">
        <DistributionList data={byHour} loading={isLoading} />
      </StatsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ водителей по поездкам">
          <TopList data={topDrivers} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Топ пассажиров по бронированиям">
          <TopList data={topPassengers} loading={isLoading} />
        </StatsSection>
      </div>
    </div>
  );
};
