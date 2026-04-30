"use client";

import { useState } from "react";
import { CircleDollarSign, Ticket, TrendingDown, TrendingUp, UsersRound } from "lucide-react";

import { DateRangePicker, DateRangeValue, rangeToQuery } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toRoutesList, toUserTopList } from "@/components/shared/stats/normalize";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetBookingsStats } from "@/hooks/adminHooks";
import { formatCompactNumber, formatNumber } from "@/lib/utils";

interface Props {
  /** When provided, the Date-range picker is rendered above the block. */
  showRangePicker?: boolean;
}

const SegmentationCard = ({ data }: { data?: { self?: number; botImported?: number; regBot?: number } }) => {
  if (!data) return null;
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

export const BookingsStatsBlock = ({ showRangePicker = true }: Props) => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const params = rangeToQuery(range);
  const { data, isLoading } = useGetBookingsStats(params);

  const cancelled = data?.byStatus?.find?.((s: any) => s.status === "CANCELLED")?.count ?? 0;
  const cancelRate = data?.total ? (Number(cancelled) / Number(data.total)) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {showRangePicker && (
        <div className="flex items-center justify-end">
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Всего" value={data?.total} icon={Ticket} tone="emerald" loading={isLoading} />
        <StatCard
          title="Выручка"
          value={
            data?.financials?.revenueInRange != null ? `${formatNumber(data.financials.revenueInRange)} UZS` : undefined
          }
          icon={CircleDollarSign}
          tone="sky"
          loading={isLoading}
        />
        <StatCard
          title="Средний чек"
          value={
            data?.financials?.avgBookingPrice != null
              ? `${formatNumber(Math.round(data.financials.avgBookingPrice))} UZS`
              : undefined
          }
          icon={TrendingUp}
          tone="violet"
          loading={isLoading}
        />
        <StatCard
          title="% отмены"
          value={cancelRate ? `${cancelRate.toFixed(1)}%` : undefined}
          icon={TrendingDown}
          tone={cancelRate > 30 ? "red" : "amber"}
          highlight={cancelRate > 30}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Создано / Подтверждено / Отменено"
          total={data?.total}
          totalSuffix="всего"
          loading={isLoading}
          series={[
            { name: "Создано", data: data?.timeSeries?.created ?? [], color: "var(--chart-1)" },
            { name: "Подтверждено", data: data?.timeSeries?.confirmed ?? [], color: "var(--chart-2)" },
            { name: "Отменено", data: data?.timeSeries?.cancelled ?? [], color: "var(--chart-4)" },
          ]}
        />
        <StatsSection title="Сегментация по источнику регистрации пассажиров">
          <SegmentationCard data={data?.segmentation?.bySource} />
        </StatsSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ маршрутов">
          <TopList data={toRoutesList(data?.top?.routes)} loading={isLoading} limit={10} />
        </StatsSection>
        <StatsSection title="Топ пассажиров по бронированиям">
          <TopList data={toUserTopList(data?.top?.passengers, "bookings_count")} loading={isLoading} limit={10} />
        </StatsSection>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data?.byStatus ?? []).map((s: any) => (
          <div key={s.status} className="bg-card rounded-xl border p-3">
            <p className="text-muted-foreground text-[11px] tracking-wider uppercase">{s.status}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatCompactNumber(Number(s.count))}</p>
          </div>
        ))}
        {data?.financials?.avgSeatsBooked != null && (
          <div className="bg-card rounded-xl border p-3 sm:col-span-1">
            <p className="text-muted-foreground text-[11px] tracking-wider uppercase">Среднее мест/бронь</p>
            <p className="mt-1 flex items-center gap-1 text-xl font-semibold tabular-nums">
              <UsersRound className="text-muted-foreground size-4" />
              {Number(data.financials.avgSeatsBooked).toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
