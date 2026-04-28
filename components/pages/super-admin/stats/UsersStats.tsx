"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff, UserPlus, Users, UserX } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toHourDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetUsersStats } from "@/hooks/adminHooks";

export const UsersStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetUsersStats(rangeToParams(range));

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
