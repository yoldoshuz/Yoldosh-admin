"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { useBasePath } from "@/hooks/useBasePath";
import { entityTypeToPath } from "@/lib/utils";
import { AdminLogEntityType, EntitySnapshot } from "@/types";

interface EntityLinkProps {
  type: AdminLogEntityType | string | null | undefined;
  id: string | null | undefined;
  snapshot?: EntitySnapshot | null;
  basePath?: "admin" | "super-admin";
  showSubLabel?: boolean;
  className?: string;
}

/**
 * Renders a clickable label for an entity referenced by a log entry.
 * Falls back to a static tag when no route is available.
 *
 * `basePath` defaults to whatever section the user is currently in
 * (admin or super-admin), so the same component works in both areas.
 */
export const EntityLink = ({ type, id, snapshot, basePath, showSubLabel = false, className }: EntityLinkProps) => {
  const ctxBase = useBasePath();
  const label = snapshot?.label || (id ? `${type ?? "ENTITY"} · ${id.slice(0, 8)}…` : "—");
  const sub = snapshot?.subLabel;
  const path = entityTypeToPath(type, id, basePath ?? ctxBase);

  if (!path) {
    return (
      <span className={`text-foreground ${className ?? ""}`}>
        <span className="font-medium">{label}</span>
        {showSubLabel && sub && <span className="text-muted-foreground ml-1.5 text-xs">· {sub}</span>}
      </span>
    );
  }

  return (
    <Link
      href={path}
      className={`group inline-flex items-baseline gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ${className ?? ""}`}
    >
      <span className="max-w-[300px] truncate font-medium underline-offset-4 group-hover:underline">{label}</span>
      {showSubLabel && sub && <span className="text-muted-foreground text-xs">· {sub}</span>}
      <ExternalLink className="size-3 opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
};
