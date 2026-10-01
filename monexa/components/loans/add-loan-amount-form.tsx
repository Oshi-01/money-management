"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addLoanAmount } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  activityDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function AddLoanAmountForm({
  loanId,
  loanType,
  onSuccess,
}: {
  loanId: string;
  loanType: "BORROWED" | "LENT";
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, activityDate: toDateInputValue(), notes: "" },
  });

  const onSubmit = (data: Values) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("loanId", loanId);
      formData.append("amount", data.amount.toString());
      formData.append("activityDate", data.activityDate);
      if (data.notes) formData.append("notes", data.notes);

      const result = await addLoanAmount(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(result.success);
      onSuccess?.();
    });
  };

  const verb = loanType === "BORROWED" ? "Borrowed" : "Lent";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="additionalAmount">Additional Amount {verb}</Label>
        <Input
          id="additionalAmount"
          type="number"
          min="0.01"
          step="0.01"
          autoFocus
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalAmountDate">Date</Label>
        <Input id="additionalAmountDate" type="date" {...register("activityDate")} />
        {errors.activityDate && <p className="text-sm text-red-500">{errors.activityDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalAmountNotes">Notes (Optional)</Label>
        <Textarea
          id="additionalAmountNotes"
          placeholder="Why was this amount added?"
          className="resize-none"
          {...register("notes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add to Existing Loan
      </Button>
    </form>
  );
}
