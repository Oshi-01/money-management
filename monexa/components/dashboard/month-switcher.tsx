"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addMonths, formatMonthLabel, toMonthStr } from "@/lib/dates";
import { useQueryParams } from "@/lib/use-query-params";

/**
 * Previous / next month control. The chosen month lives in the URL
 * (?month=YYYY-MM), so the view can be bookmarked and survives a refresh.
 */
export function MonthSwitcher({ month }: { month: string }) {
  const { update, isPending } = useQueryParams();
  const current = toMonthStr();
  const isCurrent = month === current;

  const go = (m: string) => update({ month: m === current ? null : m });
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2" aria-busy={isPending}>
      <div className="flex items-center gap-1 rounded-full border border-gray-100 bg-white p-1 shadow-sm">
        <button type="button" aria-label="Previous month" onClick={() => go(addMonths(month, -1))} className={btn}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-36 items-center justify-center gap-2 px-1 text-sm font-bold text-[#1e293b]" aria-live="polite">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          {formatMonthLabel(month)}
        </div>
        <button type="button" aria-label="Next month" onClick={() => go(addMonths(month, 1))} className={btn}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => go(current)}
          className="h-9 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          This month
        </button>
      )}
    </div>
  );
}
