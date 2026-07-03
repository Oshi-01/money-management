"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addFundsToGoal } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const addFundsSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

type AddFundsFormValues = z.infer<typeof addFundsSchema>;

interface AddFundsFormProps {
  goalId: string;
  onSuccess?: () => void;
}

export function AddFundsForm({ goalId, onSuccess }: AddFundsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const onSubmit = (data: AddFundsFormValues) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", goalId);
      formData.append("amount", data.amount.toString());

      const result = await addFundsToGoal(formData);

      if (result.error) {
        setError(result.error);
      } else {
        reset();
        if (onSuccess) onSuccess();
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

      <div className="space-y-2">
        <Label htmlFor={`amount-${goalId}`}>Amount to Add</Label>
        <Input id={`amount-${goalId}`} type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Funds
      </Button>
    </form>
  );
}
