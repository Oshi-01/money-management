"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addRepayment } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toDateInputValue } from "@/lib/dates";

const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type RepaymentFormValues = z.infer<typeof repaymentSchema>;

interface RepaymentFormProps {
  loanId: string;
  maxAmount: number;
  onSuccess?: () => void;
}

export function RepaymentForm({ loanId, maxAmount, onSuccess }: RepaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RepaymentFormValues>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      loanId,
      amount: maxAmount, // Default to full remaining balance
      paymentDate: toDateInputValue(),
      notes: "",
    },
  });

  const onSubmit = (data: RepaymentFormValues) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const result = await addRepayment(formData);

      if (result.error) {
        setError(result.error);
      } else {
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
        <Label htmlFor="amount">Repayment Amount</Label>
        <Input 
          id="amount"
          type="number" 
          step="0.01" 
          max={maxAmount} 
          {...register("amount", { valueAsNumber: true })} 
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentDate">Date of Payment</Label>
        <Input id="paymentDate" type="date" {...register("paymentDate")} />
        {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" placeholder="Payment details..." className="resize-none" {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Record Repayment
      </Button>
    </form>
  );
}
