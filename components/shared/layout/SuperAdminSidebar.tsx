"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@radix-ui/react-separator";
import { CarIcon, Home, LogOut, Logs, UserStar } from "lucide-react";

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

export const SuperAdminSidebar = () => {
  const pathname = usePathname();
  const { mutate: logout, isPending } = useAdminLogout();

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-gray-50 dark:bg-gray-950">
        <SidebarGroup className="h-full">
          <SidebarGroupLabel>
            <div className="flex flex-row items-center justify-center gap-2 mt-6">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-700 text-white rounded-xl p-2">
                <CarIcon className="size-5" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-bold text-black dark:text-white">Yoldosh</h1>
                <p>Super admin</p>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-8 h-full">
            <Separator orientation="horizontal" />
            <SidebarMenu className="flex flex-col h-full py-4">
              <div className="mt-2 space-y-1">
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-emerald-700/40 text-emerald-950 dark:text-emerald-500 dark:hover:bg-gray-50/10 dark:hover:text-white"
                    >
                      <Link
                        href={item.url}
                        className={`${pathname === item.url ? "bg-emerald-800/20 text-emerald-900" : "text-emerald-800"}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
              <div className="flex justify-center items-end h-full w-full">
                <SidebarMenuItem className="w-full">
                  <SidebarMenuButton
                    asChild
                    className="hover:text-red-800 dark:hover:bg-gray-50/10 dark:hover:text-white  transition"
                  >
                    <button onClick={handleLogout} disabled={isPending} className="text-red-500 cursor-pointer">
                      <LogOut />
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
