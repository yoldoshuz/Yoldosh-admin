"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ANALYTICS_PRESETS,
  AnalyticsFilterValue,
  AnalyticsPreset,
  clampRange,
  formatDay,
  presetToRange,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsPlatform, AnalyticsRole } from "@/types";

// ============================================================
// Единая панель фильтров раздела аналитики.
//
// Фильтр по app_version обязателен на всех экранах: без него
// невозможно отличить баг релиза от изменения поведения пользователей.
// ============================================================

const ymdToDate = (ymd: string): Date | undefined => {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const dateToYmd = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
};

const ALL = "__all__";

interface Props {
  value: AnalyticsFilterValue;
  onChange: (value: AnalyticsFilterValue) => void;
  /** Роль применима не везде (например, у чатов её нет). */
  withRole?: boolean;
  className?: string;
}

export const AnalyticsFilters = ({ value, onChange, withRole = true, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.preset === "custom" ? { from: ymdToDate(value.from), to: ymdToDate(value.to) } : undefined
  );
  const [versionDraft, setVersionDraft] = useState(value.app_version ?? "");

  const applyPreset = (preset: AnalyticsPreset) => onChange({ ...value, preset, ...presetToRange(preset) });

  const applyCustom = () => {
    if (!draft?.from || !draft?.to) return;
    const { from, to } = clampRange(dateToYmd(draft.from), dateToYmd(draft.to));
    onChange({ ...value, preset: "custom", from, to });
    setOpen(false);
  };

  const commitVersion = () => {
    const next = versionDraft.trim();
    if ((value.app_version ?? "") === next) return;
    onChange({ ...value, app_version: next || undefined });
  };

  const customLabel = value.preset === "custom" ? `${formatDay(value.from)} – ${formatDay(value.to)}` : "Свои даты";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="bg-card flex flex-wrap items-center gap-1 rounded-xl border p-1">
        {ANALYTICS_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3",
              value.preset === p.key
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs",
                value.preset === "custom" ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white" : ""
              )}
            >
              <CalendarIcon className="size-3.5" />
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar mode="range" numberOfMonths={2} selected={draft} onSelect={setDraft} autoFocus />
            <div className="flex items-center justify-between gap-2 border-t p-2">
              <p className="text-muted-foreground px-1 text-[11px]">Максимум 90 дней на запрос</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Отмена
                </Button>
                <Button size="sm" className="btn-primary" onClick={applyCustom} disabled={!draft?.from || !draft?.to}>
                  Применить
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Select
        value={value.platform ?? ALL}
        onValueChange={(v) => onChange({ ...value, platform: v === ALL ? undefined : (v as AnalyticsPlatform) })}
      >
        <SelectTrigger className="h-9 w-[130px] text-xs">
          <SelectValue placeholder="Платформа" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все платформы</SelectItem>
          <SelectItem value="android">Android</SelectItem>
          <SelectItem value="ios">iOS</SelectItem>
        </SelectContent>
      </Select>

      {withRole && (
        <Select
          value={value.role ?? ALL}
          onValueChange={(v) => onChange({ ...value, role: v === ALL ? undefined : (v as AnalyticsRole) })}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все роли</SelectItem>
            <SelectItem value="passenger">Пассажиры</SelectItem>
            <SelectItem value="driver">Водители</SelectItem>
          </SelectContent>
        </Select>
      )}

      <div className="relative">
        <Input
          value={versionDraft}
          onChange={(e) => setVersionDraft(e.target.value)}
          onBlur={commitVersion}
          onKeyDown={(e) => e.key === "Enter" && commitVersion()}
          placeholder="Версия, напр. 1.4.2"
          className="h-9 w-[165px] pr-7 text-xs"
        />
        {!!versionDraft && (
          <button
            type="button"
            onClick={() => {
              setVersionDraft("");
              onChange({ ...value, app_version: undefined });
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Сбросить версию"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
