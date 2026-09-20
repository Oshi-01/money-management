"use client";

import { ErrorState } from "@/components/error-state";

// Catches errors outside the dashboard (login, register, password reset...).
export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <ErrorState error={error} retry={unstable_retry} homeHref="/" homeLabel="Go home" fullScreen />;
}
