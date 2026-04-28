import {
  Activity,
  Bell,
  CircleDollarSign,
  Flag,
  GalleryVertical,
  Home,
  Logs,
  Route,
  ShieldAlert,
  ShieldUser,
  TicketPercent,
  TrendingUp,
  UserRoundCheck,
  Users,
  UserStar,
  UserX,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { AdminPermission, AdminPermissionKey } from "@/lib/utils";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: AdminPermissionKey;
  superAdminOnly?: boolean;
  group?: string;
  exactMatch?: boolean;
};

// =========== Admin sidebar items ===========
export const adminItems: NavItem[] = [
  { title: "Главная", url: "/admin", icon: Home, exactMatch: true },

  { title: "Пользователи", url: "/admin/users-search", icon: Users, permission: AdminPermission.USERS },
  { title: "Забаненные", url: "/admin/users-banned", icon: UserX, permission: AdminPermission.USERS },

  { title: "Поездки", url: "/admin/trips", icon: Route, permission: AdminPermission.TRIPS },
  { title: "Жалобы", url: "/admin/reports", icon: Flag, permission: AdminPermission.REPORTS },
  {
    title: "Заявки",
    url: "/admin/applications",
    icon: UserRoundCheck,
    permission: AdminPermission.DRIVER_APPLICATIONS,
  },

  { title: "Уведомления", url: "/admin/notifications", icon: Bell, permission: AdminPermission.NOTIFICATIONS },
  { title: "Промокоды", url: "/admin/promocodes", icon: TicketPercent, permission: AdminPermission.PROMOCODES },
  { title: "Модерация", url: "/admin/moderation", icon: ShieldAlert, permission: AdminPermission.MODERATION },
  { title: "Блог", url: "/admin/blogs", icon: GalleryVertical, permission: AdminPermission.BLOGS },
];

// =========== SuperAdmin sidebar items ===========
export const superAdminItems: NavItem[] = [
  { title: "Главная", url: "/super-admin", icon: Home, exactMatch: true, group: "OVERVIEW" },

  { title: "Пользователи", url: "/super-admin/stats/users", icon: Users, group: "АНАЛИТИКА" },
  { title: "Поездки", url: "/super-admin/stats/trips", icon: Route, group: "АНАЛИТИКА" },
  { title: "Кошельки", url: "/super-admin/stats/wallet", icon: Wallet, group: "АНАЛИТИКА" },
  { title: "Активные сейчас", url: "/super-admin/stats/active-trips", icon: Activity, group: "АНАЛИТИКА" },
  { title: "Жалобы", url: "/super-admin/stats/reports", icon: Flag, group: "АНАЛИТИКА" },
  { title: "Админы", url: "/super-admin/stats/admins", icon: TrendingUp, group: "АНАЛИТИКА" },

  // Operational pages mirrored from admin section
  { title: "Поиск пользователя", url: "/super-admin/users-search", icon: Users, group: "ОПЕРАЦИИ" },
  { title: "Забаненные", url: "/super-admin/users-banned", icon: UserX, group: "ОПЕРАЦИИ" },
  { title: "Поездки", url: "/super-admin/trips", icon: Route, group: "ОПЕРАЦИИ" },
  { title: "Жалобы", url: "/super-admin/reports", icon: Flag, group: "ОПЕРАЦИИ" },
  { title: "Заявки", url: "/super-admin/applications", icon: UserRoundCheck, group: "ОПЕРАЦИИ" },
  { title: "Уведомления", url: "/super-admin/notifications", icon: Bell, group: "ОПЕРАЦИИ" },
  { title: "Промокоды", url: "/super-admin/promocodes", icon: TicketPercent, group: "ОПЕРАЦИИ" },
  { title: "Модерация", url: "/super-admin/moderation", icon: ShieldAlert, group: "ОПЕРАЦИИ" },
  { title: "Блог", url: "/super-admin/blogs", icon: GalleryVertical, group: "ОПЕРАЦИИ" },

  { title: "Финансы", url: "/super-admin/wallets", icon: CircleDollarSign, group: "СПИСКИ" },
  { title: "Гости", url: "/super-admin/guests", icon: ShieldUser, group: "СПИСКИ" },
  { title: "Активные поездки", url: "/super-admin/active-trips", icon: Activity, group: "СПИСКИ" },
  { title: "Завершённые поездки", url: "/super-admin/finished-trips", icon: Route, group: "СПИСКИ" },

  { title: "Админы", url: "/super-admin/admins", icon: UserStar, group: "УПРАВЛЕНИЕ" },
  { title: "Журнал действий", url: "/super-admin/logs", icon: Logs, group: "УПРАВЛЕНИЕ" },
];
