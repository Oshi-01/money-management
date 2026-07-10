"use client";

import { Bell, Search, Sun, User as UserIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { logOut } from "@/app/actions/auth";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Sidebar } from "./sidebar";

interface TopNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function TopNav({ user }: TopNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="flex h-14 items-center justify-between px-2 w-full">
      {/* Mobile Sidebar Trigger (Only visible on md and smaller) */}
      <div className="md:hidden flex items-center mr-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          } />
          <SheetContent side="left" className="w-[100px] p-0 bg-[#eef7f2] border-none flex flex-col items-center py-6 gap-6">
            <div className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex-1 pb-6 h-full">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden md:flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
        <Search className="h-4 w-4 text-emerald-600 mr-2" />
        <input
          type="text"
          placeholder="Search Here"
          className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="text-gray-500 hover:text-gray-700 transition-colors hidden sm:block">
          <Sun className="h-5 w-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition-colors hidden sm:block">
          <Bell className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium text-xs shadow-sm hover:bg-emerald-700 transition-colors focus:outline-none">
              {initials}
            </button>
          } />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={
              <form action={logOut} className="w-full">
                <button type="submit" className="w-full text-left">Log out</button>
              </form>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
