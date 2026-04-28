import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  banUserSchema,
  carModelSchema,
  editTripSchema,
  globalNotificationSchema,
  globalPromoCodeSchema,
  loginSchema,
  personalPromoCodeSchema,
  updateReportStatusSchema,
} from "@/lib/schemas";

// --- Auth Hooks (Keep as is) ---
export const useAdminLogin = () => {
  return useMutation({
    mutationFn: async (values: z.infer<typeof loginSchema>) => {
      const { data } = await api.post("/admin/login", values);
      return data;
    },
    onSuccess: () => {
      toast.success("Вы успешно вошли в систему.");
    },
  });
};

export const useAdminLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/admin/logout");
    },
    onSuccess: () => {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("super-admin-token");
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("super-admin-token");
      queryClient.clear();
      window.location.href = "/";
    },
  });
};

export const useGetAdminProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.admin.profile(),
    queryFn: async () => {
      const { data } = await api.get("/admin/me");
      return data.data;
    },
    retry: false,
    enabled,
  });
};

type RangeParams = {
  range?: "day" | "week" | "month" | "year" | "custom";
  from?: string;
  to?: string;
};

const stripEmpty = (params: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const k of Object.keys(params)) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== "") out[k] = params[k];
  }
  return out;
};

export const useGetAdminStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.stats(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/overview", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

export const useGetUsersStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsUsers(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/users", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

export const useGetTripsStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsTrips(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/trips", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

export const useGetWalletStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsWallet(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/wallet", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

export const useGetActiveTripsStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsActiveTrips(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/active-trips", { params: stripEmpty(params) });
      return data.data;
    },
    refetchInterval: 30_000,
  });
};

export const useGetReportsStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsReports(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/reports", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

export const useGetAdminsStats = (params: RangeParams = {}) => {
  return useQuery({
    queryKey: queryKeys.admin.statsAdmins(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/stats/admins", { params: stripEmpty(params) });
      return data.data;
    },
  });
};

// --- Car Applications (Updated) ---
// Renamed from useGetDriverApplications to useGetCarApplications
export const useGetCarApplications = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    // Update query key to reflect 'car' applications
    queryKey: queryKeys.admin.carApplications(filters),
    queryFn: async ({ pageParam = 1 }) => {
      // Endpoint remains the same but returns Car data now
      const { data } = await api.get("/admin/applications", {
        params: { ...filters, page: pageParam, limit: 9 }, // Adjust limit as needed for card layout
      });
      // Assuming backend returns { data: { applications: [], total: number, ... } }
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Use currentPage and totalPages from the response
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });
};

// Renamed from useUpdateApplicationStatus to useUpdateCarApplicationStatus
// Zod schema for the mutation input (optional but good practice)
const updateCarStatusSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  status: z.enum(["VERIFIED", "REJECTED"] as const, { message: "Status is required" }),
  rejectionReason: z.string().optional(), // Optional reason
});

