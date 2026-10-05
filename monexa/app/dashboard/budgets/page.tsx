import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixBudgetsClient } from "@/components/budgets/enfix-budgets-client";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { TotalBudgetCard } from "@/components/budgets/total-budget-card";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";
import { formatMonthLabel, monthOrCurrent, toMonthStr } from "@/lib/dates";

export const metadata = {
  title: "Budgets - Monexa",
  description: "Track your spending and stay within your limits.",
};

export default async function BudgetsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;

  // ?month=YYYY-MM from the month switcher; anything invalid falls back to the current month.
  const selectedMonth = monthOrCurrent(searchParams?.month);

  const [budgetData, categories, accounts, userSettings] = await Promise.all([
    getEnfixBudgetsData(selectedMonth),
    getCategories(),
    getUserAccounts(),
    getUserSettings(),
  ]);

  const currency = userSettings?.currency || "USD";
  const { budgets, summary } = budgetData;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1e293b]">Budgets</h2>
          <p className="text-sm text-gray-400">
            Track your spending and stay within your limits.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <NewTransactionDialog
            categories={categories}
            accounts={accounts}
            budgets={budgets}
            currency={currency}
          />
          <MonthSwitcher month={selectedMonth} />
        </div>
      </div>

      {budgets.length > 0 && (
        <TotalBudgetCard
          totalBudget={summary.totalBudget}
          totalSpent={summary.totalSpent}
          count={budgets.length}
          currency={currency}
          monthLabel={formatMonthLabel(selectedMonth)}
          isCurrentMonth={selectedMonth === toMonthStr()}
        />
      )}

      <EnfixBudgetsClient
        budgets={budgets}
        currency={currency} 
        currentMonth={selectedMonth}
        categories={categories}
      />
    </div>
  );
}
