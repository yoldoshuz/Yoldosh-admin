"use client";

import { useState } from "react";
import {
  Activity,
  CarFront,
  CheckCircle2,
  Repeat,
  Search,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { StatCard } from "@/components/shared/StatCard";
import { RateCard } from "@/components/shared/stats/RateCard";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEngagementStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";

type FunnelStep = {
  label: string;
  value: number;
  conversionFromPrev: number | null;
  conversionFromTop: number | null;
};

const buildFunnel = (cohort: any | undefined): FunnelStep[] => {
  if (!cohort) return [];
  const signups = Number(cohort.signups ?? 0);
  const steps: { label: string; key: string; pctFromPrevKey: keyof any | null }[] = [
    { label: "Регистрация", key: "signups", pctFromPrevKey: null },
    { label: "Сделал поиск", key: "withSearch", pctFromPrevKey: null },
    { label: "Создал бронь", key: "withBooking", pctFromPrevKey: null },
    { label: "Бронь подтверждена", key: "withConfirmedBooking", pctFromPrevKey: null },
    { label: "Завершил поездку", key: "withCompletedTrip", pctFromPrevKey: null },
  ];
  let prev = signups;
  return steps.map((s) => {
    const value = Number(cohort[s.key] ?? 0);
    const conversionFromPrev = prev > 0 ? value / prev : null;
    const conversionFromTop = signups > 0 ? value / signups : null;
    prev = value;
    return { label: s.label, value, conversionFromPrev, conversionFromTop };
  });
};

const FunnelBars = ({ steps, loading }: { steps: FunnelStep[]; loading?: boolean }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }
  if (!steps.length) return <p className="text-muted-foreground text-sm">Нет данных</p>;
  const max = steps[0]?.value || 1;
  return (
    <ul className="space-y-2">
      {steps.map((s, i) => {
        const pctFromTop = s.conversionFromTop != null ? `${(s.conversionFromTop * 100).toFixed(1)}%` : "—";
        const pctFromPrev = s.conversionFromPrev != null ? `${(s.conversionFromPrev * 100).toFixed(1)}%` : "—";
        return (
          <li key={s.label} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
                {s.label}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                <span className="text-foreground font-semibold">{formatCompactNumber(s.value)}</span>
                {i > 0 && (
                  <>
                    {" "}
                    · от шага {i}: <span className="tabular-nums">{pctFromPrev}</span> · от регистрации:{" "}
                    <span className="tabular-nums">{pctFromTop}</span>
                  </>
                )}
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${Math.max(2, (s.value / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const formatRate = (v: number | null | undefined) => {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return `${(Number(v) * 100).toFixed(1)}%`;
};

const formatDays = (v: number | null | undefined) => {
  if (v == null) return "—";
  return `${Number(v).toFixed(1)} дн`;
};

export const EngagementStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetEngagementStats(rangeToParams(range));

  const funnelCohort = buildFunnel(data?.funnel?.cohort);
  const funnelAllTime = buildFunnel(data?.funnel?.allTime);

  const drivers = data?.drivers;
  const repeatPassengers = data?.repeatPassengers;
  const timing = data?.timing;

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Engagement & Funnel"
        subtitle="Только реальные пользователи · scope = real-users-only"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPairCard
          title="Регистраций (real)"
          pair={data?.signups}
          icon={UserPlus}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Поисков"
          pair={
            data?.conversion?.raw
              ? { total: data.conversion.raw.searchesInRange, totalInRange: data.conversion.raw.searchesInRange }
              : undefined
          }
          icon={Search}
          tone="sky"
          loading={isLoading}
        />
        <StatPairCard
          title="Бронирований"
          pair={
            data?.conversion?.raw
              ? { total: data.conversion.raw.bookingsInRange, totalInRange: data.conversion.raw.bookingsInRange }
              : undefined
          }
          icon={Ticket}
          tone="violet"
          loading={isLoading}
        />
        <StatPairCard
          title="Завершённых поездок"
          pair={
            data?.conversion?.raw
              ? {
                  total: data.conversion.raw.completedTripsInRange,
                  totalInRange: data.conversion.raw.completedTripsInRange,
                }
              : undefined
          }
          icon={CarFront}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      {/* Funnel — 2 views */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection
          title="Воронка · когорта в периоде"
          description="Юзеры, зарегавшиеся в этом диапазоне, и их последующие действия"
        >
          <FunnelBars steps={funnelCohort} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Воронка · за всё время" description="Все real-юзеры платформы">
          <FunnelBars steps={funnelAllTime} loading={isLoading} />
        </StatsSection>
      </div>

      {/* Conversion rates in range */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <RateCard
          title="Поиск → Бронь"
          inRange={data?.conversion?.searchToBookingRateInRange}
          allTime={data?.funnel?.cohort?.conversion?.searchToBooking}
          tone="sky"
          loading={isLoading}
        />
        <RateCard
          title="Бронь → Подтверждение"
          inRange={data?.conversion?.bookingToConfirmedRateInRange}
          allTime={data?.funnel?.cohort?.conversion?.bookingToConfirmed}
          tone="emerald"
          loading={isLoading}
        />
        <RateCard
          title="Бронь → Поездка"
          inRange={data?.conversion?.bookingToCompletedTripRateInRange}
          allTime={null}
          tone="violet"
          loading={isLoading}
        />
      </div>

      {/* Drivers metrics */}
      <StatsSection title="Водители (real)" description="Активация и удержание реальных водителей за всё время">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Всего" value={drivers?.totalReal} icon={Users} tone="emerald" loading={isLoading} />
          <StatCard
            title="Совершили поездку"
            value={drivers?.withAnyTrip}
            icon={CheckCircle2}
            tone="sky"
            loading={isLoading}
          />
          <StatCard
            title="≥ 10 поездок"
            value={drivers?.with10PlusTrips}
            icon={TrendingUp}
            tone="violet"
            loading={isLoading}
          />
          <StatCard
            title="Активны 30 дн."
            value={drivers?.activeLast30Days}
            icon={Activity}
            tone="amber"
            loading={isLoading}
          />
          <StatCard
            title="Zero-trip rate"
            value={formatRate(drivers?.zeroTripRate)}
            icon={TrendingDown}
            tone="red"
            subtext="Зарегались, но не возили"
            loading={isLoading}
          />
          <StatCard
            title="Activation rate"
            value={formatRate(drivers?.activationRate)}
            icon={TrendingUp}
            tone="emerald"
            subtext="Совершили хотя бы 1 поездку"
            loading={isLoading}
          />
        </div>
      </StatsSection>

      {/* Repeat passengers */}
      <StatsSection title="Повторные пассажиры (real)" description="Пассажиры с несколькими подтверждёнными бронями">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <StatCard
            title="С 2+ подтверждёнными"
            value={repeatPassengers?.with2PlusConfirmed}
            icon={Repeat}
            tone="emerald"
            loading={isLoading}
          />
          <StatCard
            title="С 5+ подтверждёнными"
            value={repeatPassengers?.with5PlusConfirmed}
            icon={Repeat}
            tone="violet"
            loading={isLoading}
          />
        </div>
      </StatsSection>

      {/* Activity averages */}
      <StatsSection title="Активность · среднее на пользователя">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPairCard
            title="Поисков / юзер"
            pair={data?.activity?.avgSearchesPerUser}
            icon={Search}
            tone="sky"
            loading={isLoading}
          />
          <StatPairCard
            title="Броней / пассажир"
            pair={data?.activity?.avgBookingsPerPassenger}
            icon={Ticket}
            tone="violet"
            loading={isLoading}
          />
          <StatPairCard
            title="Поездок / водитель"
            pair={data?.activity?.avgTripsPerDriver}
            icon={CarFront}
            tone="emerald"
            loading={isLoading}
          />
        </div>
      </StatsSection>

      {/* Timing */}
      <StatsSection title="Сколько идут от регистрации до действия">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Регистрация → 1-я бронь"
            value={formatDays(timing?.daysFromSignupToFirstBooking?.avg)}
            subtext={`медиана: ${formatDays(timing?.daysFromSignupToFirstBooking?.median)}`}
            tone="emerald"
            loading={isLoading}
          />
          <StatCard
            title="Регистрация → 1-я поездка"
            value={formatDays(timing?.daysFromSignupToFirstTrip?.avg)}
            subtext={`медиана: ${formatDays(timing?.daysFromSignupToFirstTrip?.median)}`}
            tone="sky"
            loading={isLoading}
          />
        </div>
      </StatsSection>
    </div>
  );
};
