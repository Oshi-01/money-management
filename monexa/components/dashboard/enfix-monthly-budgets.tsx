"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bus, GraduationCap, Loader2, Pencil, Settings2, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { deleteBudget, updateDashboardBudgets } from "@/app/actions/budgets";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type BudgetWithSpent = {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
  spent: number;
  showOnDashboard: boolean;
  category: { id: string; name: string };
};

type BudgetCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

interface EnfixMonthlyBudgetsProps {
  budgets: BudgetWithSpent[];
  categories: BudgetCategory[];
  currency: string;
}

const getIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes("grocery") || name.includes("food")) return ShoppingBag;
  if (name.includes("transport") || name.includes("bus")) return Bus;
  if (name.includes("education")) return GraduationCap;
  return Wallet;
};

export function EnfixMonthlyBudgets({ budgets, categories, currency }: EnfixMonthlyBudgetsProps) {
  const [isManaging, setIsManaging] = useState(false);
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<BudgetWithSpent | null>(null);
  const [deleting, setDeleting] = useState<BudgetWithSpent | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const selectedBudgets = budgets.filter((budget) => budget.showOnDashboard);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(daysInMonth - now.getDate() + 1, 1);

  const openManager = () => {
    setDraftIds(new Set(selectedBudgets.map((budget) => budget.id)));
    setIsManaging(true);
  };

  const toggleBudget = (id: string) => {
    setDraftIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveSelection = () => {
    startSaveTransition(async () => {
      const result = await updateDashboardBudgets([...draftIds]);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setIsManaging(false);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startDeleteTransition(async () => {
      const result = await deleteBudget(deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setDeleting(null);
    });
  };

  return (
    <div className="app-panel flex h-full w-full flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Daily budget guide</h2>
          <p className="text-xs text-muted-foreground">Recommended spending for today</p>
        </div>
        {budgets.length > 0 && (
          <Button variant="outline" size="sm" onClick={openManager} className="rounded-full">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Choose
          </Button>
        )}
      </div>

      {budgets.length === 0 ? (
        <div className="flex min-h-55 flex-1 flex-col items-center justify-center rounded-3xl bg-card/60 px-5 text-center">
          <Wallet className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-secondary-foreground">No monthly budgets yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a monthly budget to calculate a daily limit.</p>
          <Button render={<Link href="/dashboard/budgets" />} size="sm" className="mt-4 rounded-full">
            Create Budget
          </Button>
        </div>
      ) : selectedBudgets.length === 0 ? (
        <button
          type="button"
          onClick={openManager}
          className="flex min-h-55 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-primary-border bg-card/60 px-5 text-center transition-colors hover:bg-primary-soft"
        >
          <Settings2 className="mb-3 h-8 w-8 text-primary" />
          <span className="text-sm font-semibold text-secondary-foreground">Choose budgets to show</span>
          <span className="mt-1 text-xs text-muted-foreground">You can select more than one category.</span>
        </button>
      ) : (
        <div className="max-h-87.5 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {selectedBudgets.map((budget) => {
            const Icon = getIcon(budget.category.name);
            const remaining = Math.max(budget.amount - budget.spent, 0);
            const dailyLimit = remaining / remainingDays;
            const percent = Math.min(Math.round((budget.spent / budget.amount) * 100) || 0, 100);
            const isOver = budget.spent > budget.amount;

            return (
              <div key={budget.id} className="rounded-2xl bg-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-secondary-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{budget.category.name}</p>
                      <p className="text-xs text-muted-foreground">{remainingDays} day{remainingDays === 1 ? "" : "s"} left</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${budget.category.name} budget`} onClick={() => setEditing(budget)} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${budget.category.name} budget`} onClick={() => setDeleting(budget)} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-danger-soft hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Today&apos;s limit</p>
                    <p className={`text-xl font-bold ${isOver ? "text-warning" : "text-foreground"}`}>
                      {formatCurrency(dailyLimit, currency)}
                    </p>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">
                    {isOver ? `${formatCurrency(budget.spent - budget.amount, currency)} over` : `${formatCurrency(remaining, currency)} left`}
                  </p>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${isOver ? "bg-warning" : "bg-progress"}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>{formatCurrency(budget.spent, currency)} spent</span>
                  <span>{formatCurrency(budget.amount, currency)} monthly</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isManaging} onOpenChange={(open) => !isSaving && setIsManaging(open)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Choose Dashboard Budgets</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select every monthly budget you want to use for daily guidance.</p>
          <div className="max-h-80 space-y-2 overflow-y-auto py-1">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center gap-2 rounded-2xl border border-border p-2 hover:bg-muted">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 p-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{budget.category.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(budget.amount, currency)} monthly</p>
                  </div>
                  <input type="checkbox" checked={draftIds.has(budget.id)} onChange={() => toggleBudget(budget.id)} className="h-4 w-4 shrink-0 rounded border-input accent-primary" />
                </label>
                <div className="flex shrink-0 items-center border-l border-border pl-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${budget.category.name} budget`} onClick={() => { setIsManaging(false); setEditing(budget); }} className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${budget.category.name} budget`} onClick={() => { setIsManaging(false); setDeleting(budget); }} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={saveSelection} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Selection ({draftIds.size})
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {editing && <BudgetForm key={editing.id} categories={categories} currentMonth={editing.month} budget={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.category.name ?? ""} budget?`}
        description="This removes the budget limit, but it does not delete any transactions."
        confirmLabel="Delete budget"
        onConfirm={confirmDelete}
        pending={isDeleting}
      />
    </div>
  );
}
