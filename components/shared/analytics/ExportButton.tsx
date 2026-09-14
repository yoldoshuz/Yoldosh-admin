"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAnalyticsExport } from "@/hooks/analyticsHooks";
import { AnalyticsFilterValue, filtersToQuery, MAX_EXPORT_DAYS, rangeLengthDays } from "@/lib/analytics";
import type { AnalyticsExportReport } from "@/types";

// ============================================================
// CSV-экспорт. Бэк отдаёт файл синхронно и ограничивает диапазон
// 31 днём — осознанно, поэтому кнопку блокируем заранее, а не ловим 400.
// ============================================================

interface Props {
  report: AnalyticsExportReport;
  filters: AnalyticsFilterValue;
  /** Уточнение для report=funnel / report=forms. */
  funnel?: string;
  form?: string;
  label?: string;
}

export const ExportButton = ({ report, filters, funnel, form, label = "CSV" }: Props) => {
  const { mutate, isPending } = useAnalyticsExport();
  const days = rangeLengthDays(filters.from, filters.to);
  const tooWide = days > MAX_EXPORT_DAYS;

  const button = (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-1.5"
      disabled={isPending || tooWide}
      onClick={() => mutate({ report, funnel, form, ...filtersToQuery(filters) })}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      {label}
    </Button>
  );

  if (!tooWide) return button;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-60 text-xs">
            Выбрано {days} дн. Экспорт ограничен {MAX_EXPORT_DAYS} днями: выгрузка за квартал одним запросом
            заблокировала бы выборку на бэке.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
