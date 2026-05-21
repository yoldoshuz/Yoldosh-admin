"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Banknote, CircleDollarSign, Percent, ShieldOff, Wallet } from "lucide-react";

import { DateRangeValue } from "@/components/shared/DateRangePicker";
import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { toDistribution, toUserTopList } from "@/components/shared/stats/normalize";
import { StatPairCard } from "@/components/shared/stats/StatPairCard";
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
  const payments = data?.payments ?? {};
  const refunds = data?.refunds ?? {};
  const commission = data?.commission ?? {};
  const withdrawals = data?.withdrawals ?? {};
  const blocked = data?.blocked ?? {};
  const top = data?.top ?? {};

  // Bucket distribution
  const buckets = (Array.isArray(balance.distribution) ? balance.distribution : []).map((b: any) => ({
    label: BUCKET_LABELS[String(b.bucket)] ?? String(b.bucket),
    count: Number(b.count ?? 0),
  }));

  const byType = toDistribution(transactions.byType, ["type"]);
  const byStatus = toDistribution(transactions.byStatus, ["status"]);
  const byTypeAllTime = toDistribution(transactions.byTypeAllTime, ["type"]);

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

      {/* Snapshot row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Баланс на руках"
          value={balance.total != null ? `${formatNumber(balance.total)} UZS` : undefined}
          icon={Wallet}
          tone="emerald"
          subtext="Снапшот · по всему пулу"
          loading={isLoading}
        />
        <StatCard
          title="Кошельков заблокировано"
          value={blocked.walletBlockedUsers}
          icon={ShieldOff}
          tone="red"
          loading={isLoading}
        />
        <StatPairCard
          title="Пополнений · кол-во"
          pair={topUps.counts}
          icon={ArrowDownToLine}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Платежей · кол-во"
          pair={payments.counts}
          icon={ArrowUpFromLine}
          tone="sky"
          loading={isLoading}
        />
      </div>

      {/* Money flows — sums */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatPairCard
          title="Пополнения · сумма"
          pair={topUps.sums}
          money
          icon={Banknote}
          tone="emerald"
          loading={isLoading}
        />
        <StatPairCard
          title="Платежи · сумма"
          pair={payments.sums}
          money
          icon={Banknote}
          tone="sky"
          loading={isLoading}
        />
        <StatPairCard
          title="Возвраты · сумма"
          pair={refunds.sums}
          money
          icon={Banknote}
          tone="amber"
          loading={isLoading}
        />
        <StatPairCard
          title="Комиссия · сумма"
          pair={commission.sums}
          money
          icon={Percent}
          tone="violet"
          loading={isLoading}
        />
        <StatPairCard
          title="Выводы · сумма"
          pair={withdrawals.sums}
          money
          icon={ArrowUpFromLine}
          tone="red"
          loading={isLoading}
        />
      </div>

      {/* Average top-up */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatPairCard
          title="Средний чек пополнения"
          pair={topUps.average}
          money
          icon={CircleDollarSign}
          tone="violet"
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
        <StatsSection title="Транзакции по типам · в периоде">
          <DistributionList data={byType} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Транзакции по статусам · в периоде">
          <DistributionList data={byStatus} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Транзакции по типам · за всё время">
          <DistributionList data={byTypeAllTime} loading={isLoading} />
        </StatsSection>
        <StatsSection title="Сумма по типам COMPLETED · в периоде">
          <DistributionList data={sumByType} loading={isLoading} formatter={(v) => `${formatNumber(v)} UZS`} />
        </StatsSection>
      </div>

      <StatsSection title="Топ кошельков по балансу">
        <TopList data={topWallets} loading={isLoading} format="money" />
      </StatsSection>
    </div>
  );
};
