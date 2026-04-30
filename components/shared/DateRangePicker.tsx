"use client";

import { useState } from "react";
import { endOfDay, format, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ============================================================
// Date range presets — must match backend (`shared/utils/dateRange.ts`).
// `day` is kept as an alias for `today` for backward compatibility.
// ============================================================
export type DateRangePreset = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom" | "day";

export type DateRangeValue = {
  preset: DateRangePreset;
  from?: string; // ISO
  to?: string; // ISO
};

const PRESETS: { key: DateRangePreset; label: string; mobileLabel?: string }[] = [
  { key: "today", label: "Сегодня", mobileLabel: "День" },
  { key: "yesterday", label: "Вчера", mobileLabel: "Вчера" },
  { key: "week", label: "7 дней", mobileLabel: "7 дн" },
  { key: "month", label: "30 дней", mobileLabel: "30 дн" },
  { key: "quarter", label: "Квартал", mobileLabel: "Квартал" },
  { key: "year", label: "Год", mobileLabel: "Год" },
];

const isoFor = (preset: DateRangePreset): { from?: string; to?: string } => {
  const now = new Date();
  switch (preset) {
    case "today":
    case "day":
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() };
    }
    case "week":
      return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
    case "month":
      return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
    case "quarter":
      return { from: subDays(now, 90).toISOString(), to: now.toISOString() };
    case "year":
      return { from: subYears(now, 1).toISOString(), to: now.toISOString() };
    case "custom":
      return {};
  }
};

interface Props {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  className?: string;
  /** Compact mode for narrow toolbars (uses short labels). */
  compact?: boolean;
}

export const DateRangePicker = ({ value, onChange, className, compact = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.preset === "custom" && value.from && value.to
      ? { from: new Date(value.from), to: new Date(value.to) }
      : undefined
  );

  const handlePreset = (p: DateRangePreset) => {
    const range = isoFor(p);
    onChange({ preset: p, ...range });
  };

  const handleCustomApply = () => {
    if (draft?.from && draft?.to) {
      onChange({
        preset: "custom",
        from: startOfDay(draft.from).toISOString(),
        to: endOfDay(draft.to).toISOString(),
      });
      setOpen(false);
    }
  };

  const customLabel =
    value.preset === "custom" && value.from && value.to
      ? `${format(new Date(value.from), "d MMM")} – ${format(new Date(value.to), "d MMM")}`
      : "Свои даты";

  // Treat "day" as "today" for highlighting
  const activePreset = value.preset === "day" ? "today" : value.preset;

  return (
    <div
      className={cn(
        "bg-card flex flex-wrap items-center gap-1 rounded-xl border p-1",
        compact ? "max-w-full overflow-x-auto" : "",
        className
      )}
    >
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => handlePreset(p.key)}
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3",
            activePreset === p.key
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="hidden sm:inline">{p.label}</span>
          <span className="sm:hidden">{p.mobileLabel ?? p.label}</span>
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs sm:px-3",
              value.preset === "custom" ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white" : ""
            )}
          >
            <CalendarIcon className="size-3.5" />
            <span className="hidden sm:inline">{customLabel}</span>
            <span className="sm:hidden">
              {value.preset === "custom" && value.from && value.to
                ? `${format(new Date(value.from), "d.MM")}–${format(new Date(value.to), "d.MM")}`
                : "Даты"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar mode="range" numberOfMonths={2} selected={draft} onSelect={setDraft} autoFocus />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleCustomApply} disabled={!draft?.from || !draft?.to} className="btn-primary">
              Применить
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ============================================================
// Convert UI value → backend query params.
// Always sends `range`, and `from`/`to` only when needed.
// ============================================================
export const rangeToQuery = (value: DateRangeValue): { range: DateRangePreset; from?: string; to?: string } => {
  if (value.preset === "custom" && value.from && value.to) {
    return { range: "custom", from: value.from, to: value.to };
  }
  return { range: value.preset };
};

export const DEFAULT_RANGE: DateRangeValue = { preset: "month" };
