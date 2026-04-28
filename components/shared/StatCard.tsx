"use client";

import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompactNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string | null | undefined;
  icon?: LucideIcon;
  subtext?: string;
  tone?: "default" | "emerald" | "amber" | "red" | "sky" | "violet";
  loading?: boolean;
  highlight?: boolean; // renders a colored ring when true (e.g. "PENDING > 0")
  className?: string;
}

const toneRing: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "ring-emerald-500/20",
  emerald: "ring-emerald-500/30",
  amber: "ring-amber-500/30",
  red: "ring-red-500/30",
  sky: "ring-sky-500/30",
  violet: "ring-violet-500/30",
};

const toneIcon: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-emerald-500 bg-emerald-500/10",
  emerald: "text-emerald-500 bg-emerald-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  red: "text-red-500 bg-red-500/10",
  sky: "text-sky-500 bg-sky-500/10",
  violet: "text-violet-500 bg-violet-500/10",
};

const formatValue = (v: number | string | null | undefined) => {
  if (v == null) return "—";
  if (typeof v === "number") return formatCompactNumber(v);
  return v;
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  tone = "default",
  loading,
  highlight,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("stats-card relative overflow-hidden", highlight && `ring-2 ${toneRing[tone]}`, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">
              {loading ? <Skeleton className="h-8 w-20" /> : formatValue(value)}
            </div>
            {subtext && !loading && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
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
