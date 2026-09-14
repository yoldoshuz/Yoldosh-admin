"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, History, Loader2, Lock, Server, ShieldAlert, Smartphone } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsUserTimeline } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { useBasePath } from "@/hooks/useBasePath";
import { usePermission } from "@/hooks/usePermission";
import { ANALYTICS_TZ, formatSeconds, humanizeEventName, isServerEvent } from "@/lib/analytics";
import { AdminPermission, cn, formatDate } from "@/lib/utils";
import type { AnalyticsTimelineEvent } from "@/types";

// ============================================================
// Таймлайн пользователя — самый полезный экран на старте.
//
// Поддержка открывает жалобу «не смог забронировать» и видит ровно,
// где человек отвалился. Требует право `users`; каждый просмотр
// пишется на бэке в admin_logs.
// ============================================================

const eventTime = (ts: string) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: ANALYTICS_TZ,
  });
};

const EventRow = ({ event }: { event: AnalyticsTimelineEvent }) => {
  const [open, setOpen] = useState(false);
  const props = event.props ?? {};
  const hasProps = Object.keys(props).length > 0;

  return (
    <li className="border-muted relative border-l pl-4">
      <span className="absolute top-2 -left-[3px] size-1.5 rounded-full bg-emerald-500" />
      <div
        className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1", hasProps && "cursor-pointer")}
        onClick={() => hasProps && setOpen((v) => !v)}
      >
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">{eventTime(event.ts)}</span>
        <span className="text-sm font-medium">{humanizeEventName(event.name)}</span>
        {isServerEvent(event.name) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            <Server className="size-2.5" /> сервер
          </span>
        )}
        {event.screen && <span className="text-muted-foreground text-[11px]">на экране {event.screen}</span>}
        {hasProps && <span className="text-muted-foreground text-[11px] underline">{open ? "скрыть" : "props"}</span>}
      </div>
      {open && hasProps && (
        <pre className="bg-muted/40 mb-1 overflow-x-auto rounded-lg border p-2 text-[11px]">
          {JSON.stringify(props, null, 2)}
        </pre>
      )}
    </li>
  );
};

export const AnalyticsUserTimelinePage = ({ userId }: { userId: string }) => {
  const { filters, setFilters } = useAnalyticsFilters();
  const base = useBasePath();
  const { hasPermission, isLoading: permLoading } = usePermission();
  const allowed = hasPermission(AdminPermission.USERS);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAnalyticsUserTimeline(
    allowed ? userId : "",
    { from: filters.from, to: filters.to }
  );

  const sessions = (data?.pages ?? []).flatMap((p) => p.data?.sessions ?? []);
  const meta = data?.pages?.[0]?.meta;

  if (!permLoading && !allowed) {
    return (
      <AnalyticsPageShell
        title="Таймлайн пользователя"
        icon={Lock}
        filters={filters}
        onFiltersChange={setFilters}
        withFilters={false}
      >
        <StatsSection title="Нет доступа">
          <p className="text-muted-foreground text-sm">
            Просмотр поведения конкретного пользователя требует права «Пользователи».
          </p>
        </StatsSection>
      </AnalyticsPageShell>
    );
  }

  return (
    <AnalyticsPageShell
      title="Таймлайн пользователя"
      subtitle="Сессии и события по порядку — видно, где человек отвалился"
      icon={History}
      meta={meta}
      filters={filters}
      onFiltersChange={setFilters}
      withRole={false}
      actions={
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
          <Link href={`/${base}/users-search/${userId}`}>
            <ChevronLeft className="size-3.5" /> К карточке
          </Link>
        </Button>
      }
    >
      <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Это просмотр поведения конкретного человека — он записан в журнал админ-действий. Персональных данных в props
          нет: телефонов, имён и текстов сообщений трекинг не собирает.
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : !sessions.length ? (
        <StatsSection title="Сессий нет">
          <p className="text-muted-foreground text-sm">
            За выбранный период событий по этому пользователю не было. Сырые события хранятся 6 месяцев.
          </p>
        </StatsSection>
      ) : (
        <>
          {sessions.map((s) => (
            <StatsSection
              key={s.session_id}
              title={formatDate(s.started_at)}
              description={`${formatSeconds(s.duration_sec)} · ${s.events?.length ?? 0} событий`}
            >
              <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="size-3" /> {s.platform ?? "—"}
                  {s.app_version ? ` · ${s.app_version}` : ""}
                </span>
                <span className="font-mono">{s.session_id}</span>
              </div>
              <ul className="space-y-0.5">
                {(s.events ?? []).map((e, i) => (
                  <EventRow key={`${s.session_id}-${i}`} event={e} />
                ))}
              </ul>
            </StatsSection>
          ))}

          {hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="gap-2">
                {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
                Показать ещё
              </Button>
            </div>
          )}
        </>
      )}
    </AnalyticsPageShell>
  );
};
