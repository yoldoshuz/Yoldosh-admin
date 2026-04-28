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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber } from "@/lib/utils";

export type Series = {
  name: string;
  dataKey?: string; // defaults to "value"
  data: { date: string; timestamp?: string; value: number }[];
  color: string;
};

interface OverviewChartProps {
  title: string;
  total?: number | string;
  totalSuffix?: string;
  series: Series[];
  height?: number;
  loading?: boolean;
  type?: "area" | "line";
}

export const OverviewChart = ({
  title,
  total,
  totalSuffix,
  series,
  height = 240,
  loading,
  type = "area",
}: OverviewChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const axis = isDark ? "#a1a1aa" : "#64748b";

  // Build a unified dataset by index across series (assume aligned x-axis)
  const length = Math.max(...series.map((s) => s.data.length), 0);
  const data = Array.from({ length }, (_, i) => {
    const row: any = { date: series[0]?.data[i]?.date ?? "" };
    series.forEach((s) => {
      row[s.name] = s.data[i]?.value ?? null;
    });
    return row;
  });

  return (
    <Card className="stats-card">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {total !== undefined && (
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {typeof total === "number" ? formatCompactNumber(total) : total}
            {totalSuffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{totalSuffix}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        {loading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {type === "area" ? (
              <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.name} id={`g-${s.name.replace(/\s/g, "_")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke={axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  stroke={axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={formatCompactNumber}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                    borderRadius: 12,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    fontSize: 12,
                  }}
                />
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {series.map((s) => (
                  <Area
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#g-${s.name.replace(/\s/g, "_")})`}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke={axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  stroke={axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={formatCompactNumber}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                    borderRadius: 12,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    fontSize: 12,
                  }}
                />
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {series.map((s) => (
                  <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
