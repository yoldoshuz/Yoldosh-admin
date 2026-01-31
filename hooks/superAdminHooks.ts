import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { createAdminSchema } from "@/lib/schemas";
import { DashboardStats } from "@/types";

export const useGetSuperAdminProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.superAdmin.profile(),
    queryFn: async () => {
      const { data } = await api.get("/super-admin/me");
      return data.data; // Backend nests data
    },
    retry: false,
    enabled,
  });
};

// Admins
export const useGetAllAdmins = (filters: any) => {
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.admins(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/admins", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data; // FIX: Return the nested data object
    },
    // FIX: Correctly calculate the next page based on backend response
    getNextPageParam: (lastPage: any, allPages: any, lastPageParam: number) => {
      return lastPage.rows.length === 10 ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: z.infer<typeof createAdminSchema>) => {
      const { data } = await api.post("/super-admin/admins", values);
      return data;
    },
    onSuccess: () => {
      toast.success("Администратор успешно создан");
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.admins({}) });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adminId: string) => {
      await api.delete(`/super-admin/admins/${adminId}`);
    },
    onSuccess: () => {
      toast.success("Администратор успешно удален");
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.admins({}) });
    },
  });
};

export const useUpdateAdminPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adminId, permissions }: { adminId: string; permissions: any }) => {
      const { data } = await api.put(`/super-admin/admins/${adminId}/permissions`, permissions);
      return data;
    },
    onSuccess: () => {
      toast.success("Права доступа администратора успешно обновлены.");
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.admins({}) });
    },
  });
};

// Logs
export const useGetAdminLogs = (adminId: string, filters: any) => {
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.logs(adminId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(`/super-admin/admins/${adminId}/logs`, {
        params: { ...filters, page: pageParam, limit: 20 },
      });
      return data.data; // FIX: Return the nested data object
    },
    // FIX: Correctly calculate the next page
    getNextPageParam: (lastPage: any, allPages: any, lastPageParam: number) => {
      return lastPage.logs.length === 20 ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!adminId,
  });
};

// Stats
export const useGetSuperAdminStats = (range: "day" | "week" | "month" = "month") => {
  return useQuery({
    queryKey: [...queryKeys.superAdmin.stats(), range], // Include range in key
    queryFn: async () => {
      const { data } = await api.get("/super-admin/stats", { params: { range } });
      return data.data as DashboardStats;
    },
  });
};

export const useGetSuperAdminActiveTrips = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ["super-admin", "active-trips", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/active-trips", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};

// Finished Trips
export const useGetSuperAdminFinishedTrips = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ["super-admin", "finished-trips", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/finished-trips", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};

// Wallets
export const useGetSuperAdminWallets = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ["super-admin", "wallets", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/wallets", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};

// Guests
export const useGetSuperAdminGuests = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ["super-admin", "guests", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/guests", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};

// Reports (Super Admin)
export const useGetSuperAdminReports = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ["super-admin", "reports", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/reports", {
        params: { ...filters, page: pageParam, limit: 10 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};
