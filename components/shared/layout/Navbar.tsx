import { Moon, Sun, UserRound } from "lucide-react";

import { ThemeSwitcher } from "@/components/functions/ThemeSwitcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Navbar = () => {
  return (
    <nav className="flex items-center justify-between top-0 px-6 py-4 w-full z-5 component border-b">
      <div>
        <SidebarTrigger />
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-12">
        <div className="flex flex-row items-center justify-center gap-2">
          <Sun className="size-4 text-secondary-foreground" />
          <ThemeSwitcher />
          <Moon className="size-4 text-secondary-foreground" />
        </div>
        <div className="flex items-center justify-center gap-2 ">
          <div className="p-2 rounded-full bg-emerald-500">
            <UserRound className="size-5 text-white" />
          </div>
          <span className="hidden sm:flex text-base font-semibold">Администратор</span>
        </div>
      </div>
    </nav>
  );
};
