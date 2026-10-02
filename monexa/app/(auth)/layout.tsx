import Image from "next/image";
import Link from "next/link";
import {
  HandCoins,
  PieChart,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import authBackground from "@/public/images/auth-bg.jpg";

const highlights = [
  {
    icon: PieChart,
    title: "Budgets that carry over",
    note: "Plan each month by category and see exactly where your money goes.",
  },
  {
    icon: HandCoins,
    title: "Loans, both ways",
    note: "Track what you owe and what you're owed, with every repayment logged.",
  },
  {
    icon: PiggyBank,
    title: "Savings goals",
    note: "Set a target, add funds as you go, and watch the progress bar fill.",
  },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
        <TrendingUp className="h-5 w-5" />
      </span>
      <span className="text-xl font-bold tracking-tight">Monexa</span>
    </Link>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-emerald-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Image
            src={authBackground}
            alt=""
            fill
            placeholder="blur"
            fetchPriority="high"
            sizes="55vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-emerald-950/80 via-emerald-950/40 to-emerald-900/10" />

          <Logo className="relative text-white" />

          <div className="relative max-w-md space-y-10">
            <div className="space-y-4">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                Personal finance, simplified
              </p>
              <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                Every taka, dollar and pound,{" "}
                <span className="text-emerald-300">accounted for.</span>
              </h2>
              <p className="text-base leading-relaxed text-emerald-50/75">
                Monexa brings your spending, budgets, loans and savings into one
                calm dashboard.
              </p>
            </div>

            <ul className="space-y-5">
              {highlights.map(({ icon: Icon, title, note }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-emerald-300" />
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm leading-relaxed text-emerald-50/70">
                      {note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-emerald-50/80 backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            Your data stays private. Passwords are hashed and sessions are
            signed and encrypted.
          </div>
        </aside>

        <main className="relative flex flex-col bg-[#eef7f2] dark:bg-[#09090b]">
          <div className="flex items-center justify-between p-6">
            <Logo className="text-gray-900 lg:invisible dark:text-white" />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <p className="pb-6 text-center text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Monexa. All rights reserved.
          </p>
        </main>
      </div>
      <Toaster />
    </>
  );
}
