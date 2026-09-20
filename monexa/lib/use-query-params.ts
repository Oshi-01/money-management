"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Read and update the URL's query string. Filters live in the URL so a
 * filtered view can be bookmarked, shared, and survives a refresh.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /** Set (string) or remove (null / "") params. Changing a filter resets to page 1. */
  const update = useCallback(
    (patch: Record<string, string | null>, options?: { keepPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      if (!options?.keepPage && !("page" in patch)) params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { searchParams, update, isPending };
}
