import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  category: {
    name: string;
  } | null;
};

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  currency: string;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  return (
    <Card className="flex flex-col border-none shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </div>
        <Link 
          href="/dashboard/transactions"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:flex" })}
        >
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        {transactions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center opacity-50 pt-8">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm">No recent transactions.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "INCOME";
              
              return (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isIncome ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                    }`}>
                      {isIncome ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none truncate max-w-[120px] sm:max-w-[200px]">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"}`}>
                    {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 sm:hidden">
          <Link 
            href="/dashboard/transactions"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            View All Transactions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
