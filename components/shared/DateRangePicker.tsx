"use client";

import { useState } from "react";
import { format, subDays, subHours, subMonths, subYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangeValue = {
  preset: "day" | "week" | "month" | "year" | "custom";
  from?: string; // ISO
  to?: string; // ISO
};

const PRESETS: { key: DateRangeValue["preset"]; label: string }[] = [
  { key: "day", label: "24 ч" },
  { key: "week", label: "7 дн" },
  { key: "month", label: "30 дн" },
  { key: "year", label: "12 мес" },
];

const isoFor = (preset: DateRangeValue["preset"]): { from?: string; to?: string } => {
  const now = new Date();
  switch (preset) {
    case "day":
      return { from: subHours(now, 24).toISOString(), to: now.toISOString() };
    case "week":
      return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
    case "month":
      return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
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
}

export const DateRangePicker = ({ value, onChange, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.preset === "custom" && value.from && value.to
      ? { from: new Date(value.from), to: new Date(value.to) }
      : undefined
  );

  const handlePreset = (p: DateRangeValue["preset"]) => {
    const range = isoFor(p);
    onChange({ preset: p, ...range });
  };

  const handleCustomApply = () => {
    if (draft?.from && draft?.to) {
      onChange({
        preset: "custom",
        from: draft.from.toISOString(),
        to: draft.to.toISOString(),
      });
      setOpen(false);
    }
  };

  const customLabel =
    value.preset === "custom" && value.from && value.to
      ? `${format(new Date(value.from), "d MMM")} – ${format(new Date(value.to), "d MMM")}`
      : "Выбрать даты";

  return (
    <div className={cn("flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1", className)}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => handlePreset(p.key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition",
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
              "h-7 gap-1.5 rounded-lg px-3 text-xs",
              value.preset === "custom" ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white" : ""
            )}
          >
            <CalendarIcon className="size-3.5" />
            {customLabel}
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
