"use client";

import { ErrorState } from "@/components/error-state";

// Catches errors on any dashboard page while keeping the sidebar and top bar usable.
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <ErrorState error={error} retry={unstable_retry} />;
}
