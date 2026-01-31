"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Car, CreditCard, Download, Flag, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSuperAdminProfile, useGetSuperAdminStats } from "@/hooks/superAdminHooks";
import { StatsChart } from "@/components/shared/layout/StatsChart";

export const Home = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("month");
  const { data: superAdmin } = useGetSuperAdminProfile();
  const { data: stats, isLoading, isError } = useGetSuperAdminStats(range);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) return <div className="text-destructive p-8">Ошибка загрузки статистики.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="title-text">Привет, {superAdmin?.firstName}!</h2>
          <p className="subtitle-text">Обзор метрик платформы Yoldosh.</p>
        </div>
      </div>

      {/* Top Cards Row */}
      {/* Cards Row (Links to details) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/super-admin/active-trips">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные поездки</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trips.activeCount}</div>
              <p className="text-xs text-muted-foreground">Сейчас в пути</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/wallets">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Кошелек</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate" title={stats.wallet.totalSum.toLocaleString()}>
                {stats.wallet.totalSum.toLocaleString()} UZS
              </div>
              <p className="text-xs text-muted-foreground">Пополнения</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/guests">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guest Аккаунты</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.guests.total}</div>
              <p className="text-xs text-muted-foreground">Потенциальные</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/finished-trips">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершено</CardTitle>
              <Car className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trips.completed.total}</div>
              <p className="text-xs text-muted-foreground">Успешные поездки</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/reports">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Жалобы</CardTitle>
              <Flag className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reports.total}</div>
              <p className="text-xs text-muted-foreground">Всего за период</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Task 1 & 2: User/Driver Growth */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsChart
          title="Новые пользователи"
          total={stats.users.totalNew}
          data={stats.users.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#3b82f6"
        />
        <StatsChart
          title="Новые водители"
          total={stats.drivers.totalNew}
          data={stats.drivers.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#f59e0b"
        />
        <StatsChart
          title="Гостевые аккаунты"
          total={stats.guests.total}
          data={stats.guests.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#f59e0b"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatsChart
          title="Опубликованные поездки"
          data={stats.trips.published.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          type="bar"
          color="#8b5cf6"
        />
        <StatsChart
          title="Бронирования"
          data={stats.bookings.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#ec4899"
        />
        <StatsChart
          title="Завершенные поездки"
          total={stats.trips.completed.total}
          data={stats.trips.completed.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#f59e0b"
        />
        <StatsChart
          title="Жалобы"
          data={stats.reports.graph}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          type="bar"
          color="#ef4444"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsChart
          title="Сумма пополнений (UZS)"
          data={stats.wallet.graph}
          dataKey="amount"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#10b981"
        />

        <StatsChart
          title="Активные водители (>1 поездки)"
          total={stats.activeDrivers?.total || 0}
          data={stats.activeDrivers?.graph || []}
          dataKey="count"
          range={range}
          onRangeChange={(v) => setRange(v as any)}
          color="#8b5cf6"
          type="line"
        />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Топ поисков маршрутов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.searches.top.length > 0 ? (
                stats.searches.top.map((search, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm">{search.city || "Не указано"}</span>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">{search.count} раз</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
