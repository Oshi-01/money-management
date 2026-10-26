"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const primaryNames = ["Dashboard", "Transactions", "Categories", "Loans"];
const itemClass = "flex min-w-0 flex-col items-center justify-center rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BottomNav() {
  const pathname = usePathname();
  const moreItems = navigation.filter(item => !primaryNames.includes(item.name));
  const moreActive = moreItems.some(item => item.href === pathname);
  return (
    <div className="app-panel fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-40 px-2 py-2 lg:hidden">
      <nav aria-label="Quick navigation" className="grid grid-cols-5 gap-1 pb-safe">
        {navigation.filter(item => primaryNames.includes(item.name)).map(item => {
          const active = pathname === item.href;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(itemClass, active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-secondary-foreground")}>
            <item.icon aria-hidden="true" className="mb-1 h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[9px] font-medium min-[360px]:text-[10px]">{item.name}</span>
          </Link>;
        })}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" aria-label="More navigation" className={cn(itemClass, moreActive ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted")}><MoreHorizontal aria-hidden="true" className="mb-1 h-5 w-5" /><span className="text-[9px] font-medium min-[360px]:text-[10px]">More</span></button>} />
          <DropdownMenuContent side="top" align="end" className="mb-2 min-w-52">
            {moreItems.map(item => <DropdownMenuItem key={item.href} render={<Link href={item.href} />}><item.icon aria-hidden="true" className="h-4 w-4" />{item.name}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
