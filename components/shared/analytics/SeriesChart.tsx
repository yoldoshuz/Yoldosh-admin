"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { formatSeriesTick } from "@/lib/analytics";
import { formatCompactNumber } from "@/lib/utils";
import type { AnalyticsGranularity } from "@/types";

// ============================================================
// График витрины по дням (или часам, если диапазон ≤ 3 дней).
// Одна и та же обвязка на «Обзоре», «Событиях» и «Ошибках».
// ============================================================

export type SeriesDef = {
  key: string;
  label: string;
  color: string;
};

interface Props {
  data: Record<string, any>[] | undefined;
  /** Поле с меткой времени: `day` в обзоре, `t` в таймсериях событий. */
  xKey: string;
  series: SeriesDef[];
  granularity?: AnalyticsGranularity;
  height?: number;
  type?: "area" | "line";
  loading?: boolean;
}

export const SeriesChart = ({
  data,
  xKey,
  series,
  granularity = "day",
  height = 260,
  type = "area",
  loading,
}: Props) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#27272a" : "#e5e7eb";
  const textColor = isDark ? "#a1a1aa" : "#64748b";

  if (loading) return <Skeleton className="w-full rounded-xl" style={{ height }} />;

  const rows = data ?? [];
  if (!rows.length) return <p className="text-muted-foreground py-8 text-center text-sm">Нет данных за период</p>;

  const tooltipStyle = {
    backgroundColor: isDark ? "#18181b" : "#fff",
    borderRadius: "8px",
    border: `1px solid ${gridColor}`,
    fontSize: 12,
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
      <XAxis
        dataKey={xKey}
        stroke={textColor}
        tickLine={false}
        axisLine={false}
        fontSize={11}
        tickFormatter={(v) => formatSeriesTick(String(v), granularity)}
      />
      <YAxis
        stroke={textColor}
        tickLine={false}
        axisLine={false}
        fontSize={11}
        width={44}
        tickFormatter={(v) => formatCompactNumber(Number(v))}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        labelFormatter={(v) => formatSeriesTick(String(v), granularity)}
        formatter={(value: any, name: any) => [formatCompactNumber(Number(value)), name]}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: textColor }} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "area" ? (
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`analytics-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#analytics-${s.key})`}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {axes}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};
