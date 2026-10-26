"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { deleteTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm, type EditableTransaction } from "@/components/transactions/transaction-form";

type Transaction = EditableTransaction & {
  date: Date;
  category: {
    name: string;
  };
};

type FormOptions = Omit<ComponentProps<typeof TransactionForm>, "transaction" | "onSuccess" | "currency">;

// Dates are stored at 12:00 UTC, so format in UTC to always show the chosen day.
const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function TransactionList({
  transactions,
  currency,
  formOptions,
  isFiltered = false,
}: {
  transactions: Transaction[];
  currency: string;
  /** True when search/filters are active - changes the empty-state message. */
  isFiltered?: boolean;
  /** Categories/accounts/budgets for the edit form. Without it, rows are not editable. */
  formOptions?: FormOptions;
}) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const canEdit = !!formOptions;

  const confirmDelete = () => {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteTransaction(target.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if ("success" in result) toast.success(result.success);
      setTarget(null);
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {isFiltered ? "No transactions match your filters" : "No transactions yet"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isFiltered ? "Try a different search or clear the filters." : "Add your first transaction to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/70">
        {transactions.map((t) => {
          const isIncome = t.type === "INCOME";
          return (
            <div
              key={t.id}
              className="group flex items-center justify-between gap-3 py-4 sm:px-1"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
                }`}>
                  {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-foreground truncate">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-muted-foreground">{t.category.name}</span>
                    <time dateTime={new Date(t.date).toISOString().slice(0, 10)} className="text-xs text-muted-foreground"><span className="sm:hidden">{new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</span><span className="hidden sm:inline">{formatDate(t.date)}</span></time>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className={`text-sm font-semibold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
                  {isIncome ? "+" : "-"}{formatCurrency(t.amount, currency)}
                </span>
                <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${t.description}`}
                    onClick={(e) => { e.stopPropagation(); setEditing(t); }}
                    className="h-8 w-8 rounded-full text-muted-foreground transition-opacity hover:bg-primary-soft hover:text-primary "
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${t.description}`}
                  onClick={(e) => { e.stopPropagation(); setTarget(t); }}
                  className="h-8 w-8 rounded-full text-muted-foreground transition-opacity hover:bg-danger-soft hover:text-destructive "
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {formOptions && (
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:max-w-lg sm:p-6">
            <DialogHeader className="flex-row items-center gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold text-foreground">Edit transaction</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {editing?.accountId
                    ? "Balances of the affected accounts update automatically."
                    : "Update the details of this transaction."}
                </DialogDescription>
              </div>
            </DialogHeader>
            {editing && (
              <TransactionForm
                key={editing.id}
                {...formOptions}
                currency={currency}
                transaction={editing}
                onSuccess={() => setEditing(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Delete this transaction?"
        description={
          target?.accountId
            ? "The linked account's balance will be adjusted back as if this transaction never happened."
            : "This can't be undone."
        }
        confirmLabel="Delete transaction"
        onConfirm={confirmDelete}
        pending={isPending}
      >
        {target && (
          <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">{target.description}</p>
              <p className="text-xs text-muted-foreground">{target.category.name} · {formatDate(target.date)}</p>
            </div>
            <span className={`shrink-0 pl-3 font-bold tabular-nums ${target.type === "INCOME" ? "text-income" : "text-expense"}`}>
              {target.type === "INCOME" ? "+" : "-"}{formatCurrency(target.amount, currency)}
            </span>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
