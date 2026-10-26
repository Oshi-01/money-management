"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="flex h-full flex-col gap-1.5">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={pathname === item.href ? "page" : undefined}
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pathname === item.href ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-muted hover:text-foreground",
            item.name === "Profile" && "mt-auto",
          )}
        >
          <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
