"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  ExternalLink,
  RefreshCcw,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { OverviewChart } from "@/components/shared/layout/OverviewChart";
import { StatCard } from "@/components/shared/StatCard";
import { StatsSection, TopList } from "@/components/shared/stats/StatsSections";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppmetricaApplications, useAppmetricaByTime, useAppmetricaStat } from "@/hooks/appmetricaHooks";
import { isAppmetricaConfigured, toAmDate } from "@/lib/appmetrica";
import { cn, formatCompactNumber, formatDate, formatNumber } from "@/lib/utils";

// =============================================================
// AppMetrica overview page (super-admin)
//
// Note: AppMetrica often rejects an entire request if even one metric is
// invalid (error 4002). To avoid that, we run independent queries per
// scope (users / sessions / crashes / errors / events) and let each card
// fail independently.
// =============================================================

const PRESETS: { key: "7" | "30" | "90"; label: string }[] = [
  { key: "7", label: "7 дн" },
  { key: "30", label: "30 дн" },
  { key: "90", label: "90 дн" },
];

const SectionError = ({ message }: { message?: string }) =>
  message ? (
    <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {message}
    </div>
  ) : null;

const PlatformBadge = ({ platforms }: { platforms?: { platform: string; id: string }[] }) => {
  if (!platforms?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {platforms.map((p) => (
        <span
          key={`${p.platform}-${p.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {p.platform}
        </span>
      ))}
    </div>
  );
};

export const AppMetrica = () => {
  const configured = isAppmetricaConfigured();

  const [appId, setAppId] = useState<number | null>(null);
  const [preset, setPreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    data: apps,
    isLoading: appsLoading,
    isError: appsError,
    error: appsErr,
    refetch: refetchApps,
  } = useAppmetricaApplications();

  // Auto-select first app once apps load
  useEffect(() => {
    if (appId == null && apps?.length) setAppId(apps[0].id);
  }, [apps, appId]);

  const { date1, date2 } = useMemo(() => {
    if (preset === "custom" && customRange?.from && customRange?.to) {
      return { date1: toAmDate(customRange.from), date2: toAmDate(customRange.to) };
    }
    const days = preset === "custom" ? 30 : Number(preset);
    const today = new Date();
    return { date1: toAmDate(subDays(today, days)), date2: toAmDate(today) };
  }, [preset, customRange]);

  const ready = configured && appId != null;
  const baseParams = ready ? { ids: appId!, date1, date2 } : null;

  // ===== Users (scope u) =====
  const usersParams = baseParams ? { ...baseParams, metrics: ["ym:u:users", "ym:u:newUsers"] } : null;
  const usersKpi = useAppmetricaStat(usersParams);
  const usersTs = useAppmetricaByTime(usersParams ? { ...usersParams, group: "day" as const } : null);

  // ===== Sessions (scope s) — must be a separate query: AppMetrica error 4011
  // disallows mixing scopes (e.g. ym:u:users + ym:s:sessions) without filters.
  const sessionsParams = baseParams ? { ...baseParams, metrics: ["ym:s:sessions"] } : null;
  const sessionsKpi = useAppmetricaStat(sessionsParams);
  const sessionsTs = useAppmetricaByTime(sessionsParams ? { ...sessionsParams, group: "day" as const } : null);

  // ===== Crashes (scope cr) =====
  const crashesParams = baseParams ? { ...baseParams, metrics: ["ym:cr:crashes"] } : null;
  const crashesKpi = useAppmetricaStat(crashesParams);
  const crashesTs = useAppmetricaByTime(crashesParams ? { ...crashesParams, group: "day" as const } : null);

  // ===== Errors (scope er) =====
  const errorsParams = baseParams ? { ...baseParams, metrics: ["ym:er:errors"] } : null;
  const errorsKpi = useAppmetricaStat(errorsParams);
  const errorsTs = useAppmetricaByTime(errorsParams ? { ...errorsParams, group: "day" as const } : null);

  // ===== Top breakdowns (all scope u, single metric) =====
  const topOs = useAppmetricaStat(
    baseParams
      ? {
          ...baseParams,
          metrics: ["ym:u:users"],
          dimensions: ["ym:u:operatingSystemInfo"],
          sort: "-ym:u:users",
          limit: 10,
        }
      : null
  );

  const topCountries = useAppmetricaStat(
    baseParams
      ? {
          ...baseParams,
          metrics: ["ym:u:users"],
          dimensions: ["ym:u:regionCountry"],
          sort: "-ym:u:users",
          limit: 10,
        }
      : null
  );

  // Versions live in sessions scope: per AppMetrica, `appVersion`/`appVersionName`
  // are not valid in user scope (4001), so we ask "sessions by version" instead.
  const topVersions = useAppmetricaStat(
    baseParams
      ? {
          ...baseParams,
          metrics: ["ym:s:sessions"],
          dimensions: ["ym:s:appVersion"],
          sort: "-ym:s:sessions",
          limit: 10,
        }
      : null
  );

  // KPI extraction
  const usersTotal = usersKpi.data?.totals?.[0];
  const newUsersTotal = usersKpi.data?.totals?.[1];
  const sessionsTotal = sessionsKpi.data?.totals?.[0];
  const crashesTotal = crashesKpi.data?.totals?.[0];
  const errorsTotal = errorsKpi.data?.totals?.[0];

  const sessionsPerUser = usersTotal && sessionsTotal ? sessionsTotal / usersTotal : null;

  // Time-series adapters (each query has its own intervals)
  const buildSeries = (
    data: { time_intervals?: [string, string][]; data?: Array<{ metrics: number[][] }> } | undefined,
    metricIndex: number
  ) => {
    const intervals = data?.time_intervals ?? [];
    const row = data?.data?.[0]?.metrics?.[metricIndex] ?? [];
    return intervals.map((iv, i) => ({
      date: format(new Date(iv[0]), "d MMM"),
      timestamp: iv[0],
      value: Number(row?.[i] ?? 0),
    }));
  };

  // Top-list adapter for stat reports with one metric
  const toTopList = (resp: any | undefined, metricIndex = 0) => {
    if (!resp?.data) return [];
    return resp.data
      .map((row: any) => {
        const dim = row.dimensions?.[0];
        const label = dim?.name ?? dim?.id ?? "—";
        const count = Number(row.metrics?.[metricIndex] ?? 0);
        return { label: String(label), count };
      })
      .filter((x: any) => x.label && x.label !== "null");
  };

  const handleExportCsv = () => {
    if (!apps) return;
    const app = apps.find((a) => a.id === appId);
    const rows: string[] = [];
    rows.push("metric,value");
    rows.push(`Active users,${usersTotal ?? 0}`);
    rows.push(`New users,${newUsersTotal ?? 0}`);
    rows.push(`Sessions,${sessionsTotal ?? 0}`);
    rows.push(`Crashes,${crashesTotal ?? 0}`);
    rows.push(`Errors,${errorsTotal ?? 0}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `appmetrica_${app?.name ?? appId}_${date1}_${date2}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ====== UI ======
  if (!configured) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="title-text">AppMetrica</h2>
          <p className="subtitle-text">Подключение к Yandex AppMetrica</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">OAuth-токен не задан</p>
              <p className="mt-1">
                Добавьте переменную окружения <code className="font-mono">NEXT_PUBLIC_OAUTH_TOKEN</code> в файл{" "}
                <code className="font-mono">.env.local</code> и перезапустите dev-сервер. Токен можно получить в{" "}
                <a
                  href="https://oauth.yandex.ru/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Яндекс OAuth
                </a>{" "}
                со скоупами <code className="font-mono">appmetrica:read</code> /{" "}
                <code className="font-mono">appmetrica:write</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedApp = apps?.find((a) => a.id === appId);
  const customLabel =
    preset === "custom" && customRange?.from && customRange?.to
      ? `${format(customRange.from, "d MMM")} – ${format(customRange.to, "d MMM")}`
      : "Свои даты";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="title-text flex items-center gap-2">
            <BarChart3 className="size-6 text-emerald-500" />
            AppMetrica
          </h2>
          <p className="subtitle-text">
            {selectedApp?.name ? (
              <>
                Аналитика приложения <span className="font-medium text-foreground">{selectedApp.name}</span>
              </>
            ) : (
              <>Подключено к Yandex AppMetrica</>
            )}{" "}
            · {date1} → {date2}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* App selector */}
          <Select
            value={appId != null ? String(appId) : undefined}
            onValueChange={(v) => setAppId(Number(v))}
            disabled={appsLoading || !apps?.length}
          >
            <SelectTrigger className="h-9 min-w-[220px]">
              <SelectValue placeholder={appsLoading ? "Загрузка..." : "Выберите приложение"} />
            </SelectTrigger>
            <SelectContent>
              {apps?.map((app) => (
                <SelectItem key={app.id} value={String(app.id)}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-3.5 text-muted-foreground" />
                    <span>{app.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">#{app.id}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date presets */}
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  preset === p.key
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 rounded-lg px-3 text-xs",
                    preset === "custom" ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white" : ""
                  )}
                >
                  <Clock className="size-3.5" />
                  {customLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar mode="range" numberOfMonths={2} selected={customRange} onSelect={setCustomRange} autoFocus />
                <div className="flex justify-end gap-2 border-t p-2">
                  <Button variant="ghost" size="sm" onClick={() => setCalendarOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    className="btn-primary"
                    disabled={!customRange?.from || !customRange?.to}
                    onClick={() => {
                      if (customRange?.from && customRange?.to) {
                        setPreset("custom");
                        setCalendarOpen(false);
                      }
                    }}
                  >
                    Применить
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => {
              refetchApps();
              usersKpi.refetch();
              usersTs.refetch();
              sessionsKpi.refetch();
              sessionsTs.refetch();
              crashesKpi.refetch();
              crashesTs.refetch();
              errorsKpi.refetch();
              errorsTs.refetch();
              topOs.refetch();
              topCountries.refetch();
              topVersions.refetch();
            }}
          >
            <RefreshCcw className="size-3.5" />
            Обновить
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleExportCsv}
            disabled={!usersKpi.data}
          >
            <Download className="size-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* Errors */}
      {appsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          Не удалось получить список приложений: {(appsErr as Error)?.message ?? "Ошибка"}
        </div>
      )}

      {/* App info card */}
      {selectedApp && (
        <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Приложение</p>
            <p className="mt-0.5 font-semibold">{selectedApp.name}</p>
            <p className="text-xs text-muted-foreground">ID: {selectedApp.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Платформы</p>
            <div className="mt-1.5">
              <PlatformBadge platforms={selectedApp.app_id_on_platform} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Часовой пояс</p>
            <p className="mt-0.5 text-sm">{selectedApp.time_zone_name ?? "—"}</p>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Создано</p>
              <p className="mt-0.5 text-sm">{selectedApp.create_date ? formatDate(selectedApp.create_date) : "—"}</p>
            </div>
            <a
              href={`https://appmetrica.yandex.ru/overview?period=week&groupMethod=calendar&group=day&currency=rub&accuracy=medium&appId=${selectedApp.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
              Открыть
            </a>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Активные"
          value={usersTotal}
          icon={Users}
          tone="emerald"
          subtext="Уникальных за период"
          loading={usersKpi.isLoading}
        />
        <StatCard
          title="Новые"
          value={newUsersTotal}
          icon={Users}
          tone="sky"
          subtext="За период"
          loading={usersKpi.isLoading}
        />
        <StatCard
          title="Сессии"
          value={sessionsTotal}
          icon={Activity}
          tone="violet"
          subtext={sessionsPerUser ? `~${sessionsPerUser.toFixed(2)} на пользователя` : undefined}
          loading={sessionsKpi.isLoading}
        />
        <StatCard
          title="Падений"
          value={crashesTotal}
          icon={AlertTriangle}
          tone={crashesTotal && crashesTotal > 0 ? "red" : "default"}
          highlight={!!crashesTotal && crashesTotal > 0}
          loading={crashesKpi.isLoading}
        />
        <StatCard
          title="Ошибок"
          value={errorsTotal}
          icon={TrendingUp}
          tone={errorsTotal && errorsTotal > 0 ? "amber" : "default"}
          highlight={!!errorsTotal && errorsTotal > 0}
          loading={errorsKpi.isLoading}
        />
      </div>

      {/* KPI errors */}
      {(usersKpi.isError || sessionsKpi.isError || crashesKpi.isError || errorsKpi.isError) && (
        <div className="grid gap-2 lg:grid-cols-2">
          <SectionError message={usersKpi.isError ? `Пользователи: ${(usersKpi.error as Error).message}` : undefined} />
          <SectionError message={sessionsKpi.isError ? `Сессии: ${(sessionsKpi.error as Error).message}` : undefined} />
          <SectionError message={crashesKpi.isError ? `Падения: ${(crashesKpi.error as Error).message}` : undefined} />
          <SectionError message={errorsKpi.isError ? `Ошибки: ${(errorsKpi.error as Error).message}` : undefined} />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart
          title="Аудитория"
          total={usersTotal}
          totalSuffix="активных"
          loading={usersTs.isLoading}
          series={[
            { name: "Активные", data: buildSeries(usersTs.data, 0), color: "var(--chart-1)" },
            { name: "Новые", data: buildSeries(usersTs.data, 1), color: "var(--chart-2)" },
          ]}
        />
        <OverviewChart
          title="Сессии"
          total={sessionsTotal}
          totalSuffix="за период"
          loading={sessionsTs.isLoading}
          series={[{ name: "Сессии", data: buildSeries(sessionsTs.data, 0), color: "var(--chart-3)" }]}
        />
        <OverviewChart
          title="Падения"
          total={crashesTotal ?? 0}
          totalSuffix="всего"
          loading={crashesTs.isLoading}
          type="line"
          series={[{ name: "Падения", data: buildSeries(crashesTs.data, 0), color: "var(--chart-4)" }]}
        />
        <OverviewChart
          title="Ошибки"
          total={errorsTotal ?? 0}
          totalSuffix="всего"
          loading={errorsTs.isLoading}
          type="line"
          series={[{ name: "Ошибки", data: buildSeries(errorsTs.data, 0), color: "var(--chart-5)" }]}
        />
      </div>

      {/* Top lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Топ ОС">
          {topOs.isError ? (
            <SectionError message={(topOs.error as Error)?.message} />
          ) : (
            <TopList data={toTopList(topOs.data)} loading={topOs.isLoading} limit={10} />
          )}
        </StatsSection>
        <StatsSection title="Топ стран">
          {topCountries.isError ? (
            <SectionError message={(topCountries.error as Error)?.message} />
          ) : (
            <TopList data={toTopList(topCountries.data)} loading={topCountries.isLoading} limit={10} />
          )}
        </StatsSection>
      </div>

      <StatsSection title="Версии приложения" description="Сессии по версиям приложения">
        {topVersions.isError ? (
          <SectionError message={(topVersions.error as Error)?.message} />
        ) : (
          <TopList data={toTopList(topVersions.data)} loading={topVersions.isLoading} limit={10} />
        )}
      </StatsSection>

      {/* Footer hint */}
      <div className="rounded-xl border border-dashed bg-card p-4 text-xs text-muted-foreground">
        Источник данных: Yandex AppMetrica API ·{" "}
        <a
          href="https://appmetrica.yandex.ru/docs/ru/mobile-api/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-emerald-600 hover:underline"
        >
          Документация
        </a>
        . Используются скоупы <code className="font-mono">appmetrica:read</code> /{" "}
        <code className="font-mono">appmetrica:write</code>.
        {usersTotal != null && newUsersTotal != null && (
          <>
            {" "}
            Возвращающихся:{" "}
            <span className="tabular-nums">{formatNumber(Math.max(0, usersTotal - newUsersTotal))}</span> (~
            {usersTotal ? Math.round(((usersTotal - newUsersTotal) / usersTotal) * 100) : 0}%).
          </>
        )}{" "}
        Записей в отчёте по аудитории:{" "}
        {usersKpi.data?.total_rows != null ? formatCompactNumber(usersKpi.data.total_rows) : "—"}.
      </div>
    </div>
  );
};
