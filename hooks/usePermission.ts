"use client";

import { useGetAdminProfile } from "@/hooks/adminHooks";
import { useGetSuperAdminProfile } from "@/hooks/superAdminHooks";
import { AdminPermissionKey } from "@/lib/utils";

/**
 * Resolves the current admin (Admin or SuperAdmin) and exposes:
 *   - hasPermission(key): SuperAdmin always returns true
 *   - isSuperAdmin: boolean
 *   - role / profile / loading state
 *
 * Both endpoints are queried; whichever resolves wins. This is safe
 * because the API gates by JWT and only one will succeed in practice.
 */
export const usePermission = () => {
  const isSuperAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/super-admin");

  const adminQ = useGetAdminProfile(!isSuperAdminPath);
  const superQ = useGetSuperAdminProfile(isSuperAdminPath);

  const profile = superQ.data ?? adminQ.data ?? null;
  const role: "Admin" | "SuperAdmin" | null = profile?.role ?? null;
  const isSuperAdmin = role === "SuperAdmin";
  const permissions = profile?.permissions ?? {};

  const hasPermission = (key?: AdminPermissionKey | string | null): boolean => {
    if (!profile) return false;
    if (isSuperAdmin) return true;
    if (!key) return true;
    return permissions[key as string] === true;
  };

  return {
    profile,
    role,
    isSuperAdmin,
    permissions,
    hasPermission,
    isLoading: superQ.isLoading || adminQ.isLoading,
    isError: superQ.isError && adminQ.isError,
  };
};
