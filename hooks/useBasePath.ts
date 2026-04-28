"use client";

import { usePathname } from "next/navigation";

/**
 * Returns the active sidebar root: "super-admin" or "admin".
 * Used to build context-aware links (so the same component works under
 * both /admin/* and /super-admin/* without hard-coding the prefix).
 */
export const useBasePath = (): "admin" | "super-admin" => {
  const pathname = usePathname() ?? "";
  return pathname.startsWith("/super-admin") ? "super-admin" : "admin";
};
