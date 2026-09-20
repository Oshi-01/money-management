"use client";

import { useState, useTransition } from "react";
import { deleteCategory, getCategoryUsage } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ArrowUpRight, ArrowDownRight, FolderOpen, ArrowRight, Loader2 } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  userId: string | null;
};

type Usage = { transactions: number; budgets: number };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function CategoryList({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<Category | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [moveToId, setMoveToId] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const openDelete = async (category: Category) => {
    setTarget(category);
    setUsage(null);
    setMoveToId("");
    try {
      setUsage(await getCategoryUsage(category.id));
    } catch {
      setUsage({ transactions: 0, budgets: 0 });
    }
  };

  const close = () => {
    setTarget(null);
    setUsage(null);
  };

  const hasData = !!usage && (usage.transactions > 0 || usage.budgets > 0);
  const moveOptions = target ? categories.filter(c => c.type === target.type && c.id !== target.id) : [];
  const moveToName = moveOptions.find(c => c.id === moveToId)?.name;

  const confirmDelete = () => {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteCategory(target.id, hasData ? moveToId : undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      close();
    });
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
          <FolderOpen className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No categories yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first category to organize transactions.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const isIncome = category.type === "INCOME";
          const isSystem = !category.userId;
          return (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-sm hover:border-gray-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1e293b] truncate">{category.name}</p>
                    {isSystem && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200">System</Badge>}
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${isIncome ? "text-emerald-500" : "text-rose-500"}`}>
                    {isIncome ? "Income" : "Expense"}
                  </p>
                </div>
              </div>
              {!isSystem && (
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => setEditing(category)}
                    className="h-8 w-8 rounded-full text-gray-400 transition-opacity hover:bg-emerald-50 hover:text-emerald-600 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${category.name}`}
                    onClick={() => openDelete(category)}
                    className="h-8 w-8 rounded-full text-gray-400 transition-opacity hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-106.25 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editing && <CategoryForm key={editing.id} category={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && close()}
        title={`Delete "${target?.name ?? ""}"?`}
        description={
          !usage
            ? "Checking what is linked to this category…"
            : hasData
              ? "This category is still in use. Choose where its data should go so nothing is lost."
              : "Nothing is linked to this category. This can't be undone."
        }
        confirmLabel={hasData ? "Move & delete" : "Delete category"}
        onConfirm={confirmDelete}
        pending={isPending}
        confirmDisabled={!usage || (hasData && !moveToId)}
      >
        {!usage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {usage && hasData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-[#1e293b]">{usage.transactions}</p>
                <p className="text-xs font-medium text-gray-400">{usage.transactions === 1 ? "Transaction" : "Transactions"}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-[#1e293b]">{usage.budgets}</p>
                <p className="text-xs font-medium text-gray-400">{usage.budgets === 1 ? "Monthly budget" : "Monthly budgets"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Move them to</Label>
              {moveOptions.length === 0 ? (
                <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
                  There&apos;s no other {target?.type.toLowerCase()} category. Create one first, then delete this one.
                </p>
              ) : (
                <Select value={moveToId} onValueChange={(v) => setMoveToId(v ?? "")}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue placeholder="Select a category">{moveToName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {moveOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {moveToName && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
                <span className="font-semibold">{target?.name}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{moveToName}</span>
                <span className="ml-auto text-xs text-emerald-600">
                  {plural(usage.transactions, "transaction")}
                  {usage.budgets > 0 && `, ${plural(usage.budgets, "budget")}`}
                </span>
              </div>
            )}
            {usage.budgets > 0 && (
              <p className="text-xs text-gray-400">
                If {moveToName ? <span className="font-semibold">{moveToName}</span> : "the new category"} already has a budget for the same month, the two limits are added together.
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