export const useUpdateCarApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Define the mutation function input type
    mutationFn: async (values: z.infer<typeof updateCarStatusSchema>) => {
      const { carId, status, rejectionReason } = values;
      // Call the updated backend endpoint with carId
      const { data } = await api.patch(`/admin/applications/${carId}/status`, {
        status: status,
        ...(rejectionReason && { rejectionReason: rejectionReason }), // Only include reason if provided
      });
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Application status successfully updated to ${variables.status}`);
      // Invalidate queries related to car applications to refetch data
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.carApplications({}), // Invalidate all car application queries
        refetchType: "all", // Refetch active and inactive queries
      });
      // Optionally, invalidate user details if role might change
      // queryClient.invalidateQueries(queryKeys.admin.userDetails(data?.application?.driver_id));
    },
    onError: (error: any) => {
      // Error handling is likely done by the API interceptor, but you can add specific logic here if needed
      console.error("Update application status error:", error);
      // toast.error("Failed to update application status."); // Interceptor shows toast
    },
  });
};

// --- Reports Hooks (Keep as is, assuming backend is correct) ---
export const useGetReports = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.reports(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/reports", { params: { ...filters, page: pageParam } });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: z.infer<typeof updateReportStatusSchema>) => {
      await api.patch(`/admin/reports/${values.reportId}`, {
        status: values.status,
      });
    },
    onSuccess: () => {
      toast.success("Статус жалобы успешно обновлен");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports({}) });
    },
  });
};

// --- Users, Search, Ban Hooks (Keep as is, assuming backend is correct) ---
export const useGetAllUsers = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/users", {
        params: { ...filters, page: pageParam, limit: 12 },
      });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
  });
};

// useSearchUsers likely doesn't need infinite query
export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: queryKeys.admin.searchUsers(query),
    queryFn: async () => {
      const { data } = await api.get("/admin/users/search", { params: { query } });
      return data.data;
    },
    enabled: !!query && query.length > 2, // Only run if query has min length
  });
};

export const useGetUserDetails = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.admin.userDetails(userId),
    queryFn: async () => {
      const { data } = await api.get(`/admin/users/${userId}`);
      return data.data;
    },
    enabled: !!userId, // Only run if userId is provided
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: z.infer<typeof banUserSchema>) => {
      await api.post(`/admin/users/${values.userId}/ban`, {
        reason: values.reason,
        durationInDays: values.durationInDays,
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Пользователь успешно забанен");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetails(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.bannedUsers({}) });
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/users/${userId}/unban`);
    },
    onSuccess: (_, userId) => {
      toast.success("Пользователь успешно разбанен");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetails(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.bannedUsers({}) });
    },
  });
};

export const useGetBannedUsers = (filters: { [key: string]: any } = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.bannedUsers(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/users/banned", {
        params: { ...filters, page: pageParam, limit: 12 },
      });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};

// --- Trips Hooks (Keep as is) ---
export const useGetTrips = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.trips(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/trips", { params: { ...filters, page: pageParam } });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
  });
};

export const useEditTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: z.infer<typeof editTripSchema>) => {
      const { tripId, departure_ts, ...rest } = values;

      const payload: any = { ...rest };

      if (departure_ts) {
        payload.departure_ts = new Date(departure_ts).toISOString();
      }

      await api.patch(`/admin/trips/${tripId}`, payload);
    },
    onSuccess: () => {
      toast.success("Поездка успешно обновлена");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips({}) });
      queryClient.invalidateQueries({ queryKey: ["trip", "details"] }); // если есть
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => {
      await api.delete(`/admin/trips/${tripId}`);
    },
    onSuccess: () => {
      toast.success("Поездка успешно удалена");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips({}) });
    },
  });
};

// Assuming useGetTripDetails exists for detailed view (keep as is)
export const useGetTripDetails = (tripId: string) => {
  return useQuery({
    queryKey: queryKeys.admin.tripDetails(tripId),
    queryFn: async () => {
      const { data } = await api.get(`/admin/trips/details/${tripId}`);
      return data.data;
    },
    enabled: !!tripId,
  });
};

// --- Notifications Hooks (Keep as is) ---
export const useGetNotifications = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.notifications(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/notifications/global", { params: { ...filters, page: pageParam } });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
  });
};

export const useCreateGlobalNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: z.infer<typeof globalNotificationSchema>) => {
      await api.post("/admin/notifications/global", values);
    },
    onSuccess: () => {
      toast.success("Глобальное уведомление отправлено");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications({}) });
    },
  });
};

// --- Word Moderation Hooks (Keep as is) ---
export const useGetRestrictedWords = (filters: { [key: string]: any }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.restrictedWords(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/admin/moderation/words", {
        params: { ...filters, page: pageParam },
      });
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
  });
};

export const useCreateRestrictedWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { word: string }) => {
      await api.post("/admin/moderation/words", values);
    },
    onSuccess: () => {
      toast.success("Слово успешно добавлен в список.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.restrictedWords({}) });
    },
  });
};

