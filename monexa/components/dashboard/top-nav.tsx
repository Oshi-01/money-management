"use client";

import { LogOut, User as UserIcon, Menu } from "lucide-react";
import { logOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTransition, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-links";

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function TopNav({ user }: TopNavProps) {
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    startTransition(async () => {
      await logOut();
    });
  };

  // Close mobile menu when pathname changes (user navigates)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
      <div className="flex items-center md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="-ml-3 mr-2" />
          }>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="h-16 flex items-center justify-start border-b px-6">
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white pt-3">Monexa</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto h-full">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400",
                        "mr-3 h-5 w-5"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="relative h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          }>
            <UserIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isPending} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
