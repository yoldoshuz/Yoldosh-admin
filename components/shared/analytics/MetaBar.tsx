"use client";

import { Clock, Info, TriangleAlert } from "lucide-react";

import {
  ANALYTICS_TZ,
  formatCalculatedAt,
  formatDay,
  isPartialToday,
  MAX_RANGE_DAYS,
  rangeLengthDays,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsMeta } from "@/types";

// ============================================================
// Подпись под заголовком экрана аналитики.
//
// Обязательна везде: без «Обновлено в 14:32» и пометки неполного
// сегодняшнего дня каждое утро начинается с паники «трафик упал вдвое».
// ============================================================

interface Props {
  meta?: AnalyticsMeta;
  from?: string;
  to?: string;
  className?: string;
}

export const MetaBar = ({ meta, from, to, className }: Props) => {
  const updatedAt = formatCalculatedAt(meta?.calculated_at);
  const partial = isPartialToday(meta, to ?? meta?.to);
  const rangeFrom = from ?? meta?.from;
  const rangeTo = to ?? meta?.to;
  const tooWide = rangeFrom && rangeTo ? rangeLengthDays(rangeFrom, rangeTo) > MAX_RANGE_DAYS : false;

  return (
    <div className={cn("text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", className)}>
      {rangeFrom && rangeTo && (
        <span className="inline-flex items-center gap-1">
          {formatDay(rangeFrom)} – {formatDay(rangeTo)}
        </span>
      )}
      {updatedAt && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" /> Обновлено в {updatedAt}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Info className="size-3" /> {meta?.timezone ?? ANALYTICS_TZ}
      </span>
      {partial && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <TriangleAlert className="size-3" /> Сегодня — неполный день
        </span>
      )}
      {tooWide && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <TriangleAlert className="size-3" /> Диапазон больше {MAX_RANGE_DAYS} дней — бэк вернёт 400
        </span>
      )}
    </div>
  );
};
