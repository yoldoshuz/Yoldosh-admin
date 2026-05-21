"use client";

import { useState } from "react";
import { Search, Users, UserX } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { toRoutesList } from "@/components/shared/stats/normalize";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetSearchesStats } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";

const SEGMENT_ORDER = ["real", "bots", "guests", "unknown", "all"] as const;
const SEGMENT_LABEL: Record<(typeof SEGMENT_ORDER)[number], string> = {
  real: "Реальные",
  bots: "Боты",
  guests: "Гости",
  unknown: "Неизвестные",
  all: "Все",
};
const SEGMENT_TONE: Record<(typeof SEGMENT_ORDER)[number], "emerald" | "violet" | "sky" | "amber" | "default"> = {
  real: "emerald",
  bots: "violet",
  guests: "sky",
  unknown: "amber",
  all: "default",
};

const SegmentationCard = ({
  title,
  scope,
  loading,
}: {
  title: string;
  scope: Record<string, { searches: number; uniqueActors: number }> | undefined;
  loading?: boolean;
}) => {
  const totalSearches = SEGMENT_ORDER.filter((k) => k !== "all").reduce(
    (sum, k) => sum + (scope?.[k]?.searches ?? 0),
    0
  );
  return (
    <StatsSection title={title}>
      <ul className="space-y-2">
        {SEGMENT_ORDER.map((k) => {
          const searches = scope?.[k]?.searches ?? 0;
          const uniqueActors = scope?.[k]?.uniqueActors ?? 0;
          const denom = k === "all" ? totalSearches : totalSearches;
          const pct = denom > 0 ? Math.round((searches / denom) * 100) : 0;
          const color =
            SEGMENT_TONE[k] === "emerald"
              ? "from-emerald-500 to-teal-500"
              : SEGMENT_TONE[k] === "violet"
                ? "from-violet-500 to-purple-500"
                : SEGMENT_TONE[k] === "sky"
                  ? "from-sky-500 to-blue-500"
                  : SEGMENT_TONE[k] === "amber"
                    ? "from-amber-500 to-orange-500"
                    : "from-slate-500 to-zinc-500";
          return (
            <li key={k} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{SEGMENT_LABEL[k]}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatCompactNumber(searches)} поисков · {formatCompactNumber(uniqueActors)} уникальных
                  {k !== "all" && totalSearches > 0 ? ` · ${pct}%` : ""}
                </span>
              </div>
              {k !== "all" && (
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    style={{ width: `${totalSearches > 0 ? Math.max(2, (searches / totalSearches) * 100) : 0}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {loading && <p className="text-muted-foreground mt-2 text-xs">Загрузка…</p>}
    </StatsSection>
  );
};

export const SearchesStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetSearchesStats(rangeToParams(range));

  const counts = data?.counts;
  const searchesPair = counts ? { total: counts.total, totalInRange: counts.totalInRange } : undefined;
  const uniqueUsersPair = counts
    ? { total: counts.uniqueUsersTotal, totalInRange: counts.uniqueUsersTotalInRange }
    : undefined;
  const uniqueGuestsPair = counts
    ? { total: counts.uniqueGuestsTotal, totalInRange: counts.uniqueGuestsTotalInRange }
    : undefined;

  const topRoutes = toRoutesList(data?.top?.routes);

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика поисков"
        subtitle="Маршруты и сегментация по реальным / ботам / гостям"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatPairCard title="Поисков" pair={searchesPair} icon={Search} loading={isLoading} />
        <StatPairCard
          title="Уникальных пользователей"
          pair={uniqueUsersPair}
          icon={Users}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Уникальных гостей"
          pair={uniqueGuestsPair}
          icon={UserX}
          tone="violet"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SegmentationCard title="Сегментация · в периоде" scope={data?.segmentation?.inRange} loading={isLoading} />
        <SegmentationCard title="Сегментация · за всё время" scope={data?.segmentation?.allTime} loading={isLoading} />
      </div>

      <StatsSection title="Топ маршрутов поиска">
        <TopList data={topRoutes} loading={isLoading} limit={20} />
      </StatsSection>
    </div>
  );
};
