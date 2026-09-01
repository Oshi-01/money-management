"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full w-20 bg-emerald-600 rounded-[40px] flex flex-col items-center py-6 shadow-md overflow-hidden">
      <TooltipProvider>
        <nav className="flex-1 w-full flex flex-col items-center gap-6 mt-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger render={
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5.5 w-5.5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                } />
                <TooltipContent side="right" className="bg-emerald-900 text-white border-none ml-2">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </div>
  );
}
