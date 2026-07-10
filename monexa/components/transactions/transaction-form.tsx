"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().optional(),
  budgetId: z.string().optional(),
  accountId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
}).refine(data => data.type === "INCOME" ? !!data.categoryId : (!!data.categoryId || !!data.budgetId), {
  message: "Either Category or Budget must be selected",
  path: ["categoryId"]
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

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

export function TransactionForm({ 
  categories, 
  accounts, 
  budgets, 
  currency = "USD", 
  onSuccess 
}: { 
  categories: Category[], 
  accounts?: Account[], 
  budgets?: Budget[], 
  currency?: string,
  onSuccess?: () => void 
}) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset, clearErrors } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { 
      description: "", 
      type: "EXPENSE", 
      amount: 0, 
      categoryId: "", 
      budgetId: "",
      accountId: "",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    },
  });

  const selectedType = watch("type");
  const filteredCategories = categories.filter(c => c.type === selectedType);

  const onSubmit = (data: TransactionFormValues) => {
    startTransition(async () => {
      const finalCategoryId = data.budgetId 
        ? budgets?.find(b => b.id === data.budgetId)?.categoryId 
        : data.categoryId;

      if (!finalCategoryId) {
        toast.error("Please select a category or budget");
        return;
      }

      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("amount", data.amount.toString());
      formData.append("type", data.type);
      formData.append("categoryId", finalCategoryId);
      if (data.accountId) formData.append("accountId", data.accountId);
      formData.append("date", data.date);
      if (data.notes) formData.append("notes", data.notes);
      
      const result = await createTransaction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        reset();
        onSuccess?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select 
            value={watch("type")}
            onValueChange={(val) => {
              if (val) {
                setValue("type", val as "INCOME" | "EXPENSE");
                setValue("categoryId", ""); // Reset category when type changes
                setValue("budgetId", "");
              }
            }} 
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type">
                {watch("type") === "INCOME" ? "Income" : "Expense"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={watch("categoryId")} 
            onValueChange={(val) => { 
              if (val) {
                const finalVal = val === "none" ? "" : val;
                setValue("categoryId", finalVal);
                if (finalVal !== "") {
                  setValue("budgetId", ""); // clear budget if category selected
                  clearErrors("categoryId");
                }
              } 
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category">
                {watch("categoryId") && watch("categoryId") !== "none"
                  ? categories.find(c => c.id === watch("categoryId"))?.name 
                  : "None"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {filteredCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
        </div>

        {selectedType === "EXPENSE" && budgets && budgets.length > 0 && (
          <div className="space-y-2">
            <Label>Budget</Label>
            <Select 
              value={watch("budgetId")} 
              onValueChange={(val) => { 
                if (val) {
                  const finalVal = val === "none" ? "" : val;
                  setValue("budgetId", finalVal);
                  if (finalVal !== "") {
                    setValue("categoryId", ""); // clear category if budget selected
                    clearErrors("categoryId");
                  }
                } 
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select budget">
                  {watch("budgetId") && watch("budgetId") !== "none"
                    ? budgets.find(b => b.id === watch("budgetId"))?.category?.name + " Budget"
                    : "None"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {budgets.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.category?.name} ({formatCurrency(b.amount, currency).replace(/\.00$/, '')})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budgetId && <p className="text-sm text-red-500">{errors.budgetId.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="e.g. Salary, Groceries" {...register("description")} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {accounts && accounts.length > 0 && (
        <div className="space-y-2">
          <Label>Funding Source (Account)</Label>
          <p className="text-xs text-gray-500 mb-2">Select the account (e.g., Salary Account) this money came from.</p>
          <Select 
            value={watch("accountId")} 
            onValueChange={(val) => { if (val) setValue("accountId", val === "none" ? "" : val) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account">
                {watch("accountId") && watch("accountId") !== "none"
                  ? accounts.find(a => a.id === watch("accountId"))?.name 
                  : "None"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input id="notes" placeholder="Any extra details..." {...register("notes")} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Transaction
      </Button>
    </form>
  );
}
