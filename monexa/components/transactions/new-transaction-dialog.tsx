"use client";

import { useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Account = {
  id: string;
  name: string;
};

type Budget = {
  id: string;
  categoryId: string;
  amount: number;
  spentAmount?: number;
  category?: { name: string };
};

interface NewTransactionDialogProps {
  categories: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  currency?: string;
}

export function NewTransactionDialog({
  categories,
  accounts,
  budgets,
  currency = "USD"
}: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="h-11 w-full rounded-full bg-[#1e293b] px-6 text-white hover:bg-[#1e293b]/90 sm:w-auto" />}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Transaction
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="flex-row items-center gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <DialogTitle className="text-lg font-bold text-[#1e293b]">New transaction</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Record money coming in or going out.
            </DialogDescription>
          </div>
        </DialogHeader>
        <TransactionForm
          categories={categories}
          accounts={accounts}
          budgets={budgets}
          currency={currency}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
