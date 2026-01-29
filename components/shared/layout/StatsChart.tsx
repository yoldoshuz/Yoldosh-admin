"use client";

import { useTheme } from "next-themes";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartData } from "@/types";

interface StatsChartProps {
    title: string;
    data: ChartData[];
    dataKey: string;
    type?: "line" | "bar";
    color?: string;
    range: string;
    onRangeChange: (val: string) => void;
    total?: number | string;
    subtext?: string;
}

export const StatsChart = ({
    title, data, dataKey, type = "line", color = "#10b981", range, onRangeChange, total, subtext
}: StatsChartProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const gridColor = isDark ? "#27272a" : "#e5e7eb";
    const textColor = isDark ? "#a1a1aa" : "#64748b";

    return (
        <Card className="flex flex-col h-full shadow-lg border-emerald-100/20 dark:border-emerald-900/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                    {total !== undefined && <div className="text-2xl font-bold">{total}</div>}
                    {subtext && <CardDescription>{subtext}</CardDescription>}
                </div>
                <Select value={range} onValueChange={onRangeChange}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">День</SelectItem>
                        <SelectItem value="week">Неделя</SelectItem>
                        <SelectItem value="month">Месяц</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                    {type === "line" ? (
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: isDark ? "#18181b" : "#fff", borderRadius: "8px", border: "1px solid #3f3f46" }}
                            />
                            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} strokeWidth={2} />
                        </AreaChart>
                    ) : (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: isDark ? "#18181b" : "#fff", borderRadius: "8px" }} />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};