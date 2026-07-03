"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createLoan } from "@/app/actions/loans";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const loanSchema = z.object({
  personName: z.string().min(1, "Person's name is required"),
  loanType: z.enum(["BORROWED", "LENT"]),
  principalAmount: z.number().positive("Amount must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function LoanForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      personName: "",
      loanType: "BORROWED",
      principalAmount: 0,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
    },
  });

  const onSubmit = (data: LoanFormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const result = await createLoan(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Loan recorded successfully!");
        reset();
        
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Loan Type</Label>
          <Select 
            onValueChange={(val) => { if (val) setValue("loanType", val as "BORROWED" | "LENT") }} 
            value={watch("loanType") || "BORROWED"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BORROWED">I Borrowed (Taken)</SelectItem>
              <SelectItem value="LENT">I Lent (Given)</SelectItem>
            </SelectContent>
          </Select>
          {errors.loanType && <p className="text-sm text-red-500">{errors.loanType.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="personName">Person/Entity</Label>
          <Input id="personName" placeholder="John Doe" {...register("personName")} />
          {errors.personName && <p className="text-sm text-red-500">{errors.personName.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="principalAmount">Principal Amount</Label>
          <Input id="principalAmount" type="number" step="0.01" {...register("principalAmount", { valueAsNumber: true })} />
          {errors.principalAmount && <p className="text-sm text-red-500">{errors.principalAmount.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="dueDate">Due Date (Optional)</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" placeholder="Any additional details..." className="resize-none" {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Loan
      </Button>
    </form>
  );
}