export const useDeleteRestrictedWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wordId: number) => {
      await api.delete(`/admin/moderation/words/${wordId}`);
    },
    onSuccess: () => {
      toast.success("Слово успешно удалено.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.restrictedWords({}) });
    },
  });
};

// --- Promocodes Hooks (Keep as is) ---
export const useGetUserPromoCodes = () => {
  return useQuery({
    queryKey: queryKeys.admin.promoCodes("user"),
    queryFn: async () => {
      const { data } = await api.get("/admin/user-promocodes");
      // Ensure the backend returns data in a consistent structure
      return data.data?.promoCodes ?? []; // Default to empty array if structure is unexpected
    },
  });
};

export const useGetGlobalPromoCodes = () => {
  return useQuery({
    queryKey: queryKeys.admin.promoCodes("global"),
    queryFn: async () => {
      const { data } = await api.get("/admin/promocodes");
      return data.data?.promoCodes ?? [];
    },
  });
};

type GrantPromoCodePayload =
  | (z.infer<typeof personalPromoCodeSchema> & { type: "SINGLE_USER" })
  | (z.infer<typeof globalPromoCodeSchema> & { type: "GLOBAL" });

export const useGrantPromoCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: GrantPromoCodePayload) => {
      await api.post(`/admin/promocodes`, values);
    },
    onSuccess: (_, variables) => {
      toast.success("Промокод успешно создан");
      // Invalidate both user and global lists, or be more specific based on type
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.promoCodes(variables.type === "GLOBAL" ? "global" : "user"),
      });
    },
  });
};

// Assuming useEditPromocode exists (keep as is)
export const useEditPromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promoCodeId: string) => {
      // Adjust payload as needed
      await api.put(`/admin/promocodes/${promoCodeId}`, {
        /* payload for edit */
      });
    },
    onSuccess: () => {
      toast.success("Промокод успешно изменен");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.promoCodes("user") });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.promoCodes("global") });
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promoCodeId: string) => {
      await api.delete(`/admin/promocodes/${promoCodeId}`);
    },
    onSuccess: () => {
      toast.success("Промокод успешно удален");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.promoCodes("user") });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.promoCodes("global") });
    },
  });
};

// --- Blog Hooks ---
export const useGetBlogsAdmin = (filters: { [key: string]: any }) => {
  return useQuery({
    queryKey: ["admin", "blogs", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/blog", { params: filters });
      return data.data;
    },
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      await api.post("/admin/blog", values);
    },
    onSuccess: () => {
      toast.success("Статья успешно создана");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.put(`/admin/blog/${id}`, data);
    },
    onSuccess: () => {
      toast.success("Статья успешно обновлена");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/blog/${id}`);
    },
    onSuccess: () => {
      toast.success("Статья удалена");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });
};

export const useUploadBlogImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("uploadBlogImage", file);
      const { data } = await api.post("/admin/blog/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data.url; // Возвращает URL загруженной картинки
    },
  });
};

export const useChangeBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
      reason,
    }: {
      bookingId: string;
      status: "CANCELLED" | "CONFIRMED" | "PENDING";
      reason?: string;
    }) => {
      const { data } = await api.patch(`/admin/bookings/${bookingId}/status`, {
        status,
        reason,
      });
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Статус брони изменён на ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips({}) });
      // Инвалидируем детали пользователя (там тоже видны брони)
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: () => {
      toast.error("Не удалось изменить статус брони");
    },
  });
};

export const useChangeTripStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      status,
      reason,
    }: {
      tripId: string;
      status: "CREATED" | "CANCELED";
      reason?: string;
    }) => {
      const { data } = await api.patch(`/admin/trips/${tripId}/force-status`, {
        status,
        reason,
      });
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Статус поездки изменён на ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: () => {
      toast.error("Не удалось изменить статус поездки");
    },
  });
};
