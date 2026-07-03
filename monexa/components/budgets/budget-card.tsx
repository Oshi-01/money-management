"use client";

import { useTransition } from "react";
import { deleteBudget } from "@/app/actions/budgets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

export function BudgetCard({ budget, currency }: { budget: Budget, currency: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this budget limit?")) {
      startTransition(async () => {
        const result = await deleteBudget(budget.id);
        if (result.error) toast.error(result.error);
        if (result.success) toast.success(result.success);
      });
    }
  };

  const percentSpent = Math.min(
    Math.round((budget.spentAmount / budget.amount) * 100),
    100
  );

  return (
    <Card className={`flex flex-col border-none shadow-sm h-full ${budget.isOverBudget ? 'ring-1 ring-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center">
            {budget.category.name}
            {budget.isOverBudget && (
              <Badge variant="destructive" className="ml-2 text-[10px] h-5">OVER BUDGET</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Limit: {formatCurrency(budget.amount, currency)}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-2 -mr-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className={`text-2xl font-bold ${budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {formatCurrency(budget.spentAmount, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              spent this month
            </div>
          </div>
          <div className={`text-sm font-semibold ${budget.isOverBudget ? 'text-red-500' : ''}`}>
            {percentSpent}%
          </div>
        </div>

        <Progress
          value={percentSpent}
          className={`h-2 mt-2 ${budget.isOverBudget ? 'bg-red-100 dark:bg-red-950 [&>div]:bg-red-500' : ''}`}
        />

        {budget.isOverBudget && (
          <div className="mt-4 text-xs text-red-500 flex items-center bg-red-50 dark:bg-red-950/30 p-2 rounded-md">
            <AlertCircle className="h-3 w-3 mr-1.5 shrink-0" />
            You've exceeded your budget by {formatCurrency(budget.spentAmount - budget.amount, currency)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
