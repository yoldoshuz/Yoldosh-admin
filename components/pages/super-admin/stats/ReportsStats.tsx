"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Flag } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetReportsStats } from "@/hooks/adminHooks";
import { formatDuration } from "@/lib/utils";

export const ReportsStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetReportsStats(rangeToParams(range));

  // The endpoint may use either nested {timeSeries: {created, resolved}} or flat fields.
  const ts = data?.timeSeries ?? {};
  const createdGraph = ts.created ?? data?.createdGraph ?? data?.graph ?? [];
  const resolvedGraph = ts.resolved ?? data?.resolvedGraph ?? [];

  const byStatus = toDistribution(data?.byStatus, ["status"]);
  const total = byStatus.reduce((s, x) => s + x.count, 0);
  const pending = byStatus.find((x) => /pending/i.test(x.label))?.count ?? 0;
  const resolved = byStatus.find((x) => /resolved/i.test(x.label))?.count ?? 0;

  const avgResolution =
    data?.avgResolutionMinutes ?? data?.timing?.avgResolutionMinutes ?? data?.averages?.avgResolutionMinutes;

  const topReasons = (
    Array.isArray(data?.topReasons ?? data?.top?.reasons) ? (data?.topReasons ?? data?.top?.reasons) : []
  ).map((r: any) => ({
    label: String(r.reason ?? r.label ?? "—"),
    count: Number(r.count ?? r.value ?? 0),
  }));

  const topOffenders = toUserTopList(data?.topReportedUsers ?? data?.topOffenders ?? data?.top?.reportedUsers, "count");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Аналитика жалоб"
        subtitle="Динамика, средний резолв и топы"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Всего" value={total} icon={Flag} loading={isLoading} />
        <StatCard title="Открытых" value={pending} icon={Flag} tone="red" highlight={pending > 0} loading={isLoading} />
        <StatCard title="Резолвнутых" value={resolved} icon={CheckCircle2} tone="emerald" loading={isLoading} />
        <StatCard
          title="Среднее время резолва"
          value={avgResolution != null && Number(avgResolution) > 0 ? formatDuration(Number(avgResolution)) : "—"}
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
        <StatsSection title="По статусам">
          <DistributionList data={byStatus} loading={isLoading} />
        </StatsSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ причин">
          <TopList data={topReasons} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Топ нарушителей">
          <TopList data={topOffenders} loading={isLoading} />
        </StatsSection>
      </div>
    </div>
  );
};
