import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Page not found - Monexa",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-4xl border border-gray-50 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Compass className="h-7 w-7" />
        </div>
        <p className="text-sm font-bold text-emerald-600">404</p>
        <h1 className="mt-1 text-xl font-bold text-[#1e293b]">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
