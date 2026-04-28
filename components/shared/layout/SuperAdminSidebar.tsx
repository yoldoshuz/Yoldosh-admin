"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarIcon, LogOut } from "lucide-react";

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
import { superAdminItems } from "@/contants";
import { useAdminLogout } from "@/hooks/adminHooks";
import { useGetSuperAdminProfile } from "@/hooks/superAdminHooks";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, url: string, exact?: boolean): boolean => {
  if (exact) return pathname === url;
  if (pathname === url) return true;
  return pathname.startsWith(`${url}/`);
};

export const SuperAdminSidebar = () => {
  const pathname = usePathname();
  const { mutate: logout, isPending } = useAdminLogout();
  const { data: profile } = useGetSuperAdminProfile();

  const handleLogout = () => logout();

  // Group items by their `group` field while preserving order
  const groups: { name: string; items: typeof superAdminItems }[] = [];
  for (const it of superAdminItems) {
    const g = it.group ?? "OVERVIEW";
    let bucket = groups.find((b) => b.name === g);
    if (!bucket) {
      bucket = { name: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(it);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup className="h-full px-3 py-4">
          <SidebarGroupLabel asChild>
            <div className="flex items-center gap-3 px-1 pb-3 mb-3 mt-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-2 text-white shadow-md shadow-emerald-500/25">
                <CarIcon className="size-5" />
              </div>
              <div className="flex flex-col leading-none">
                <h1 className="text-base font-semibold text-foreground">Yoldosh</h1>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Super Admin</p>
              </div>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent className="h-full pt-2">
            <SidebarMenu className="flex h-full flex-col gap-0.5">
              {groups.map((group, gi) => (
                <div key={group.name + gi} className="space-y-1">
                  {gi > 0 && (
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.name}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.url, item.exactMatch);
                      return (
                        <SidebarMenuItem key={`${item.url}-${item.title}-${item.group}`}>
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              "h-9 px-2.5 text-sm transition",
                              active
                                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-500/15"
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
                </div>
              ))}

              <div className="mt-auto pt-3 space-y-2">
                {profile && (
                  <div className="rounded-lg border bg-card px-3 py-2 text-xs">
                    <p className="font-medium truncate">
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
                      className="flex items-center gap-2.5 cursor-pointer"
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
