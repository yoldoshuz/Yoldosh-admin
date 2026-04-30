import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { stripEmpty } from "@/hooks/_factory";
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

// Per-admin logs
export const useGetAdminLogs = (adminId: string, filters: any) => {
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.logs(adminId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(`/super-admin/admins/${adminId}/logs`, {
        params: { ...filters, page: pageParam, limit: 20 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any, _all: any, lastPageParam: number) => {
      return lastPage.logs?.length === 20 ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!adminId,
  });
};

// Global logs across all admins
export const useGetGlobalLogs = (filters: any) => {
  const cleaned: any = {};
  for (const k of Object.keys(filters || {})) {
    const v = filters[k];
    if (v === undefined || v === null || v === "") continue;
    cleaned[k] = Array.isArray(v) ? v.join(",") : v;
  }
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.globalLogs(cleaned),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(`/super-admin/logs`, {
        params: { ...cleaned, page: pageParam, limit: 25 },
      });
      return data.data;
    },
    getNextPageParam: (lastPage: any, _all: any, lastPageParam: number) => {
      return lastPage.logs?.length === 25 ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Detailed profile of a single admin (sessions timeline + stats + recent actions)
export const useGetAdminProfileById = (adminId: string, range?: { from?: string; to?: string }) => {
  const params: any = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;
  return useQuery({
    queryKey: queryKeys.superAdmin.adminProfile(adminId, params),
    queryFn: async () => {
      const { data } = await api.get(`/super-admin/admins/${adminId}`, { params });
      return data.data;
    },
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

// =============================================================
// Bookings — super-admin (mirrors /admin/bookings without permission gate)
// =============================================================
type SuperAdminBookingsFilters = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  tripId?: string;
  passengerId?: string;
  driverId?: string;
  fromCity?: string;
  toCity?: string;
  dateField?: "createdAt" | "departure_ts";
  range?: string;
  from?: string;
  to?: string;
};

export const useGetSuperAdminBookings = (filters: SuperAdminBookingsFilters = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.bookings(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/bookings", {
        params: { ...stripEmpty(filters), page: pageParam, limit: filters.limit ?? 20 },
      });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};

export const useGetSuperAdminBookingDetails = (bookingId: string) => {
  return useQuery({
    queryKey: queryKeys.superAdmin.bookingDetails(bookingId),
    queryFn: async () => {
      const { data } = await api.get(`/super-admin/bookings/${bookingId}`);
      return data.data;
    },
    enabled: !!bookingId,
  });
};

// =============================================================
// Searches — aggregated search routes (super-admin only)
// =============================================================
type SearchesFilters = {
  page?: number;
  limit?: number;
  sortBy?: "count" | "last_searched_at";
  sortOrder?: "ASC" | "DESC";
  search?: string;
  range?: string;
  from?: string;
  to?: string;
};

export const useGetSuperAdminSearches = (filters: SearchesFilters = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.superAdmin.searches(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/super-admin/searches", {
        params: { ...stripEmpty(filters), page: pageParam, limit: filters.limit ?? 20 },
      });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};
