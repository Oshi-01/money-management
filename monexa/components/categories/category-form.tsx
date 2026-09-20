"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCategory, updateCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Keep the name under 40 characters"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export type EditableCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export function CategoryForm({
  category,
  onSuccess,
}: {
  /** Pass to edit an existing category instead of creating one. */
  category?: EditableCategory;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!category;

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", type: category?.type ?? "EXPENSE" },
  });

  const type = watch("type");

  const onSubmit = (data: CategoryFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("type", data.type);

      const result = category
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        if (!isEdit) reset();
        onSuccess?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" placeholder="e.g. Groceries" autoFocus {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(val) => { if (val) setValue("type", val as "INCOME" | "EXPENSE"); }}>
          <SelectTrigger>
            <SelectValue placeholder="Select type">{type === "INCOME" ? "Income" : "Expense"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        {isEdit && (
          <p className="text-xs text-gray-400">The type can only be changed while no transactions or budgets use this category.</p>
        )}
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Save changes" : "Create Category"}
      </Button>
    </form>
  );
}
