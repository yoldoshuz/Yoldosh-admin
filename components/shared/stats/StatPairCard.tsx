"use client";

import { LucideIcon } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { formatCompactNumber, formatNumber } from "@/lib/utils";

type Pair = { total?: number | null; totalInRange?: number | null } | undefined | null;

interface StatPairCardProps {
  title: string;
  pair: Pair;
  icon?: LucideIcon;
  tone?: "default" | "emerald" | "amber" | "red" | "sky" | "violet";
  loading?: boolean;
  highlight?: boolean;
  /** Render values as money (UZS) instead of compact numbers. */
  money?: boolean;
  /** Format function override. */
  format?: (v: number) => string;
  className?: string;
}

const defaultFormat = (money?: boolean) => (v: number) => (money ? `${formatNumber(v)} UZS` : formatCompactNumber(v));

export const StatPairCard = ({
  title,
  pair,
  icon,
  tone = "default",
  loading,
  highlight,
  money,
  format,
  className,
}: StatPairCardProps) => {
  const fmt = format ?? defaultFormat(money);
  const totalInRange = pair?.totalInRange;
  const total = pair?.total;
  const value = totalInRange != null ? fmt(Number(totalInRange)) : undefined;
  const subtext = total != null ? `всего: ${fmt(Number(total))}` : undefined;
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      tone={tone}
      loading={loading}
      highlight={highlight}
      subtext={subtext}
      className={className}
    />
  );
};
