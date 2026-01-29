"use client";

import { Activity, Car, CreditCard, ShieldAlert, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminStats } from "@/hooks/adminHooks";

export const Home = () => {
  const { data: stats, isLoading, isError } = useGetAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="title-text">Главное</h2>
        <p className="subtitle-text">Обзор основных показателей за последние 30 дней</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !stats ? (
        <div className="p-8 text-red-500">Ошибка загрузки статистики. Попробуйте обновить страницу.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершено поездок</CardTitle>
              <Car className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trips.completed.total}</div>
              <p className="text-xs text-muted-foreground">Успешные поездки</p>
            </CardContent>
          </Card>
        </div>
      )
      }
    </div >
  );
};
