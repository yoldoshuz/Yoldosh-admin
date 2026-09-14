"use client";

import { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPct, LOW_SAMPLE_THRESHOLD } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";

// ============================================================
// Мелкие метрики раздела аналитики.
//
// Правила UI, которые здесь зашиты:
//   • абсолютное число без динамики ничего не значит → DeltaBadge;
//   • «7.4%» без «310 из 4200» приводит к неверным выводам → Conversion;
//   • выборка < 100 пользователей статистически незначима → LowSampleNotice.
// ============================================================

export const DeltaBadge = ({
  value,
  className,
  /** Для метрик, где рост — это плохо (ошибки, нулевая выдача). */
  inverted = false,
}: {
  value: number | null | undefined;
  className?: string;
  inverted?: boolean;
}) => {
  if (value == null || Number.isNaN(value)) {
    return <span className={cn("text-muted-foreground text-xs", className)}>—</span>;
  }

  const flat = Math.abs(value) < 0.05;
  const positive = inverted ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        flat
          ? "text-muted-foreground bg-muted"
          : positive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        className
      )}
      title="К предыдущему периоду той же длины"
    >
      <Icon className="size-3" />
      {flat ? "0%" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
    </span>
  );
};

/**
 * Процент конверсии с числителем и знаменателем в тултипе.
 * `pct` берём с бэка (он считает по своим правилам), дробь — только подсказка.
 */
export const Conversion = ({
  pct,
  numerator,
  denominator,
  label,
  className,
}: {
  pct: number | null | undefined;
  numerator?: number | null;
  denominator?: number | null;
  label?: string;
  className?: string;
}) => {
  const text = formatPct(pct);
  const hasFraction = numerator != null && denominator != null;

  if (!hasFraction) return <span className={cn("tabular-nums", className)}>{text}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-help border-b border-dotted tabular-nums", className)}>{text}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {label ? `${label}: ` : ""}
            {formatNumber(numerator)} из {formatNumber(denominator)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Предупреждение о статистической незначимости малой выборки. */
export const LowSampleNotice = ({
  users,
  threshold = LOW_SAMPLE_THRESHOLD,
  className,
}: {
  users: number | null | undefined;
  threshold?: number;
  className?: string;
}) => {
  if (users == null || users >= threshold) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200",
        className
      )}
    >
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Выборка — {formatNumber(users)} польз. Меньше {threshold} — выводы статистически незначимы, проценты будут
        сильно скакать.
      </span>
    </div>
  );
};

/** Подпись-пояснение под заголовком блока. */
export const MetricHint = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-muted-foreground text-xs", className)}>{children}</p>
);
