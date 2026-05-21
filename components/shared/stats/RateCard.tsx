"use client";

import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RateCardProps {
  title: string;
  /** Rate in 0..1 (e.g. 0.42) — rendered as a percentage. */
  inRange: number | null | undefined;
  /** All-time rate in 0..1. */
  allTime: number | null | undefined;
  icon?: LucideIcon;
  tone?: "default" | "emerald" | "amber" | "red" | "sky" | "violet";
  loading?: boolean;
  className?: string;
}

const toneIcon: Record<NonNullable<RateCardProps["tone"]>, string> = {
  default: "text-emerald-500 bg-emerald-500/10",
  emerald: "text-emerald-500 bg-emerald-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  red: "text-red-500 bg-red-500/10",
  sky: "text-sky-500 bg-sky-500/10",
  violet: "text-violet-500 bg-violet-500/10",
};

const formatPct = (v: number | null | undefined) => {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return `${(Number(v) * 100).toFixed(1)}%`;
};

export const RateCard = ({
  title,
  inRange,
  allTime,
  icon: Icon,
  tone = "default",
  loading,
  className,
}: RateCardProps) => {
  return (
    <Card className={cn("stats-card relative overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{title}</p>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {loading ? <Skeleton className="h-8 w-20" /> : formatPct(inRange)}
            </div>
            {!loading && allTime != null && (
              <p className="text-muted-foreground mt-1 text-xs">всего: {formatPct(allTime)}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("flex size-10 items-center justify-center rounded-xl", toneIcon[tone])}>
              <Icon className="size-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
