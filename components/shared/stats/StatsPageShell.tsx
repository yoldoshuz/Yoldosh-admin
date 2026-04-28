"use client";

import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";

export const StatsHeader = ({
  title,
  subtitle,
  range,
  onRangeChange,
  withRange = true,
}: {
  title: string;
  subtitle?: string;
  range?: DateRangeValue;
  onRangeChange?: (v: DateRangeValue) => void;
  withRange?: boolean;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="title-text">{title}</h2>
      {subtitle && <p className="subtitle-text">{subtitle}</p>}
    </div>
    {withRange && range && onRangeChange && <DateRangePicker value={range} onChange={onRangeChange} />}
  </div>
);

export const rangeToParams = (range: DateRangeValue) => ({
  range: range.preset === "custom" ? ("custom" as const) : range.preset,
  from: range.from,
  to: range.to,
});
