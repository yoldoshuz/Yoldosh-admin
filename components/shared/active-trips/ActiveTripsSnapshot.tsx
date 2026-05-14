"use client";

import { Activity, Banknote, Clock, Coins, MapPin, Timer, Users } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import { ActiveTripsSnapshot as Snapshot } from "@/types";

type Props = {
  snapshot: Snapshot | undefined;
  loading?: boolean;
  variant?: "full" | "compact"; // "compact" — 4 КПИ для шапки списков
};

export const ActiveTripsSnapshotBlock = ({ snapshot, loading, variant = "full" }: Props) => {
  const counts = snapshot?.counts;
  const seats = snapshot?.seats;
  const financials = snapshot?.financials;
  const fill = Number(seats?.fillRatePercent ?? 0);

  const cards = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <StatCard
        title="В пути сейчас"
        value={counts?.inProgress}
        icon={Activity}
        tone="emerald"
        highlight={(counts?.inProgress ?? 0) > 0}
        loading={loading}
      />
      <StatCard
        title="Запланированы"
        value={counts?.created}
        icon={Clock}
        tone="sky"
        subtext={`Всего активных: ${counts?.totalActive ?? 0}`}
        loading={loading}
      />
      <StatCard
        title="Отправляются сегодня"
        value={counts?.departingToday}
        icon={MapPin}
        tone="amber"
        loading={loading}
      />
      <StatCard
        title="Стартовали за 24 ч"
        value={counts?.startedLast24h}
        icon={Timer}
        tone="violet"
        loading={loading}
      />
      {variant === "full" && (
        <>
          <StatCard
            title="CONFIRMED брони"
            value={counts?.confirmedBookings}
            icon={Users}
            tone="emerald"
            subtext={counts?.pendingBookings != null ? `PENDING · ${formatNumber(counts.pendingBookings)}` : undefined}
            loading={loading}
          />
          <StatCard
            title="В обороте"
            value={
              financials?.bookingsRevenue != null
                ? `${formatNumber(Number(financials.bookingsRevenue))} UZS`
                : undefined
            }
            icon={Banknote}
            tone="emerald"
            subtext={
              financials?.potentialRevenue != null
                ? `Потенциал · ${formatNumber(Number(financials.potentialRevenue))} UZS`
                : undefined
            }
            loading={loading}
          />
        </>
      )}
    </div>
  );

  if (variant === "compact") return cards;

  return (
    <div className="space-y-3">
      {cards}

      {/* Seats fill bar */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="inline-flex items-center gap-2">
            <Users className="text-muted-foreground size-4" />
            <span className="font-semibold">Загрузка мест на активных поездках</span>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {formatNumber(seats?.booked ?? 0)} из {formatNumber(seats?.total ?? 0)} · {fill.toFixed(1)}%
          </span>
        </div>
        <Progress value={Math.max(0, Math.min(100, fill))} className="mt-3" />
        {financials?.grandTotalIfFull != null && (
          <p className="text-muted-foreground mt-3 inline-flex items-center gap-1 text-xs">
            <Coins className="size-3" />
            Если бы все места были заняты — выручка{" "}
            <span className="text-foreground tabular-nums">
              {formatNumber(Number(financials.grandTotalIfFull))} UZS
            </span>
          </p>
        )}
      </div>
    </div>
  );
};
