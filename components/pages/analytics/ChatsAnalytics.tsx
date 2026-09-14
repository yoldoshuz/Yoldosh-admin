"use client";

import { MessageCircle, MessagesSquare, Send, Ticket, Timer, Users } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { Conversion } from "@/components/shared/analytics/Metrics";
import { StatCard } from "@/components/shared/StatCard";
import { DistributionList, StatsSection } from "@/components/shared/stats/StatsSections";
import { useAnalyticsChats } from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { chatSourceLabel, formatPct, formatSeconds, num } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Чаты — создано, заходы, сообщения, конверсия в бронь.
// ============================================================

export const AnalyticsChatsPage = () => {
  const { filters, setFilters, query } = useAnalyticsFilters();
  const { data, isLoading, isError, refetch } = useAnalyticsChats(query);
  const s = data?.data;

  const sources = Object.entries(s?.by_source ?? {}).map(([label, count]) => ({
    label: chatSourceLabel(label),
    count: Number(count) || 0,
  }));

  return (
    <AnalyticsPageShell
      title="Аналитика · Чаты"
      subtitle="Переписка между пассажиром и водителем и её вклад в брони"
      icon={MessagesSquare}
      meta={data?.meta}
      filters={filters}
      onFiltersChange={setFilters}
      withRole={false}
      isError={isError}
      onRetry={refetch}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Создано чатов" value={s?.chats_created ?? null} icon={MessageCircle} loading={isLoading} />
        <StatCard title="Заходов в чат" value={s?.chat_opens ?? null} icon={MessagesSquare} loading={isLoading} />
        <StatCard title="Уник. пользователей" value={s?.unique_users ?? null} icon={Users} loading={isLoading} />
        <StatCard title="Сообщений" value={s?.messages_sent ?? null} icon={Send} loading={isLoading} />
        <StatCard
          title="Сообщений на чат"
          value={s?.avg_messages_per_chat != null ? num(s.avg_messages_per_chat).toFixed(1) : null}
          icon={Send}
          tone="sky"
          loading={isLoading}
        />
        <StatCard
          title="Медиана первого ответа"
          value={s ? formatSeconds(s.first_response_median_sec) : null}
          icon={Timer}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          title="Чат → бронь"
          value={s?.chat_to_booking_pct != null ? formatPct(s.chat_to_booking_pct) : null}
          subtext={s ? `${formatNumber(s.chats_created)} чатов за период` : undefined}
          icon={Ticket}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Откуда начинают чат" description="Точка входа в переписку">
          <DistributionList data={sources} loading={isLoading} />
        </StatsSection>

        <StatsSection title="Конверсия в бронь" description="Доля чатов, закончившихся бронированием">
          {isLoading || !s ? (
            <p className="text-muted-foreground text-sm">Нет данных за период</p>
          ) : (
            <div className="space-y-3">
              <p className="text-3xl font-semibold tabular-nums">
                <Conversion
                  pct={s.chat_to_booking_pct}
                  numerator={Math.round((num(s.chats_created) * num(s.chat_to_booking_pct)) / 100)}
                  denominator={s.chats_created}
                  label="Чаты с бронью"
                />
              </p>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${Math.min(100, Math.max(2, num(s.chat_to_booking_pct)))}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Отдельная воронка «Чат → бронь» с пошаговой разбивкой доступна в разделе «Воронки».
              </p>
            </div>
          )}
        </StatsSection>
      </div>
    </AnalyticsPageShell>
  );
};
