import { auth } from "@/auth";
import { getDashboardData } from "@/app/actions/dashboard";
import { EnfixStatCards } from "@/components/dashboard/enfix-stat-cards";
import { EnfixBalanceTrend } from "@/components/dashboard/enfix-balance-trend";
import { EnfixTransactionHistory } from "@/components/dashboard/enfix-transaction-history";
import { EnfixSavingsGoals } from "@/components/dashboard/enfix-savings-goals";
import { EnfixMonthlyBudgets } from "@/components/dashboard/enfix-monthly-budgets";
import { EnfixMonthlyExpenses } from "@/components/dashboard/enfix-monthly-expenses";
import { EnfixIncomeExpenseChart } from "@/components/dashboard/enfix-income-expense-chart";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - Monexa",
  description: "Your financial dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  // Fetch the dashboard data
  const [dashboardData, categories, accounts] = await Promise.all([
    getDashboardData(),
    getCategories(),
    getUserAccounts()
  ]);

  const { 
    totalIncome, 
    totalExpense, 
    balance, 
    recentTransactions, 
    chartData, 
    currency,
    spendingsBreakdown,
    savingsTrend,
    incomeTrend,
    expenseTrend,
    savingsGoals,
    budgets,
    trends
  } = dashboardData;

  return (
    <div className="w-full flex flex-col gap-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-[#1e293b]">Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Welcome Enfix Finance Management</p>
        </div>
        <NewTransactionDialog 
          categories={categories} 
          accounts={accounts} 
          budgets={budgets} 
          currency={currency}
        />
      </div>

      {/* Row 1: Stat Cards and Balance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 xl:col-span-4 h-full min-h-[300px]">
          <EnfixStatCards 
            balance={balance} 
            totalIncome={totalIncome} 
            totalExpense={totalExpense} 
            currency={currency}
            trends={trends}
            savingsTrend={savingsTrend}
            incomeTrend={incomeTrend}
            expenseTrend={expenseTrend}
          />
        </div>
        <div className="lg:col-span-7 xl:col-span-8 h-full min-h-[300px] pt-4 lg:pt-0">
          <EnfixBalanceTrend balance={balance} currency={currency} savingsTrend={savingsTrend} trends={trends} />
        </div>
      </div>

      {/* Row 2: Transaction History and Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <EnfixTransactionHistory transactions={recentTransactions} currency={currency} />
        </div>
        <div className="lg:col-span-4 pt-4 lg:pt-0">
          <EnfixSavingsGoals goals={savingsGoals} />
        </div>
      </div>

      {/* Row 3: Monthly Charts and Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 h-full min-h-[350px]">
          <EnfixIncomeExpenseChart data={chartData} currency={currency} />
        </div>
        <div className="lg:col-span-3 h-full">
          <EnfixMonthlyBudgets budgets={budgets} />
        </div>
        <div className="lg:col-span-3 h-full pt-4 lg:pt-0">
          <EnfixMonthlyExpenses breakdown={spendingsBreakdown} currency={currency} />
        </div>
      </div>

    </div>
  );
}
