"use client";

import { useState } from "react";
import { Activity, ShieldCheck, ShieldOff, UserPlus, Users, UserX, Zap } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toHourDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { pickSegmentPair } from "@/components/shared/stats/segments";
import { SegmentTabs } from "@/components/shared/stats/SegmentTabs";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetDauMau, useGetUsersStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";
import type { Pair, UserSegment } from "@/types";

export const UsersStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const [segment, setSegment] = useState<UserSegment>("real");
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

  // Segment-aware pairs
  const usersPair: Pair | undefined =
    segment === "guests" ? data?.guestsCounts : pickSegmentPair(data?.counts, segment);
  const driversPair = segment === "guests" ? undefined : pickSegmentPair(data?.driversCounts, segment);
  const passengersPair = segment === "guests" ? undefined : pickSegmentPair(data?.passengersCounts, segment);

  // Flag pairs are real-only on the backend.
  const verifiedPair = flags.verifiedCounts as Pair | undefined;
  const passportVerifiedPair = flags.passportVerifiedCounts as Pair | undefined;
  const bannedPair = flags.bannedCounts as Pair | undefined;
  const walletBlockedPair = flags.walletBlockedCounts as Pair | undefined;
  const withPromocodePair = flags.withPromocodeCounts as Pair | undefined;

  const topDrivers = toUserTopList(top.driversByTrips, "trips_count");
  const topPassengers = toUserTopList(top.passengersByBookings, "bookings_count");

  // DAU/MAU segment row
  const dauSeg = dauMau?.bySegment?.[segment === "guests" ? "guests" : segment];
  const dauCount = dauSeg?.dau?.count ?? dauMau?.dau?.total;
  const mauCount = dauSeg?.mau?.count ?? dauMau?.mau?.total;
  const stickiness = dauSeg?.stickiness ?? dauMau?.stickiness;
  const dauDrivers = dauSeg?.dau?.drivers ?? dauMau?.dau?.byRole?.drivers;
  const dauPassengers = dauSeg?.dau?.passengers ?? dauMau?.dau?.byRole?.passengers;

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика пользователей"
        subtitle="Сегментация и динамика регистраций"
        range={range}
        onRangeChange={setRange}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Сегмент</p>
        <SegmentTabs value={segment} onChange={setSegment} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPairCard title="Всего" pair={usersPair} icon={Users} loading={isLoading} />
        <StatPairCard title="Водители" pair={driversPair} icon={Users} tone="sky" loading={isLoading} />
        <StatPairCard title="Пассажиры" pair={passengersPair} icon={Users} tone="violet" loading={isLoading} />
        <StatPairCard
          title="Верифицировано"
          pair={verifiedPair}
          icon={ShieldCheck}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard title="Забанено" pair={bannedPair} icon={UserX} tone="red" loading={isLoading} />
        <StatPairCard title="С промокодом" pair={withPromocodePair} icon={UserPlus} tone="amber" loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatPairCard
          title="Паспорт верифицирован"
          pair={passportVerifiedPair}
          icon={ShieldCheck}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Кошелёк заблокирован"
          pair={walletBlockedPair}
          icon={ShieldOff}
          tone="red"
          loading={isLoading}
        />
        <StatPairCard
          title="Гостей (без акк.)"
          pair={data?.guestsCounts}
          icon={Users}
          tone="violet"
          loading={isLoading}
        />
      </div>

      {/* DAU / MAU / Stickiness — per segment */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="DAU"
          value={dauCount as number | undefined}
          icon={Activity}
          tone="emerald"
          subtext="Активных за 24 ч"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="MAU"
          value={mauCount as number | undefined}
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
          subtext="DAU / MAU"
          loading={isDauMauLoading || isLoading}
        />
        <StatCard
          title="Активные водители (DAU)"
          value={dauDrivers as number | undefined}
          icon={Users}
          tone="amber"
          subtext={`Пассажиров: ${formatCompactNumber((dauPassengers ?? 0) as number)}`}
          loading={isDauMauLoading || isLoading}
        />
      </div>

      <OverviewChart
        title="Регистрации"
        loading={isLoading}
        series={[
          { name: "Реальные (real)", data: registrations.graph ?? [], color: "var(--chart-1)" },
          { name: "Все сегменты", data: registrations.graphAll ?? [], color: "var(--chart-2)" },
        ]}
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
