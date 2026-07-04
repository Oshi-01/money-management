import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixBudgetsClient } from "@/components/budgets/enfix-budgets-client";

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

  // Default to current month YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const selectedMonth = typeof searchParams?.month === "string" ? searchParams.month : currentMonth;

  const [budgetData, categories, userSettings] = await Promise.all([
    getEnfixBudgetsData(selectedMonth),
    getCategories(),
    getUserSettings(),
  ]);

  const currency = userSettings?.currency || "USD";
  const { budgets } = budgetData;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1e293b]">Budgets</h2>
          <p className="text-sm text-gray-400">
            Welcome Enfix Finance Management
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium">
          Home <span className="mx-2">&gt;</span> <span className="text-emerald-600">Budgets</span>
        </div>
      </div>

      <EnfixBudgetsClient 
        budgets={budgets as any} 
        currency={currency} 
        currentMonth={selectedMonth}
        categories={categories}
      />
    </div>
  );
}
