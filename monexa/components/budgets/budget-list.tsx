"use client";

import { BudgetCard } from "./budget-card";

interface Budget {
  id: string;
  amount: number;
  month: string;
  categoryId: string;
  spentAmount: number;
  isOverBudget: boolean;
  category: {
    name: string;
  };
}

export function BudgetList({ budgets, currency }: { budgets: Budget[], currency: string }) {
  if (budgets.length === 0) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-white dark:bg-gray-950/50">
        <p className="text-sm text-muted-foreground">You haven't set any budgets for this month yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} currency={currency} />
      ))}
    </div>
  );
}
