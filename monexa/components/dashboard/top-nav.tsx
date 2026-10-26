"use client";

import { Search } from "lucide-react";
import Link from "next/link";
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
import { type FormEvent, useState } from "react";
import { navigation } from "./nav-links";
import { useRouter } from "next/navigation";
import { VoiceAssistant } from "./voice-assistant";
import { FloatingCalculator } from "./floating-calculator";

interface TopNavProps {
  voiceAIProvider?: "groq" | "ollama" | null;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function TopNav({ user, voiceAIProvider = null }: TopNavProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <header className="app-panel flex h-[72px] shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
      {/* Search Bar */}
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const query = search.trim();
          router.push(query ? `/dashboard/transactions?q=${encodeURIComponent(query)}` : "/dashboard/transactions");
        }}
        role="search"
        className="hidden max-w-md flex-1 items-center rounded-xl bg-muted px-4 py-3 focus-within:ring-2 focus-within:ring-ring/20 md:flex"
      >
        <button type="submit" aria-label="Search transactions" className="mr-2 rounded-full text-primary hover:text-primary">
          <Search className="h-4 w-4" />
        </button>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search transactions"
          placeholder="Search transactions…"
          className="bg-transparent border-none outline-none text-sm text-secondary-foreground w-full placeholder:text-muted-foreground"
        />
      </form>

      <Link href="/dashboard" className="rounded text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">Monexa</Link>
      {/* Right Icons */}
      <div className="flex items-center gap-4 ml-auto">
        <VoiceAssistant aiProvider={voiceAIProvider} />
        <FloatingCalculator />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button aria-label="Account menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-border bg-primary-soft text-xs font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            <DropdownMenuGroup className="lg:hidden">
              <DropdownMenuSeparator />
              {navigation.filter(item => ["Wallets & cards", "Categories", "Reports", "Profile", "Settings"].includes(item.name)).map(item => (
                <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                  <item.icon aria-hidden="true" className="h-4 w-4" />{item.name}
                </DropdownMenuItem>
              ))}
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
    </header>
  );
}
