"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="app-panel fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-40 px-2 py-2 lg:hidden">
      <nav aria-label="Quick navigation" className="grid grid-cols-5 gap-1 pb-safe">
        {navigation.filter(item => ["Dashboard", "Transactions", "Loans", "Budgets", "Savings Goals"].includes(item.name)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-secondary-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium min-[360px]:text-[10px]">{item.name === "Savings Goals" ? "Savings" : item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
