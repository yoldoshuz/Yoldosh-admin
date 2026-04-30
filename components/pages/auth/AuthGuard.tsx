"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminProfile } from "@/hooks/adminHooks";
import { useGetSuperAdminProfile } from "@/hooks/superAdminHooks";

type Role = "Admin" | "SuperAdmin";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: Role;
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const router = useRouter();

  const isSuperAdminRoute = requiredRole === "SuperAdmin";

  const { data: adminData, isLoading: isAdminLoading, isError: isAdminError } = useGetAdminProfile(!isSuperAdminRoute);
  const {
    data: superAdminData,
    isLoading: isSuperAdminLoading,
    isError: isSuperAdminError,
  } = useGetSuperAdminProfile(isSuperAdminRoute);

  const user = isSuperAdminRoute ? superAdminData : adminData;
  const isLoading = isSuperAdminRoute ? isSuperAdminLoading : isAdminLoading;
  const isError = isSuperAdminRoute ? isSuperAdminError : isAdminError;

  useEffect(() => {
    const tokenKey = requiredRole === "SuperAdmin" ? "super-admin-token" : "admin-token";
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;

    if (!token) {
      router.replace("/"); // Перенаправляем на логин, если нужного токена нет
      return;
    }

    if (!isLoading && (isError || !user)) {
      localStorage.removeItem(tokenKey);
      router.replace("/");
    }

    if (!isLoading && user) {
      const roleHierarchy = { Admin: 1, SuperAdmin: 2 };
      const userLevel = roleHierarchy[user.role as Role] || 0; // [cite: 741]
      const requiredLevel = roleHierarchy[requiredRole];

      // Если уровень пользователя ниже требуемого
      if (userLevel < requiredLevel) {
        // Если пользователь Admin пытается зайти на SuperAdmin роут
        if (user.role === "Admin") {
          router.replace("/admin"); // Редирект на его дашборд
        } else {
          // В иных случаях (например, если что-то пошло не так) - на логин
          router.replace("/");
        }
      }
    }
    // Зависимости useEffect остаются прежними, но логика внутри изменилась
  }, [isLoading, isError, user, router, requiredRole]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen">
        <Skeleton className="component hidden h-screen w-80 !rounded-none md:block" />
        <div className="flex-1 space-y-6 p-8">
          <Skeleton className="component h-10 w-1/3" />
          <Skeleton className="component h-96 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
