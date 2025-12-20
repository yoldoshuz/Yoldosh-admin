import {
  Bell,
  CarFront,
  Flag,
  Home,
  Logs,
  Route,
  ShieldAlert,
  TicketPercent,
  UserRoundCheck,
  UserStar,
} from "lucide-react";

import { AdminPermission } from "@/lib/utils";

export const adminItems = [
  {
    title: "Главное",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Заявки",
    url: "/admin/applications",
    icon: UserRoundCheck,
    permission: AdminPermission.DRIVER_APPLICATIONS,
  },
  {
    title: "Жалобы",
    url: "/admin/reports",
    icon: Flag,
    permission: AdminPermission.REPORTS,
  },
  {
    title: "Поездки",
    url: "/admin/trips",
    icon: Route,
    permission: AdminPermission.TRIPS,
  },
  {
    title: "Уведомления",
    url: "/admin/notifications",
    icon: Bell,
    permission: AdminPermission.NOTIFICATIONS,
  },
  {
    title: "Промокоды",
    url: "/admin/promocodes",
    icon: TicketPercent,
    permission: AdminPermission.PROMOCODES,
  },
  {
    title: "Модерация",
    url: "/admin/moderation",
    icon: ShieldAlert,
    permission: AdminPermission.MODERATION,
  },
];

export const superAdminItems = [
  {
    title: "Главная",
    url: "/super-admin",
    icon: Home,
  },
  {
    title: "Администраторы",
    url: "/super-admin/admins",
    icon: UserStar,
  },
  {
    title: "Логи",
    url: "/super-admin/logs",
    icon: Logs,
  },
];
