"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Clock, CreditCard, Ticket, X } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { RateCard } from "@/components/shared/stats/RateCard";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetBookingsStats } from "@/hooks/adminHooks";
import { formatNumber } from "@/lib/utils";

const BOOKING_STATUSES = ["CONFIRMED", "PENDING", "CANCELLED", "REJECTED", "FAILED"] as const;
const STATUS_LABEL: Record<(typeof BOOKING_STATUSES)[number], string> = {
  CONFIRMED: "Подтверждено",
  PENDING: "В ожидании",
  CANCELLED: "Отменено",
  REJECTED: "Отклонено",
  FAILED: "Сбой",
};
const STATUS_ICON: Record<(typeof BOOKING_STATUSES)[number], typeof CheckCircle2> = {
  CONFIRMED: CheckCircle2,
  PENDING: Clock,
  CANCELLED: Ban,
  REJECTED: X,
  FAILED: X,
};
const STATUS_TONE: Record<(typeof BOOKING_STATUSES)[number], "emerald" | "amber" | "red"> = {
  CONFIRMED: "emerald",
  PENDING: "amber",
  CANCELLED: "red",
  REJECTED: "red",
  FAILED: "red",
};

export const BookingsStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetBookingsStats(rangeToParams(range));

  const financials = data?.financials ?? {};
  const ts = data?.timeSeries ?? {};
  const bySource = toDistribution(data?.segmentation?.bySource, ["registration_source", "source"]);
  const bySourceAllTime = toDistribution(data?.segmentation?.bySourceAllTime, ["registration_source", "source"]);
  const topPassengers = toUserTopList(data?.top?.passengersByBookings, "bookings_count");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика бронирований"
        subtitle="Статусы, конверсии и финансы"
        range={range}
        onRangeChange={setRange}
      />

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatPairCard title="Всего бронирований" pair={data?.counts} icon={Ticket} loading={isLoading} />
        {BOOKING_STATUSES.map((s) => {
          const Icon = STATUS_ICON[s];
          return (
            <StatPairCard
              key={s}
              title={STATUS_LABEL[s]}
              pair={data?.byStatusTotals?.[s]}
              icon={Icon}
              tone={STATUS_TONE[s]}
              loading={isLoading}
            />
          );
        })}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <RateCard
          title="Подтверждение"
          inRange={data?.rates?.confirmationRateInRange}
          allTime={data?.rates?.confirmationRateAllTime}
          tone="emerald"
          loading={isLoading}
        />
        <RateCard
          title="Отмена"
          inRange={data?.rates?.cancellationRateInRange}
          allTime={data?.rates?.cancellationRateAllTime}
          tone="red"
          loading={isLoading}
        />
        <RateCard
          title="Отклонение"
          inRange={data?.rates?.rejectionRateInRange}
          allTime={data?.rates?.rejectionRateAllTime}
          tone="amber"
          loading={isLoading}
        />
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Выручка · в периоде"
          value={financials.revenueInRange != null ? `${formatNumber(financials.revenueInRange)} UZS` : undefined}
          subtext={
            financials.revenueAllTime != null ? `всего: ${formatNumber(financials.revenueAllTime)} UZS` : undefined
          }
          icon={CreditCard}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Средняя цена брони"
          value={
            financials.avgBookingPrice != null
              ? `${formatNumber(Math.round(Number(financials.avgBookingPrice)))} UZS`
              : undefined
          }
          icon={CreditCard}
          tone="sky"
          loading={isLoading}
        />
        <StatCard
          title="Среднее мест на бронь"
          value={financials.avgSeatsBooked != null ? Number(financials.avgSeatsBooked).toFixed(2) : undefined}
          icon={Ticket}
          tone="violet"
          loading={isLoading}
        />
      </div>

      <OverviewChart
        title="Динамика бронирований"
        loading={isLoading}
        series={[
          { name: "Создано", data: ts.created ?? [], color: "var(--chart-1)" },
          { name: "Подтверждено", data: ts.confirmed ?? [], color: "var(--chart-2)" },
          { name: "Отменено", data: ts.cancelled ?? [], color: "var(--chart-4)" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Источник брони · в периоде">
          <DistributionList data={bySource} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Источник брони · за всё время">
          <DistributionList data={bySourceAllTime} loading={isLoading} />
        </StatsSection>
      </div>

      <StatsSection title="Топ пассажиров по бронированиям">
        <TopList data={topPassengers} loading={isLoading} />
      </StatsSection>
    </div>
  );
};
