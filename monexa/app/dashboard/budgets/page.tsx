import { getBudgetsWithSpending } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getUserSettings } from "@/app/actions/settings";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetList } from "@/components/budgets/budget-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

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
  
  // Calculate prev/next months for navigation
  const [year, month] = selectedMonth.split('-').map(Number);
  const prevMonthDate = new Date(year, month - 2, 1);
  const nextMonthDate = new Date(year, month, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const [budgetData, categories, userSettings] = await Promise.all([
    getBudgetsWithSpending(selectedMonth),
    getCategories(),
    getUserSettings(),
  ]);
  
  const currency = userSettings?.currency || "USD";
  const { budgets, summary } = budgetData;

  const totalPercent = summary.totalBudget > 0 
    ? Math.min(Math.round((summary.totalSpent / summary.totalBudget) * 100), 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Budgets</h2>
          <p className="text-muted-foreground">
            Set limits for your expenses and monitor your spending.
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={
            <Button className="w-full sm:w-auto" />
          }>
            <Plus className="mr-2 h-4 w-4" /> Add Budget
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Budget Limit</DialogTitle>
            </DialogHeader>
            <BudgetForm categories={categories} currentMonth={selectedMonth} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-950 p-2 rounded-lg border shadow-sm w-full md:w-auto md:inline-flex mb-4">
        <Link 
          href={`/dashboard/budgets?month=${prevMonthStr}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="font-medium px-4 min-w-[140px] text-center">
          {monthDisplay}
        </span>
        <Link 
          href={`/dashboard/budgets?month=${nextMonthStr}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary.totalBudget, currency)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.totalSpent > summary.totalBudget ? 'text-red-500' : ''}`}>
              {formatCurrency(summary.totalSpent, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.totalSpent > summary.totalBudget ? 'text-red-500' : 'text-emerald-500'}`}>
              {totalPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Monthly Budgets</h3>
        <BudgetList budgets={budgets} currency={currency} />
      </div>
    </div>
  );
}
