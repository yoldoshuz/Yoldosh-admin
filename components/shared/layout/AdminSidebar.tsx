"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarIcon, LogOut, Search } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { adminItems, NavItem } from "@/contants";
import { useAdminLogout } from "@/hooks/adminHooks";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, item: NavItem): boolean => {
  if (item.exactMatch) return pathname === item.url;
  if (pathname === item.url) return true;
  return pathname.startsWith(`${item.url}/`);
};

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { mutate: logout, isPending } = useAdminLogout();
  const { hasPermission, profile } = usePermission();

  const handleLogout = () => logout();

  const allowedItems = adminItems.filter((i) => !i.permission || hasPermission(i.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup className="h-full px-3 py-4">
          <SidebarGroupLabel asChild>
            <div className="mt-2 mb-3 flex items-center gap-3 px-1 pb-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-2 text-white shadow-md shadow-emerald-500/25">
                <CarIcon className="size-5" />
              </div>
              <div className="flex flex-col leading-none">
                <h1 className="text-foreground text-base font-semibold">Yoldosh</h1>
                <p className="text-muted-foreground text-[11px] tracking-wider uppercase">Admin</p>
              </div>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent className="h-full pt-2">
            <SidebarMenu className="flex h-full flex-col gap-0.5">
              <div className="space-y-1">
                {allowedItems.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <SidebarMenuItem key={`${item.url}-${item.title}`}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "h-9 px-2.5 text-sm transition",
                          active
                            ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link href={item.url} className="flex items-center gap-2.5">
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </div>

              <div className="mt-auto space-y-2 pt-3">
                {profile && (
                  <div className="bg-card rounded-lg border px-3 py-2 text-xs">
                    <p className="truncate font-medium">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-muted-foreground truncate">{profile.email}</p>
                  </div>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-9 px-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                  >
                    <button
                      onClick={handleLogout}
                      disabled={isPending}
                      className="flex cursor-pointer items-center gap-2.5"
                    >
                      <LogOut className="size-4 shrink-0" />
                      {isPending ? "Завершаем сессию..." : "Завершить сессию"}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
