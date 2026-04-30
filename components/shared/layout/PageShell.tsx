"use client";

import { ReactNode } from "react";

import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { cn } from "@/lib/utils";

// ============================================================
// PageShell: consistent padding/spacing wrapper for every page.
// PageHeader: unified title + subtitle + actions slot (e.g. range picker).
// FiltersToolbar: standard wrapper for search/filter rows.
// ============================================================

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export const PageShell = ({ children, className }: PageShellProps) => (
  <section className={cn("flex w-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8", className)}>{children}</section>
);

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  actions?: ReactNode;
  range?: DateRangeValue;
  onRangeChange?: (value: DateRangeValue) => void;
  className?: string;
}

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  actions,
  range,
  onRangeChange,
  className,
}: PageHeaderProps) => (
  <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
    <div className="min-w-0">
      <h2 className="title-text flex items-center gap-2">
        {Icon && <Icon className={cn("size-6 shrink-0 text-emerald-500", iconClassName)} />}
        <span className="truncate">{title}</span>
      </h2>
      {subtitle && <p className="subtitle-text">{subtitle}</p>}
    </div>
    {(range || actions) && (
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {range && onRangeChange && <DateRangePicker value={range} onChange={onRangeChange} />}
      </div>
    )}
  </div>
);

interface FiltersToolbarProps {
  children: ReactNode;
  className?: string;
}

export const FiltersToolbar = ({ children, className }: FiltersToolbarProps) => (
  <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>{children}</div>
);
