"use client";

import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Значение хранится как строка формата "YYYY-MM-DDTHH:mm" (как у <input type="datetime-local">),
// чтобы оставаться совместимым с существующими isoToLocalInput / localInputToIso.

const pad = (n: number) => String(n).padStart(2, "0");

const dateToLocalString = (date: Date, time: string) => {
  const [h, m] = time.split(":");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${h || "00"}:${m || "00"}`;
};

const parseLocalString = (value?: string) => {
  if (!value) return { date: undefined as Date | undefined, time: "00:00" };
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  if (!y || !mo || !d) return { date: undefined, time: "00:00" };
  return { date: new Date(y, mo - 1, d), time: timePart.slice(0, 5) };
};

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Выберите дату" }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { date, time } = parseLocalString(value);

  const handleSelectDate = (selected?: Date) => {
    if (!selected) return;
    onChange(dateToLocalString(selected, time));
  };

  const handleTimeChange = (newTime: string) => {
    // Меняем время только если дата уже выбрана
    if (date) {
      onChange(dateToLocalString(date, newTime));
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? (
            <span className="truncate">
              {format(date, "d MMMM yyyy", { locale: ru })}, {time}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          {date && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clear}
              className="hover:bg-muted ml-auto rounded p-0.5"
              aria-label="Очистить"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          locale={ru}
          autoFocus
          captionLayout="dropdown"
        />
        <div className="flex items-center gap-2 border-t p-3">
          <span className="text-muted-foreground text-sm">Время</span>
          <Input
            type="time"
            value={time}
            disabled={!date}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-auto flex-1"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <X className="mr-1.5 h-3.5 w-3.5" /> Очистить
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Готово
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
