"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBudget } from "@/app/actions/budgets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  categories: { id: string; name: string; type: string }[];
  currentMonth: string;
}

export function BudgetForm({ categories, currentMonth }: BudgetFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const expenseCategories = categories.filter(c => c.type === "EXPENSE");

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
      month: currentMonth,
    },
  });

  const onSubmit = (data: BudgetFormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const result = await createBudget(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Budget saved successfully!");
        reset({ month: currentMonth, amount: 0, categoryId: "" });
        
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-emerald-500 bg-emerald-100 rounded-md dark:bg-emerald-900/20 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            onValueChange={(val) => setValue("categoryId", val || "")} 
            value={watch("categoryId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monthly Budget Limit</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Input id="month" type="month" {...register("month")} />
          {errors.month && <p className="text-sm text-red-500">{errors.month.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Budget
      </Button>
    </form>
  );
}
