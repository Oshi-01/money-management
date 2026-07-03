import { auth } from "@/auth";
import { getDashboardData } from "@/app/actions/dashboard";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard - Monexa",
  description: "Your financial dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  
  // Fetch the dashboard data
  const { totalIncome, totalExpense, balance, recentTransactions, chartData, currency } = await getDashboardData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Overview
          </h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-medium text-foreground">{session?.user?.name?.split(' ')[0] || "User"}</span>! Here is your financial summary.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard/transactions" 
            className={buttonVariants({ className: "rounded-full shadow-sm bg-blue-600 hover:bg-blue-700 text-white" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        </div>
      </div>
      
      {/* 1. Summary Cards */}
      <SummaryCards 
        balance={balance} 
        totalIncome={totalIncome} 
        totalExpense={totalExpense} 
        currency={currency} // The currency is passed here
      />

      {/* 2. Charts and Recent Transactions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <DashboardChart data={chartData} currency={currency} />
        </div>
        <div className="md:col-span-1 min-w-0">
          <RecentTransactions transactions={recentTransactions} currency={currency} />
        </div>
      </div>
    </div>
  );
}
