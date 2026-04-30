"use client";

import { Inbox, LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: "primary" | "ghost" };
  className?: string;
}

export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "bg-muted/40 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          className={cn(action.variant === "primary" ? "btn-primary" : "")}
          variant={action.variant === "primary" ? "default" : "ghost"}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
