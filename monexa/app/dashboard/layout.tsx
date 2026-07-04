import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { TrendingUp } from "lucide-react";

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef7f2] dark:bg-[#09090b]">
      {/* Left Sidebar Column (Hidden on Mobile) */}
      <div className="hidden md:flex w-[100px] shrink-0 flex-col items-center py-6 gap-6">
        {/* Logo Pill */}
        <div className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
          <TrendingUp className="h-6 w-6" />
        </div>

        {/* Nav Pill */}
        <div className="flex-1 pb-6 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden p-4 md:py-6 md:pr-6 md:pl-0">
        <TopNav user={session.user} />
        <main className="flex-1 overflow-y-auto mt-4 md:mt-6 pb-24 md:pb-20 no-scrollbar">
          {children}
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <BottomNav />

      <Toaster />
    </div>
  );
}
