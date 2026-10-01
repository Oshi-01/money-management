import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixBudgetsClient } from "@/components/budgets/enfix-budgets-client";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { TotalBudgetCard } from "@/components/budgets/total-budget-card";
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

  const [budgetData, categories, userSettings] = await Promise.all([
    getEnfixBudgetsData(selectedMonth),
    getCategories(),
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
        <MonthSwitcher month={selectedMonth} />
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
