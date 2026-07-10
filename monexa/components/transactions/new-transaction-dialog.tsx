"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <DialogTrigger render={<Button className="w-full sm:w-auto bg-[#1e293b] hover:bg-[#1e293b]/90 text-white" />}>
        <Plus className="mr-2 h-4 w-4" /> Add Transaction
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record a New Transaction</DialogTitle>
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
