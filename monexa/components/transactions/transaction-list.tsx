"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  category: {
    name: string;
  };
};

export function TransactionList({ transactions, currency }: { transactions: Transaction[], currency: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      startTransition(async () => {
        const result = await deleteTransaction(id);
        if (result.error) toast.error(result.error);
        if (result.success) toast.success(result.success);
      });
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
          <Receipt className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No transactions yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => {
        const isIncome = t.type === "INCOME";
        return (
          <div
            key={t.id}
            className={`flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-sm group`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isIncome 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "bg-rose-50 text-rose-600"
              }`}>
                {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#1e293b] truncate">{t.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{t.category.name}</span>
                  <span className="text-xs font-medium text-gray-400">{new Date(t.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className={`text-base font-bold ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>
                {isIncome ? "+" : "-"}{formatCurrency(t.amount, currency)}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDelete(t.id)}
                disabled={isPending}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
