import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { baseUrl } from "@/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format document URL
export const formatDocUrl = (url?: string) => {
  if (!url) return "https://placehold.co/300x200/EEE/AAA?text=No+Image";
  return `${baseUrl}${url}`;
};

// Utility function to format error messages
export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};
// Utility function to format dates
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Status color utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-200/20 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400",
    VERIFIED: "bg-green-200/20 text-green-800 dark:bg-green-800/20 dark:text-green-400",
    REJECTED: "bg-red-200/20 text-red-800 dark:bg-red-800/20 dark:text-red-400",
    RESOLVED: "bg-blue-200/20 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400",
    CONFIRMED: "bg-green-200/20 text-green-800 dark:bg-green-800/20 dark:text-green-400",
    CANCELLED: "bg-red-200/20 text-red-800 dark:bg-red-800/20 dark:text-red-400",
    CANCELED: "bg-red-200/20 text-red-800 dark:bg-red-800/20 dark:text-red-400",
    COMPLETED: "bg-green-200/20 text-green-800 dark:bg-green-800/20 dark:text-green-400",
    // Notification Types from enum
    trips: "bg-sky-200/20 text-sky-800 dark:bg-sky-800/20 dark:text-sky-400",
    newsAndAgreement: "bg-indigo-200/20 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-400",
    promotionAndDiscounts: "bg-purple-200/20 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400",
    messages: "bg-pink-200/20 text-pink-800 dark:bg-pink-800/20 dark:text-pink-400",
    general: "bg-amber-200/20 text-amber-800 dark:bg-amber-800/20 dark:text-amber-400",
    // Trips
    CREATED: "bg-blue-200/20 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-200/20 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400",
    // Auditory types
    DRIVERS: "bg-blue-200/20 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400",
    PASSENGERS: "bg-red-200/20 text-red-800 dark:bg-red-800/20 dark:text-red-400",
    ALL: "bg-cyan-200/20 text-cyan-800 dark:bg-cyan-800/20 dark:text-cyan-400",
    // Promocodes
    ACTIVE: "bg-emerald-500 text-white",
    INACTIVE: "bg-red-500 text-white",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

// Role-based access control
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    Admin: 1,
    SuperAdmin: 2,
  };
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};

export const AdminPermission = {
  DRIVER_APPLICATIONS: "driver_applications",
  REPORTS: "reports",
  TRIPS: "trips",
  NOTIFICATIONS: "notifications",
  PROMOCODES: "promocodes",
  MODERATION: "moderation",
} as const;

export const adminPermissionLabels: { [key in (typeof AdminPermission)[keyof typeof AdminPermission]]: string } = {
  [AdminPermission.DRIVER_APPLICATIONS]: "Заявки водителей",
  [AdminPermission.REPORTS]: "Жалобы",
  [AdminPermission.TRIPS]: "Поездки",
  [AdminPermission.NOTIFICATIONS]: "Уведомления",
  [AdminPermission.PROMOCODES]: "Промокоды",
  [AdminPermission.MODERATION]: "Модерация",
};
