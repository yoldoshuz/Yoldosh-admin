"use client";

import { ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { AnalyticsFilters } from "@/components/shared/analytics/AnalyticsFilters";
import { MetaBar } from "@/components/shared/analytics/MetaBar";
import { PageShell } from "@/components/shared/layout/PageShell";
import { Button } from "@/components/ui/button";
import { AnalyticsFilterValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsMeta } from "@/types";

// ============================================================
// Общая обвязка экрана аналитики: заголовок, фильтры, подпись
// «Обновлено в …». Панель фильтров одна и та же на всех экранах,
// включая фильтр по app_version.
//
// Отдельно — баннер ошибки. Упавший запрос и пустая витрина
// выглядят одинаково («нет данных»), хотя это принципиально разные
// вещи: в первом случае чинить надо бэк, во втором — просто ждать
// накопления событий.
// ============================================================

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  meta?: AnalyticsMeta;
  filters: AnalyticsFilterValue;
  onFiltersChange: (v: AnalyticsFilterValue) => void;
  /** Экраны без разбивки по ролям (чаты, ошибки) прячут селектор. */
  withRole?: boolean;
  /** Экраны без периода (настройки трекинга) прячут панель целиком. */
  withFilters?: boolean;
  /** Хотя бы один запрос экрана упал — показываем это явно. */
  isError?: boolean;
  onRetry?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const AnalyticsPageShell = ({
  title,
  subtitle,
  icon: Icon,
  meta,
  filters,
  onFiltersChange,
  withRole = true,
  withFilters = true,
  isError,
  onRetry,
  actions,
  children,
  className,
}: Props) => (
  <PageShell className={className}>
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="title-text flex items-center gap-2">
            {Icon && <Icon className="size-6 shrink-0 text-emerald-500" />}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="subtitle-text">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {withFilters && <AnalyticsFilters value={filters} onChange={onFiltersChange} withRole={withRole} />}
        </div>
      </div>
      {withFilters && <MetaBar meta={meta} from={filters.from} to={filters.to} />}

      {isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <TriangleAlert className="size-4 shrink-0" />
          <span className="flex-1">
            Не удалось загрузить данные — витрина ответила ошибкой. Это сбой на бэкенде, а не пустой период: цифры ниже
            показывать нечему.
          </span>
          {onRetry && (
            <Button variant="outline" size="sm" className="h-7 gap-1.5" onClick={onRetry}>
              <RefreshCw className="size-3" /> Повторить
            </Button>
          )}
        </div>
      )}
    </div>

    <div className={cn("flex flex-col gap-4 sm:gap-6")}>{children}</div>
  </PageShell>
);
