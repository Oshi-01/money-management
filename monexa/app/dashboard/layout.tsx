import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { TimeZoneSync } from "@/components/dashboard/time-zone-sync";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only pass the configured provider's public name to the browser, never its credentials.
  const voiceAIProvider = process.env.VOICE_AI_PROVIDER === "groq" && process.env.GROQ_API_KEY?.trim()
    ? "groq"
    : process.env.VOICE_AI_PROVIDER === "ollama" && process.env.OLLAMA_MODEL?.trim()
      ? "ollama"
      : null;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <TimeZoneSync />
      <aside className="hidden w-60 shrink-0 flex-col px-5 py-7 lg:flex">
        <Link href="/dashboard" aria-label="Monexa home" className="mb-7 flex items-center gap-3 px-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><TrendingUp aria-hidden="true" className="h-6 w-6" /></span>
          <span className="text-[23px] font-semibold tracking-tight text-foreground">Monexa</span>
        </Link>
        <div className="app-panel min-h-0 flex-1 overflow-y-auto p-3"><Sidebar /></div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6 lg:pl-1 lg:pr-7">
        <TopNav user={session.user} voiceAIProvider={voiceAIProvider} />
        <main className="flex-1 overflow-y-auto pt-6 pb-28 lg:pb-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <BottomNav />

      <Toaster />
    </div>
  );
}
