import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  /** Current query params (filters), preserved in the page links. */
  params: Record<string, string | undefined>;
}

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export function TransactionsPagination({ page, pageSize, totalCount, params }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount === 0) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `?${s}` : "?";
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);
  const btn = "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors";

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-gray-400">
        Showing <span className="font-semibold text-gray-600">{first}–{last}</span> of{" "}
        <span className="font-semibold text-gray-600">{totalCount}</span>
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label="Previous page" className={`${btn} text-gray-500 hover:bg-gray-100`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${btn} cursor-not-allowed text-gray-300`} aria-hidden="true"><ChevronLeft className="h-4 w-4" /></span>
          )}

          {pageWindow(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-gray-300">…</span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${btn} ${p === page ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label="Next page" className={`${btn} text-gray-500 hover:bg-gray-100`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${btn} cursor-not-allowed text-gray-300`} aria-hidden="true"><ChevronRight className="h-4 w-4" /></span>
          )}
        </nav>
      )}
    </div>
  );
}
