"use client";

import { adminLogCategoryMeta, cn } from "@/lib/utils";

export const CategoryBadge = ({ category, className }: { category: string | null | undefined; className?: string }) => {
  const key = (category || "OTHER").toUpperCase();
  const meta = adminLogCategoryMeta[key] ?? adminLogCategoryMeta.OTHER;
  return (
    <span className={cn(meta.pill, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
};
