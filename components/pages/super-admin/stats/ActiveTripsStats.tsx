"use client";

import { useState } from "react";

import { ActiveTripCard as ActiveTripCardComponent } from "@/components/shared/active-trips/ActiveTripCard";
import { ActiveTripsSnapshotBlock } from "@/components/shared/active-trips/ActiveTripsSnapshot";
import { StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetActiveTripsStats } from "@/hooks/adminHooks";
import { formatDuration, formatNumber } from "@/lib/utils";
import { ActiveTripCard as ActiveTripCardType, ActiveTripsSnapshot } from "@/types";

const LIMIT = 50;

const num = (v: any): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ByStatusBreakdown = ({
  byStatus,
  loading,
}: {
  byStatus: ActiveTripsSnapshot["byStatus"] | undefined;
  loading?: boolean;
}) => {
  if (loading)
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  if (!byStatus) return <p className="text-muted-foreground text-sm">Нет данных</p>;
  const entries: Array<[string, any]> = [
    ["IN_PROGRESS", (byStatus as any).IN_PROGRESS],
    ["CREATED", (byStatus as any).CREATED],
  ];
  const labels: Record<string, string> = { IN_PROGRESS: "В пути", CREATED: "Запланированы" };
  const pillClass: Record<string, string> = { IN_PROGRESS: "pill-amber", CREATED: "pill-sky" };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, v]) => (
        <div key={key} className="bg-card rounded-xl border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className={pillClass[key]}>{labels[key]}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{num(v?.tripsCount)} поездок</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground text-xs">CONFIRMED брони</dt>
            <dd className="text-right tabular-nums">{num(v?.confirmedBookings)}</dd>
            <dt className="text-muted-foreground text-xs">PENDING брони</dt>
            <dd className="text-right tabular-nums">{num(v?.pendingBookings)}</dd>
            <dt className="text-muted-foreground text-xs">Мест занято</dt>
            <dd className="text-right tabular-nums">{num(v?.seatsBooked)}</dd>
            <dt className="text-muted-foreground text-xs">Мест свободно</dt>
            <dd className="text-right tabular-nums">{num(v?.seatsAvailable)}</dd>
            <dt className="text-muted-foreground text-xs">В обороте</dt>
            <dd className="text-right font-medium tabular-nums">{formatNumber(num(v?.bookingsRevenue))} UZS</dd>
            <dt className="text-muted-foreground text-xs">Потенциал</dt>
            <dd className="text-right tabular-nums">{formatNumber(num(v?.potentialRevenue))} UZS</dd>
          </dl>
        </div>
      ))}
    </div>
  );
};

const TripsList = ({
  trips,
  loading,
  emptyText,
}: {
  trips: ActiveTripCardType[];
  loading?: boolean;
  emptyText: string;
}) => {
  if (loading)
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  if (!trips.length) return <p className="text-muted-foreground py-8 text-center text-sm">{emptyText}</p>;
  return (
    <div className="grid grid-cols-1 gap-4">
      {trips.map((trip) => (
        <ActiveTripCardComponent key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

export const ActiveTripsStats = () => {
  const [tab, setTab] = useState<"inProgress" | "upcoming">("inProgress");
  const { data, isLoading, dataUpdatedAt } = useGetActiveTripsStats({ limit: LIMIT, upcomingHours: 24 });

  const timing = data?.timing;
  const inProgress = data?.trips?.inProgress ?? [];
  const upcoming = data?.trips?.upcoming ?? [];

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Активные поездки"
        subtitle="Снапшот текущей нагрузки · обновляется каждые 30 секунд"
        withRange={false}
      />

      <ActiveTripsSnapshotBlock snapshot={data} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Средняя длительность поездки (30 дней)">
          <p className="text-2xl font-semibold tabular-nums">
            {timing?.avgTripDurationMinutes != null && Number(timing.avgTripDurationMinutes) > 0
              ? formatDuration(Number(timing.avgTripDurationMinutes))
              : "—"}
          </p>
        </StatsSection>
        <StatsSection
          title="Средняя задержка старта"
          description="Сколько в среднем фактический старт отстаёт от заявленного времени отправления"
        >
          <p className="text-2xl font-semibold tabular-nums">
            {timing?.avgStartDelayMinutes != null && Number(timing.avgStartDelayMinutes) > 0
              ? formatDuration(Number(timing.avgStartDelayMinutes))
              : "—"}
          </p>
        </StatsSection>
      </div>

      <StatsSection title="Разрез по статусу">
        <ByStatusBreakdown byStatus={data?.byStatus} loading={isLoading} />
      </StatsSection>

      <div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "inProgress" | "upcoming")}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="inProgress">Сейчас в пути · {inProgress.length}</TabsTrigger>
              <TabsTrigger value="upcoming">
                Скоро отправятся ({data?.counts?.upcomingWindowHours ?? 24} ч) · {upcoming.length}
              </TabsTrigger>
            </TabsList>
            {data?.trips?.listLimit != null && (
              <p className="text-muted-foreground text-[11px]">Лимит на список: {data.trips.listLimit}</p>
            )}
          </div>

          <TabsContent value="inProgress">
            <TripsList trips={inProgress} loading={isLoading} emptyText="Сейчас нет поездок в пути" />
          </TabsContent>
          <TabsContent value="upcoming">
            <TripsList
              trips={upcoming}
              loading={isLoading}
              emptyText={`Нет поездок к отправлению в ближайшие ${data?.counts?.upcomingWindowHours ?? 24} ч`}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {data?.generatedAt && <span>Снапшот сгенерирован: {new Date(data.generatedAt).toLocaleString("ru-RU")}</span>}
        {dataUpdatedAt && <span>Обновлено: {new Date(dataUpdatedAt).toLocaleTimeString("ru-RU")}</span>}
      </div>
    </div>
  );
};
