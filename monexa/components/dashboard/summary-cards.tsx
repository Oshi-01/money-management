import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface SummaryCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  currency: string;
}

export function SummaryCards({ balance, totalIncome, totalExpense, currency }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balance, currency)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Overall net balance
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(totalIncome, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total money received
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
            <ArrowDownIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            -{formatCurrency(totalExpense, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total money spent
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
