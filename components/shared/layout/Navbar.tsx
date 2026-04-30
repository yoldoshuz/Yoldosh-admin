import { Moon, Sun, UserRound } from "lucide-react";

import { ThemeSwitcher } from "@/components/functions/ThemeSwitcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Navbar = () => {
  return (
    <nav className="component top-0 z-5 flex w-full items-center justify-between border-b px-6 py-4">
      <div>
        <SidebarTrigger />
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-12">
        <div className="flex flex-row items-center justify-center gap-2">
          <Sun className="text-secondary-foreground size-4" />
          <ThemeSwitcher />
          <Moon className="text-secondary-foreground size-4" />
        </div>
      </div>
    </nav>
  );
};
