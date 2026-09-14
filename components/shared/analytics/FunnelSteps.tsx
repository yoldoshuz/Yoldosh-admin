"use client";

import { Server } from "lucide-react";

import { Conversion } from "@/components/shared/analytics/Metrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { humanizeEventName, isServerEvent } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";
import type { AnalyticsFunnelStep } from "@/types";

// ============================================================
// Воронка сверху вниз. Единица — пользователь за сутки, не сессия.
//
// Последний шаг каждой воронки — серверный факт (`srv_*`): клик
// «забронировать» может не дойти, бронь в базе — дойдёт всегда.
// Помечаем такие шаги иконкой, чтобы никто не искал «пропавшие» клики.
// ============================================================

interface Props {
  steps: AnalyticsFunnelStep[] | undefined;
  loading?: boolean;
  className?: string;
}

export const FunnelSteps = ({ steps, loading, className }: Props) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  const rows = steps ?? [];
  if (!rows.length) {
    return <p className="text-muted-foreground text-sm">Нет данных за выбранный период</p>;
  }

  const start = rows[0]?.users || 1;

  return (
    <ol className={cn("space-y-2.5", className)}>
      {rows.map((s, i) => {
        const prev = i > 0 ? rows[i - 1] : null;
        const width = Math.max(2, (s.users / start) * 100);
        const server = isServerEvent(s.name);
        const dropped = prev ? prev.users - s.users : 0;

        return (
          <li key={`${s.step}-${s.name}`} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums">
                  {s.step}
                </span>
                <span className="truncate">{humanizeEventName(s.name)}</span>
                {server && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                          <Server className="size-2.5" /> сервер
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-60 text-xs">
                          Серверный факт, а не клик в приложении: событие записано в базе и дойдёт всегда.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
              <span className="text-muted-foreground text-xs">
                <span className="text-foreground font-semibold tabular-nums">{formatNumber(s.users)}</span> польз.
                {i > 0 && (
                  <>
                    {" · от шага "}
                    {i}:{" "}
                    <Conversion
                      pct={s.conv_from_prev}
                      numerator={s.users}
                      denominator={prev?.users}
                      label={`Шаг ${s.step} от шага ${i}`}
                      className="text-foreground font-medium"
                    />
                    {" · от старта: "}
                    <Conversion
                      pct={s.conv_from_start}
                      numerator={s.users}
                      denominator={start}
                      label={`Шаг ${s.step} от старта`}
                      className="text-foreground font-medium"
                    />
                  </>
                )}
              </span>
            </div>

            <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>

            {i > 0 && dropped > 0 && (
              <p className="text-muted-foreground text-[11px]">Отвалилось на этом шаге: {formatNumber(dropped)}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
};
