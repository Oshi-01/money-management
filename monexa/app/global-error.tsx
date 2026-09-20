"use client";

import "./globals.css";
import { ErrorState } from "@/components/error-state";

// Last resort: an error in the root layout itself. This replaces the whole
// layout, so it must render its own <html> and <body>.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <title>Something went wrong - Monexa</title>
        <ErrorState error={error} retry={unstable_retry} homeHref="/" homeLabel="Go home" fullScreen />
      </body>
    </html>
  );
}
