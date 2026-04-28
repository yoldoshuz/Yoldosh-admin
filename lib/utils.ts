import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { baseUrl } from "@/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format document URL
export const formatDocUrl = (url?: string) => {
  if (!url) return "https://placehold.co/300x200/EEE/AAA?text=No+Image";

  let formatted = url;
  if (formatted.startsWith("/public/")) {
    formatted = formatted.slice("/public".length);
  }

  return `${baseUrl}${formatted}`;
};

export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "An unexpected error occurred";
};

export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "только что";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} дн назад`;
  return formatDate(d);
};

export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null) return "—";
  if (minutes < 1) return "< 1 мин";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  if (h < 24) return m ? `${h} ч ${m} мин` : `${h} ч`;
  const d = Math.floor(h / 24);
  const rh = h - d * 24;
  return rh ? `${d} д ${rh} ч` : `${d} д`;
};

export const formatNumber = (value: number | null | undefined, opts?: Intl.NumberFormatOptions): string => {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU", opts).format(value);
};

export const formatCompactNumber = (value: number | null | undefined): string => {
  if (value == null) return "—";
  if (Math.abs(value) < 1000) return formatNumber(value);
  return new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

export const formatMoney = (value: number | null | undefined, currency = "UZS"): string => {
  if (value == null) return "—";
  return `${formatNumber(value)} ${currency}`;
};

// Status color utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    VERIFIED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    RESOLVED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    CANCELED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    trips: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    newsAndAgreement: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    promotionAndDiscounts: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    messages: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    general: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    CREATED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    DRIVERS: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    PASSENGERS: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    ALL: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    ACTIVE: "bg-emerald-500 text-white",
    INACTIVE: "bg-red-500 text-white",
  };
  return statusColors[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

// Role-based access control
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = { Admin: 1, SuperAdmin: 2 };
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};

export const AdminPermission = {
  DRIVER_APPLICATIONS: "driver_applications",
  REPORTS: "reports",
  TRIPS: "trips",
  NOTIFICATIONS: "notifications",
  PROMOCODES: "promocodes",
  MODERATION: "moderation",
  BLOGS: "blogs",
  USERS: "users",
} as const;

export type AdminPermissionKey = (typeof AdminPermission)[keyof typeof AdminPermission];

export const adminPermissionLabels: Record<AdminPermissionKey, string> = {
  [AdminPermission.DRIVER_APPLICATIONS]: "Заявки водителей",
  [AdminPermission.REPORTS]: "Жалобы",
  [AdminPermission.TRIPS]: "Поездки",
  [AdminPermission.NOTIFICATIONS]: "Уведомления",
  [AdminPermission.PROMOCODES]: "Промокоды",
  [AdminPermission.MODERATION]: "Модерация",
  [AdminPermission.BLOGS]: "Блоги",
  [AdminPermission.USERS]: "Пользователи",
};

// Log category metadata: label, color tone, icon (icon name from lucide-react)
export const adminLogCategoryMeta: Record<string, { label: string; pill: string; dot: string }> = {
  SESSION: { label: "Сессии", pill: "pill-slate", dot: "bg-slate-500" },
  USERS: { label: "Пользователи", pill: "pill-sky", dot: "bg-sky-500" },
  TRIPS: { label: "Поездки", pill: "pill-emerald", dot: "bg-emerald-500" },
  REPORTS: { label: "Жалобы", pill: "pill-red", dot: "bg-red-500" },
  APPLICATIONS: { label: "Заявки", pill: "pill-amber", dot: "bg-amber-500" },
  ADMINS: { label: "Админы", pill: "pill-violet", dot: "bg-violet-500" },
  NOTIFICATIONS: { label: "Уведомления", pill: "pill-sky", dot: "bg-sky-500" },
  MODERATION: { label: "Модерация", pill: "pill-amber", dot: "bg-amber-500" },
  BLOG: { label: "Блог", pill: "pill-violet", dot: "bg-violet-500" },
  PROMOCODES: { label: "Промокоды", pill: "pill-emerald", dot: "bg-emerald-500" },
  OTHER: { label: "Прочее", pill: "pill-slate", dot: "bg-slate-400" },
};

// Map an entity type to a frontend route path
export const entityTypeToPath = (
  type: string | null | undefined,
  id: string | null | undefined,
  basePath: "admin" | "super-admin" = "super-admin"
): string | null => {
  if (!type || !id) return null;
  const root = `/${basePath}`;
  switch (type) {
    case "USER":
      return `${root}/users-search/${id}`;
    case "TRIP":
      return `${root}/trips/${id}`;
    case "BOOKING":
      return `${root}/trips?booking=${id}`;
    case "REPORT":
      return `${root}/reports?focus=${id}`;
    case "DRIVER_APPLICATION":
      return `${root}/applications?focus=${id}`;
    case "ADMIN":
      return `/super-admin/admins/${id}`;
    case "BLOG":
      return `${root}/blogs?focus=${id}`;
    case "NOTIFICATION":
      return `${root}/notifications?focus=${id}`;
    case "RESTRICTED_WORD":
      return `${root}/moderation?focus=${id}`;
    case "PROMOCODE":
      return `${root}/promocodes?focus=${id}`;
    default:
      return null;
  }
};

// Truncate UA strings politely
export const shortUserAgent = (ua: string | null | undefined): string => {
  if (!ua) return "—";
  const m = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);
  const os = ua
    .match(/\(([^)]+)\)/)?.[1]
    ?.split(";")[0]
    ?.trim();
  if (m) return `${m[1]} ${m[2].split(".")[0]}${os ? ` · ${os}` : ""}`;
  return ua.slice(0, 40) + (ua.length > 40 ? "…" : "");
};
