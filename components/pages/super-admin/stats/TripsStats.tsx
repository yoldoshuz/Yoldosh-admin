"use client";

import { useState } from "react";
import { CarFront, MapPin, Route, TrendingUp } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList, toDistribution, toRoutesList, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetTripsStats } from "@/hooks/adminHooks";
import { formatNumber } from "@/lib/utils";

export const TripsStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetTripsStats(rangeToParams(range));

  const byStatus = toDistribution(data?.byStatus, ["status"]);
  const byBookingType = toDistribution(data?.byBookingType, ["booking_type", "bookingType"]);
  const ts = data?.timeSeries ?? {};
  const averages = data?.averages ?? {};
  const top = data?.top ?? {};

  const totalTrips = byStatus.reduce((s, x) => s + x.count, 0);
  const fillRate = averages.fillRatePercent ?? averages.fillRate;

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика поездок"
        subtitle="Распределение, динамика и топы"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Всего поездок" value={totalTrips} icon={CarFront} loading={isLoading} />
        <StatCard
          title="Fill rate"
          value={fillRate != null ? `${Number(fillRate).toFixed(1)} %` : undefined}
          icon={TrendingUp}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Средняя цена"
          value={
            averages.pricePerPerson != null
              ? `${formatNumber(Math.round(Number(averages.pricePerPerson)))} UZS`
              : undefined
          }
          icon={MapPin}
          tone="sky"
          loading={isLoading}
        />
        <StatCard
          title="Среднее свободных мест"
          value={averages.seatsAvailable != null ? Number(averages.seatsAvailable).toFixed(2) : undefined}
          icon={Route}
          tone="violet"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Создано / Завершено / Отменено"
          loading={isLoading}
          series={[
            { name: "Создано", data: ts.created ?? [], color: "var(--chart-1)" },
            { name: "Завершено", data: ts.completed ?? [], color: "var(--chart-2)" },
            { name: "Отменено", data: ts.canceled ?? [], color: "var(--chart-4)" },
          ]}
        />
        <StatsSection title="По статусам">
          <DistributionList data={byStatus} loading={isLoading} />
        </StatsSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="По типу бронирования">
          <DistributionList data={byBookingType} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Топ маршрутов">
          <TopList data={toRoutesList(top.routes)} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Топ городов отправления">
          <TopList data={toCitiesList(top.departureCities, "from_city")} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Топ городов прибытия">
          <TopList data={toCitiesList(top.arrivalCities, "to_city")} loading={isLoading} />
        </StatsSection>
      </div>

      <StatsSection title="Топ водителей по поездкам">
        <TopList data={toUserTopList(top.driversByTrips, "trips_count")} loading={isLoading} />
      </StatsSection>
    </div>
  );
};
