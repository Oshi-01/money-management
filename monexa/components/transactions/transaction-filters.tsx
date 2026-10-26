"use client";

import { useEffect, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParams } from "@/lib/use-query-params";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

const TYPES = [
  { value: "", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
] as const;

export function TransactionFilters({ categories }: { categories: Category[] }) {
  const { searchParams, update, isPending } = useQueryParams();

  const urlSearch = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const categoryId = searchParams.get("category") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  // Typing is instant; the URL (and the server query) updates after a pause.
  const [search, setSearch] = useState(urlSearch);
  const [pushed, setPushed] = useState(urlSearch); // last value this box put into the URL
  const [seenUrl, setSeenUrl] = useState(urlSearch);

  // If the URL changes from somewhere else (e.g. the sidebar link clears the
  // filters), follow it. Changes we pushed ourselves are ignored so characters
  // typed while a search is loading are never overwritten.
  if (urlSearch !== seenUrl) {
    setSeenUrl(urlSearch);
    if (urlSearch !== pushed) {
      setSearch(urlSearch);
      setPushed(urlSearch);
    }
  }

  useEffect(() => {
    const value = search.trim();
    if (value === urlSearch) return;
    const id = setTimeout(() => {
      setPushed(value);
      update({ q: value });
    }, 350);
    return () => clearTimeout(id);
  }, [search, urlSearch, update]);

  const visibleCategories = categories.filter(c => !type || c.type === type);
  const categoryName = categories.find(c => c.id === categoryId)?.name;
  const hasFilters = !!(urlSearch || type || categoryId || from || to);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, notes or category"
            aria-label="Search transactions"
            className="h-11 rounded-xl pl-10 pr-10"
          />
          {isPending ? (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(""); setPushed(""); update({ q: null }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-muted-foreground hover:bg-muted hover:text-secondary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Type */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-muted p-1" role="group" aria-label="Transaction type">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ type: t.value, category: null })}
              aria-pressed={type === t.value}
              className={`flex-1 rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                type === t.value ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Category */}
        <Select value={categoryId || "ALL"} onValueChange={(v) => update({ category: !v || v === "ALL" ? null : v })}>
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-52" aria-label="Filter by category">
            <SelectValue placeholder="All categories">{categoryName ?? "All categories"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {visibleCategories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => update({ from: e.target.value })}
            aria-label="From date"
            className="h-10 rounded-xl sm:w-40"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => update({ to: e.target.value })}
            aria-label="To date"
            className="h-10 rounded-xl sm:w-40"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => { setSearch(""); setPushed(""); update({ q: null, type: null, category: null, from: null, to: null }); }}
            className="h-10 rounded-xl px-4 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
