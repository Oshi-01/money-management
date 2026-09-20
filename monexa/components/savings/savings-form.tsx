"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSavingsGoal, updateSavingsGoal } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const goalSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  targetAmount: z.number().positive("Amount must be positive"),
  deadline: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export type EditableGoal = {
  id: string;
  title: string;
  targetAmount: number;
  deadline: Date | string | null;
};

export function SavingsForm({
  goal,
  onSuccess,
}: {
  /** Pass to edit an existing goal instead of creating one. */
  goal?: EditableGoal;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isEdit = !!goal;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title ?? "",
      targetAmount: goal?.targetAmount ?? 0,
      // Stored at 12:00 UTC, so the UTC date is the day the user picked.
      deadline: goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "",
    },
  });

  const onSubmit = (data: GoalFormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const result = goal
        ? await updateSavingsGoal(goal.id, formData)
        : await createSavingsGoal(formData);

      if (result.error) {
        setError(result.error);
      } else {
        if (isEdit) {
          onSuccess?.();
          return;
        }
        setSuccess("Savings goal created successfully!");
        reset();

        setTimeout(() => {
          setSuccess(null);
        }, 3000);
        onSuccess?.();
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
          <Label htmlFor="title">Goal Title</Label>
          <Input id="title" placeholder="e.g. Emergency Fund" {...register("title")} />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount">Target Amount</Label>
          <Input id="targetAmount" type="number" step="0.01" {...register("targetAmount", { valueAsNumber: true })} />
          {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Target Date (Optional)</Label>
          <Input id="deadline" type="date" {...register("deadline")} />
          {isEdit && <p className="text-xs text-gray-400">Clear the date to remove the deadline.</p>}
          {errors.deadline && <p className="text-sm text-red-500">{errors.deadline.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Save changes" : "Create Goal"}
      </Button>
    </form>
  );
}
