"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShoppingBag, Landmark, ArrowLeftRight } from "lucide-react";
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

  // Helper to get relative date label (TODAY, YESTERDAY, MMM DD)
  const getDateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "TODAY";
    if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const dateStr = getDateLabel(new Date(transaction.date));
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(transaction);
    return groups;
  }, {} as Record<string, RecentTransaction[]>);

  // Function to get a dummy icon based on category name
  const getIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("shop") || name.includes("grocery")) return <ShoppingBag className="h-4 w-4" />;
    if (name.includes("transfer") || name.includes("bank")) return <Landmark className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };


  return (
    <Card className="flex flex-col border-none shadow-none h-full bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-0 pt-0">
        <CardTitle className="text-sm font-semibold text-foreground tracking-wide">Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-6 px-0">
        {transactions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center opacity-50 pt-8">
            <ArrowLeftRight className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-mono">No recent transactions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([dateLabel, trans]) => (
              <div key={dateLabel} className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2">{dateLabel}</p>
                {trans.map((transaction) => {
                  const isIncome = transaction.type === "INCOME";
                  const catName = transaction.category?.name || "Uncategorized";

                  return (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-secondary-foreground`}>
                          {getIcon(catName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-none truncate max-w-[140px] sm:max-w-[200px] mb-1">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono font-medium ${isIncome ? "text-income" : "text-expense"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, currency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 capitalize">
                          {catName.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
