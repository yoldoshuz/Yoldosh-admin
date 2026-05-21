"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Flag, X } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toUserTopList } from "@/components/shared/stats/normalize";
import { RateCard } from "@/components/shared/stats/RateCard";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetReportsStats } from "@/hooks/adminHooks";
import { formatDuration } from "@/lib/utils";

export const ReportsStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetReportsStats(rangeToParams(range));

  const ts = data?.timeSeries ?? {};
  const createdGraph = ts.created ?? [];
  const resolvedGraph = ts.resolved ?? [];

  const performance = data?.performance ?? {};
  const avgResolutionInRange = performance.avgResolutionMinutesInRange;
  const avgResolutionAllTime = performance.avgResolutionMinutes;

  const topReasons = (Array.isArray(data?.topReasons) ? data.topReasons : []).map((r: any) => ({
    label: String(r.reason ?? r.label ?? "—"),
    count: Number(r.count ?? r.value ?? 0),
  }));

  const topOffenders = toUserTopList(data?.topReportedUsers, "count");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика жалоб"
        subtitle="Динамика, средний резолв и топы"
        range={range}
        onRangeChange={setRange}
      />

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPairCard title="Всего жалоб" pair={data?.counts} icon={Flag} loading={isLoading} />
        <StatPairCard
          title="Открытых"
          pair={data?.byStatusTotals?.PENDING}
          icon={Flag}
          tone="red"
          highlight={(data?.byStatusTotals?.PENDING?.totalInRange ?? 0) > 0}
          loading={isLoading}
        />
        <StatPairCard
          title="Резолвнутых"
          pair={data?.byStatusTotals?.RESOLVED}
          icon={CheckCircle2}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Отклонено"
          pair={data?.byStatusTotals?.REJECTED}
          icon={X}
          tone="amber"
          loading={isLoading}
        />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <RateCard
          title="Резолюция"
          inRange={data?.rates?.resolutionRateInRange}
          allTime={data?.rates?.resolutionRateAllTime}
          tone="emerald"
          loading={isLoading}
        />
        <RateCard
          title="Отклонение"
          inRange={data?.rates?.rejectionRateInRange}
          allTime={data?.rates?.rejectionRateAllTime}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          title="Среднее время резолва"
          value={avgResolutionInRange != null ? formatDuration(Number(avgResolutionInRange)) : "—"}
          subtext={avgResolutionAllTime != null ? `всего: ${formatDuration(Number(avgResolutionAllTime))}` : undefined}
          icon={Clock}
          tone="sky"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Создано / Резолвнуто"
          loading={isLoading}
          series={[
            { name: "Создано", data: createdGraph, color: "var(--chart-4)" },
            { name: "Резолвнуто", data: resolvedGraph, color: "var(--chart-1)" },
          ]}
        />
        <StatsSection title="Топ причин">
          <TopList data={topReasons} loading={isLoading} />
        </StatsSection>
      </div>

      <StatsSection title="Топ нарушителей">
        <TopList data={topOffenders} loading={isLoading} />
      </StatsSection>
    </div>
  );
};
