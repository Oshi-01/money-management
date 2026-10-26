import { getDashboardData } from "@/app/actions/dashboard";
import { EnfixStatCards } from "@/components/dashboard/enfix-stat-cards";
import { EnfixBalanceTrend } from "@/components/dashboard/enfix-balance-trend";
import { EnfixTransactionHistory } from "@/components/dashboard/enfix-transaction-history";
import { EnfixSavingsGoals } from "@/components/dashboard/enfix-savings-goals";
import { EnfixMonthlyBudgets } from "@/components/dashboard/enfix-monthly-budgets";
import { EnfixMonthlyExpenses } from "@/components/dashboard/enfix-monthly-expenses";
import { EnfixIncomeExpenseChart } from "@/components/dashboard/enfix-income-expense-chart";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - Monexa",
  description: "Your financial dashboard",
};

export default async function DashboardPage() {
  // Fetch the dashboard data
  const [dashboardData, categories, accounts] = await Promise.all([
    getDashboardData(),
    getCategories(),
    getUserAccounts()
  ]);

  const {
    balance,
    recentTransactions,
    chartData,
    currency,
    spendingsBreakdown,
    savingsTrend,
    savingsGoals,
    budgets,
    trends
  } = dashboardData;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">

      {/* Top Header */}
      <div className="page-header">
        <div className="flex flex-col">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Your money at a glance.</p>
        </div>
        <NewTransactionDialog
          categories={categories}
          accounts={accounts}
          budgets={budgets}
          currency={currency}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4"><EnfixStatCards balance={balance} currency={currency} trends={trends} /></div>
        <div className="min-h-80 xl:col-span-8"><EnfixBalanceTrend currency={currency} savingsTrend={savingsTrend} trends={trends} /></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <EnfixTransactionHistory transactions={recentTransactions} currency={currency} />
        </div>
        <div className="xl:col-span-4"><EnfixSavingsGoals goals={savingsGoals} currency={currency} /></div>
      </div>

      {/* Row 3: Monthly Charts and Budgets */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-h-80 xl:col-span-5">
          <EnfixIncomeExpenseChart data={chartData} currency={currency} />
        </div>
        <div className="xl:col-span-4">
          <EnfixMonthlyBudgets
            budgets={budgets}
            categories={categories}
            currency={currency}
          />
        </div>
        <div className="app-panel p-5 sm:p-6 xl:col-span-3"><EnfixMonthlyExpenses breakdown={spendingsBreakdown} currency={currency} /></div>
      </div>

    </div>
  );
}
