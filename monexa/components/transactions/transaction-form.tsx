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

const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
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

export function TransactionForm({ categories, accounts, onSuccess }: { categories: Category[], accounts?: Account[], onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { 
      description: "", 
      type: "EXPENSE", 
      amount: 0, 
      categoryId: "", 
      accountId: "",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    },
  });

  const selectedType = watch("type");
  const filteredCategories = categories.filter(c => c.type === selectedType);

  const onSubmit = (data: TransactionFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("amount", data.amount.toString());
      formData.append("type", data.type);
      formData.append("categoryId", data.categoryId);
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
            onValueChange={(val) => { if (val) setValue("categoryId", val) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category">
                {watch("categoryId") 
                  ? categories.find(c => c.id === watch("categoryId"))?.name 
                  : "Select category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="e.g. Salary, Groceries" {...register("description")} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {accounts && accounts.length > 0 && (
        <div className="space-y-2">
          <Label>Account (Optional)</Label>
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
