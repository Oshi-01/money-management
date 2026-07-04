"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center overflow-x-auto no-scrollbar gap-2 px-2 pb-safe">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[72px] py-1.5 px-2 rounded-2xl transition-all duration-200",
                isActive 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
