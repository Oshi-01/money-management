import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Page not found - Monexa",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-4xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <p className="text-sm font-bold text-primary">404</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
