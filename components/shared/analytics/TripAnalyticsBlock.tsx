"use client";

import { Eye, MessageSquare, MousePointerClick, Ticket, Users } from "lucide-react";

import { Conversion } from "@/components/shared/analytics/Metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsTripStats } from "@/hooks/analyticsHooks";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Блок аналитики внутри карточки поездки.
//
// Отвечает на вопрос «трип не бронируют, потому что его не видят,
// или потому что видят и не хотят»: показы → тапы → детали → бронь.
// ============================================================

const Metric = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="bg-muted/30 rounded-lg border p-2.5">
    <p className="text-muted-foreground inline-flex items-center gap-1 text-[10px] uppercase">
      {icon}
      {label}
    </p>
    <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    {hint && <p className="text-muted-foreground mt-0.5 text-[10px]">{hint}</p>}
  </div>
);

export const TripAnalyticsBlock = ({ tripId }: { tripId: string }) => {
  const { data, isLoading, isError } = useAnalyticsTripStats(tripId);
  const s = data?.data;

  // Трекинг доезжает до витрин не сразу: для свежих поездок пустой ответ —
  // это норма, а не ошибка, поэтому блок просто прячем.
  if (isError) return null;

  return (
    <Card className="component shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Аналитика поездки</CardTitle>
        <p className="text-muted-foreground text-xs">
          Поездку не бронируют, потому что её не видят, или потому что видят и не хотят
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : !s ? (
          <p className="text-muted-foreground text-sm">Данных по этой поездке пока нет</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              icon={<Eye className="size-3" />}
              label="Показы карточки"
              value={formatNumber(s.card_impressions)}
            />
            <Metric
              icon={<MousePointerClick className="size-3" />}
              label="Тапы"
              value={formatNumber(s.card_taps)}
              hint="в выдаче поиска"
            />
            <Metric icon={<Eye className="size-3" />} label="Открытий деталей" value={formatNumber(s.detail_views)} />
            <Metric icon={<Users className="size-3" />} label="Уник. зрителей" value={formatNumber(s.unique_viewers)} />
            <Metric
              icon={<MessageSquare className="size-3" />}
              label="Начато чатов"
              value={formatNumber(s.chats_started)}
            />
            <Metric icon={<Ticket className="size-3" />} label="Начато броней" value={formatNumber(s.booking_starts)} />
            <Metric icon={<Ticket className="size-3" />} label="Броней" value={formatNumber(s.bookings)} />
            <div className="bg-muted/30 rounded-lg border p-2.5">
              <p className="text-muted-foreground text-[10px] uppercase">CTR / просмотр→бронь</p>
              <p className="mt-0.5 text-sm font-semibold">
                <Conversion
                  pct={s.ctr_pct}
                  numerator={s.card_taps}
                  denominator={s.card_impressions}
                  label="Тапы из показов"
                />
                <span className="text-muted-foreground mx-1">/</span>
                <Conversion
                  pct={s.view_to_book_pct}
                  numerator={s.bookings}
                  denominator={s.detail_views}
                  label="Брони из просмотров деталей"
                />
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
