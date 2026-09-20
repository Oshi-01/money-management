"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Friendly fallback shown by the error.tsx files when a page fails to render,
 * so a failed database query never ends in a blank or raw error screen.
 */
export function ErrorState({
  error,
  retry,
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
  fullScreen = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
  /** Centre on the whole screen (for pages outside the dashboard layout). */
  fullScreen?: boolean;
}) {
  useEffect(() => {
    // The digest matches this error to the full server-side log entry.
    console.error("Page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className={fullScreen ? "flex min-h-screen items-center justify-center p-4" : "flex min-h-[60vh] items-center justify-center"}>
      <div role="alert" className="w-full max-w-md rounded-4xl border border-gray-50 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-[#1e293b]">Something went wrong</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          We couldn&apos;t load this page. Your data is safe. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-gray-400">
            Reference: <code className="rounded bg-gray-100 px-1.5 py-0.5">{error.digest}</code>
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href={homeHref}
            className="inline-flex h-11 items-center justify-center rounded-full border border-gray-200 px-6 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
