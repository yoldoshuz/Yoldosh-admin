"use client";

import { Activity, UserCheck, Users, Zap } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { StatsHeader } from "@/components/shared/stats/StatsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { useGetDauMau } from "@/hooks/adminHooks";
import { formatCompactNumber } from "@/lib/utils";
import type { UserSegment } from "@/types";

const SEGMENTS: { key: UserSegment; label: string; description: string }[] = [
  { key: "real", label: "Реальные", description: "registration_source = 'user'" },
  { key: "bots", label: "Боты", description: "from_bot + reg_bot" },
  { key: "all", label: "Все", description: "Все зарегистрированные" },
  { key: "guests", label: "Гости", description: "Анонимные поиски без userId" },
];

const SegmentBlock = ({
  segKey,
  label,
  description,
  data,
  loading,
}: {
  segKey: UserSegment;
  label: string;
  description: string;
  data: any;
  loading?: boolean;
}) => {
  const dauCount = data?.dau?.count;
  const mauCount = data?.mau?.count;
  const stickiness = data?.stickiness;
  const dauDrivers = data?.dau?.drivers;
  const dauPassengers = data?.dau?.passengers;
  const showRoleBreakdown = segKey !== "guests";

  return (
    <StatsSection title={label} description={description}>
      <div className={`grid grid-cols-2 gap-3 ${showRoleBreakdown ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <StatCard title="DAU" value={dauCount} icon={Activity} tone="emerald" subtext="за 24 ч" loading={loading} />
        <StatCard title="MAU" value={mauCount} icon={Users} tone="sky" subtext="за 30 дней" loading={loading} />
        <StatCard
          title="Stickiness"
          value={stickiness != null ? `${(Number(stickiness) * 100).toFixed(1)}%` : undefined}
          icon={Zap}
          tone="violet"
          subtext="DAU ÷ MAU"
          loading={loading}
        />
        {showRoleBreakdown && (
          <StatCard
            title="DAU · водители"
            value={dauDrivers}
            icon={UserCheck}
            tone="amber"
            subtext={`Пассажиров: ${formatCompactNumber(dauPassengers ?? 0)}`}
            loading={loading}
          />
        )}
      </div>
    </StatsSection>
  );
};

export const DauMauStats = () => {
  const { data, isLoading } = useGetDauMau();

  return (
    <div className="space-y-6">
      <StatsHeader title="DAU / MAU" subtitle="Активность пользователей · сегментировано" withRange={false} />

      {data?.now && (
        <p className="text-muted-foreground text-xs">
          Снапшот на {new Date(data.now).toLocaleString("ru-RU")}.
          {data.windows?.dauStart && <> Окно DAU: {new Date(data.windows.dauStart).toLocaleString("ru-RU")}+.</>}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {SEGMENTS.map(({ key, label, description }) => (
          <SegmentBlock
            key={key}
            segKey={key}
            label={label}
            description={description}
            data={data?.bySegment?.[key]}
            loading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};
