"use client";

import { ReactNode } from "react";

import { AnalyticsFilters } from "@/components/shared/analytics/AnalyticsFilters";
import { MetaBar } from "@/components/shared/analytics/MetaBar";
import { PageShell } from "@/components/shared/layout/PageShell";
import { AnalyticsFilterValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsMeta } from "@/types";

// ============================================================
// Общая обвязка экрана аналитики: заголовок, фильтры, подпись
// «Обновлено в …». Панель фильтров одна и та же на всех экранах,
// включая фильтр по app_version.
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
    </div>

    <div className={cn("flex flex-col gap-4 sm:gap-6")}>{children}</div>
  </PageShell>
);
