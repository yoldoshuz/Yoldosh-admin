"use client";

import { Activity, Clock, MapPin, Timer } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { toCitiesList } from "@/components/shared/stats/normalize";
import { StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetActiveTripsStats } from "@/hooks/adminHooks";
import { formatDuration } from "@/lib/utils";

export const ActiveTripsStats = () => {
  const { data, isLoading, dataUpdatedAt } = useGetActiveTripsStats();

  const counts = data?.counts ?? {};
  const timing = data?.timing ?? {};
  const departureCities = toCitiesList(data?.byDepartureCity, "from_city");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Активные поездки"
        subtitle="Снапшот текущей нагрузки · обновляется каждые 30 секунд"
        withRange={false}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="В пути сейчас"
          value={counts.inProgress}
          icon={Activity}
          tone="emerald"
          highlight={(counts.inProgress ?? 0) > 0}
          loading={isLoading}
        />
        <StatCard title="Создано (ожидают)" value={counts.created} icon={Clock} tone="sky" loading={isLoading} />
        <StatCard
          title="Отправляются сегодня"
          value={counts.departingToday}
          icon={MapPin}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          title="Стартовали за 24 ч"
          value={counts.startedLast24h}
          icon={Timer}
          tone="violet"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Средняя длительность поездки (30 дней)">
          <p className="text-2xl font-semibold tabular-nums">
            {timing.avgTripDurationMinutes != null && Number(timing.avgTripDurationMinutes) > 0
              ? formatDuration(Number(timing.avgTripDurationMinutes))
              : "—"}
          </p>
        </StatsSection>
        <StatsSection
          title="Средняя задержка старта"
          description="Сколько в среднем фактический старт отстаёт от заявленного времени отправления"
        >
          <p className="text-2xl font-semibold tabular-nums">
            {timing.avgStartDelayMinutes != null && Number(timing.avgStartDelayMinutes) > 0
              ? formatDuration(Number(timing.avgStartDelayMinutes))
              : "—"}
          </p>
        </StatsSection>
      </div>

      <StatsSection title="Топ городов отправления">
        <TopList data={departureCities} loading={isLoading} />
      </StatsSection>

      {dataUpdatedAt && (
        <p className="text-muted-foreground text-right text-[11px]">
          Обновлено: {new Date(dataUpdatedAt).toLocaleTimeString("ru-RU")}
        </p>
      )}
    </div>
  );
};
