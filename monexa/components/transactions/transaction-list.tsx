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
      toast.success(result.success);
      setTarget(null);
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
          <Receipt className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
      <div className="space-y-2">
        {transactions.map((t) => {
          const isIncome = t.type === "INCOME";
          return (
            <div
              key={t.id}
              onClick={canEdit ? () => setEditing(t) : undefined}
              className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-sm hover:border-gray-200 group ${canEdit ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${
                  isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-[#1e293b] truncate">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{t.category.name}</span>
                    <span className="text-xs font-medium text-gray-400">{formatDate(t.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <span className={`text-sm sm:text-base font-bold tabular-nums ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>
                  {isIncome ? "+" : "-"}{formatCurrency(t.amount, currency)}
                </span>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${t.description}`}
                    onClick={(e) => { e.stopPropagation(); setEditing(t); }}
                    className="h-8 w-8 rounded-full text-gray-400 transition-opacity hover:bg-emerald-50 hover:text-emerald-600 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${t.description}`}
                  onClick={(e) => { e.stopPropagation(); setTarget(t); }}
                  className="h-8 w-8 rounded-full text-gray-400 transition-opacity hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {formOptions && (
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:max-w-lg sm:p-6">
            <DialogHeader className="flex-row items-center gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold text-[#1e293b]">Edit transaction</DialogTitle>
                <DialogDescription className="text-sm text-gray-400">
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
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <div className="min-w-0">
              <p className="truncate font-bold text-[#1e293b]">{target.description}</p>
              <p className="text-xs text-gray-400">{target.category.name} · {formatDate(target.date)}</p>
            </div>
            <span className={`shrink-0 pl-3 font-bold tabular-nums ${target.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
              {target.type === "INCOME" ? "+" : "-"}{formatCurrency(target.amount, currency)}
            </span>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
