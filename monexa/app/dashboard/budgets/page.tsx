import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixBudgetsClient } from "@/components/budgets/enfix-budgets-client";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { TotalBudgetCard } from "@/components/budgets/total-budget-card";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";
import { formatMonthLabel, monthOrCurrent } from "@/lib/dates";
import { getUserCalendar } from "@/lib/user-calendar";

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
  const { currentMonth, daysLeft } = await getUserCalendar();

  // ?month=YYYY-MM from the month switcher; anything invalid falls back to the current month.
  const selectedMonth = monthOrCurrent(searchParams?.month, currentMonth);

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
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="min-w-0">
          <h1 className="page-title">Budgets</h1>
          <p className="page-description">
            Track your spending and stay within your limits.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto">
          <NewTransactionDialog
            categories={categories}
            accounts={accounts}
            budgets={budgets}
            currency={currency}
          />
          <MonthSwitcher month={selectedMonth} currentMonth={currentMonth} />
        </div>
      </div>

      {budgets.length > 0 && (
        <TotalBudgetCard
          totalBudget={summary.totalBudget}
          totalSpent={summary.totalSpent}
          count={budgets.length}
          currency={currency}
          monthLabel={formatMonthLabel(selectedMonth)}
          isCurrentMonth={selectedMonth === currentMonth}
          daysLeft={daysLeft}
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
