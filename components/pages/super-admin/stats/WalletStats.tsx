"use client";

import { useState } from "react";
import { Banknote, CircleDollarSign, ShieldOff, Wallet } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { rangeToParams, StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { DistributionList, StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { useGetWalletStats } from "@/hooks/adminHooks";
import { formatNumber } from "@/lib/utils";

const BUCKET_LABELS: Record<string, string> = {
  zero: "0 UZS",
  negative: "Минус",
  lt_50k: "< 50 000",
  lt_200k: "< 200 000",
  lt_1m: "< 1 000 000",
  ge_1m: "≥ 1 000 000",
};

export const WalletStats = () => {
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const { data, isLoading } = useGetWalletStats(rangeToParams(range));

  const balance = data?.balance ?? {};
  const transactions = data?.transactions ?? {};
  const topUps = data?.topUps ?? {};
  const blocked = data?.blocked ?? {};
  const top = data?.top ?? {};

  // Bucket distribution: items have {bucket, count, sum}
  const buckets = (Array.isArray(balance.distribution) ? balance.distribution : []).map((b: any) => ({
    label: BUCKET_LABELS[String(b.bucket)] ?? String(b.bucket),
    count: Number(b.count ?? 0),
  }));

  const byType = toDistribution(transactions.byType, ["type"]);
  const byStatus = toDistribution(transactions.byStatus, ["status"]);
  const sumByType = (Array.isArray(transactions.sumByCompletedType) ? transactions.sumByCompletedType : []).map(
    (t: any) => ({
      label: String(t.type ?? "—"),
      count: Math.abs(Number(t.sum ?? 0)),
    })
  );

  const topWallets = toUserTopList(top.usersByBalance, "balance");

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Финансовая аналитика"
        subtitle="Балансы, пополнения, движения"
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Баланс на руках"
          value={balance.total != null ? `${formatNumber(balance.total)} UZS` : undefined}
          icon={Wallet}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Сумма пополнений"
          value={topUps.total != null ? `${formatNumber(topUps.total)} UZS` : undefined}
          icon={Banknote}
          tone="sky"
          subtext={topUps.count != null ? `${topUps.count} пополнений` : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Средний чек"
          value={
            topUps.averageInRange != null ? `${formatNumber(Math.round(Number(topUps.averageInRange)))} UZS` : undefined
          }
          icon={CircleDollarSign}
          tone="violet"
          loading={isLoading}
        />
        <StatCard
          title="Кошельков заблокировано"
          value={blocked.walletBlockedUsers}
          icon={ShieldOff}
          tone="red"
          loading={isLoading}
        />
      </div>

      <OverviewChart
        title="Пополнения за период"
        loading={isLoading}
        series={[{ name: "Сумма", data: topUps.graph ?? [], color: "var(--chart-1)" }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Распределение балансов">
          <DistributionList data={buckets} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Транзакции по типам">
          <DistributionList data={byType} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Транзакции по статусам">
          <DistributionList data={byStatus} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Сумма по типам COMPLETED">
          <DistributionList data={sumByType} loading={isLoading} formatter={(v) => `${formatNumber(v)} UZS`} />
        </StatsSection>
      </div>

      <StatsSection title="Топ кошельков по балансу">
        <TopList data={topWallets} loading={isLoading} format="money" />
      </StatsSection>
    </div>
  );
};
