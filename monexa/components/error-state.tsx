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
      <div role="alert" className="w-full max-w-md rounded-4xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t load this page. Your data is safe. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Reference: <code className="rounded bg-muted px-1.5 py-0.5">{error.digest}</code>
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href={homeHref}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold text-secondary-foreground transition-colors hover:bg-muted"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
