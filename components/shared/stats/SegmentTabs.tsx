"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { UserSegment } from "@/types";

const ORDER: UserSegment[] = ["real", "bots", "guests", "all"];

const LABELS: Record<UserSegment, string> = {
  real: "Реальные",
  bots: "Боты",
  guests: "Гости",
  all: "Все",
};

interface SegmentTabsProps {
  value: UserSegment;
  onChange: (next: UserSegment) => void;
  /** When false, hide the "guests" option. Useful where guests have no analogous data. */
  withGuests?: boolean;
  className?: string;
}

export const SegmentTabs = ({ value, onChange, withGuests = true, className }: SegmentTabsProps) => {
  const items = withGuests ? ORDER : ORDER.filter((s) => s !== "guests");
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as UserSegment)} className={cn("w-fit", className)}>
      <TabsList>
        {items.map((s) => (
          <TabsTrigger key={s} value={s} className="px-3">
            {LABELS[s]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
