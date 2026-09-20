"use client";

import { useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toDateInputValue, toMonthStr } from "@/lib/dates";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";

const transactionSchema = z.object({
  description: z.string().trim().min(1, "Add a short description"),
  amount: z.number({ error: "Enter an amount" }).positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Pick a category"),
  accountId: z.string().optional(),
  date: z.string().min(1, "Pick a date"),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Account = {
  id: string;
  name: string;
};

type Budget = {
  id: string;
  categoryId: string;
  amount: number;
  /** Already spent this month (from the budgets data). */
  spentAmount?: number;
  category?: { name: string };
};

/** An existing transaction to edit. */
export type EditableTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  accountId?: string | null;
  date: Date | string;
  notes?: string | null;
};

/** A label with an optional hint on the right and an error message underneath. */
function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-[#1e293b]">
          {label}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** A pill-shaped choice, used for categories, accounts and quick dates. */
function Chip({
  active,
  tone = "emerald",
  onClick,
  title,
  children,
}: {
  active: boolean;
  tone?: "emerald" | "rose";
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        active
          ? tone === "rose"
            ? "border-rose-500/50 bg-rose-50 text-rose-700"
            : "border-emerald-500/50 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  );
}

export function TransactionForm({
  categories,
  accounts,
  budgets,
  currency = "USD",
  transaction,
  onSuccess,
}: {
  categories: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  currency?: string;
  /** Pass to edit an existing transaction instead of creating one. */
  transaction?: EditableTransaction;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!transaction;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          type: transaction.type,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          accountId: transaction.accountId ?? "",
          // Stored at 12:00 UTC, so the UTC date is the day the user picked.
          date: new Date(transaction.date).toISOString().slice(0, 10),
          notes: transaction.notes ?? "",
        }
      : {
          description: "",
          type: "EXPENSE",
          categoryId: "",
          accountId: "",
          date: toDateInputValue(),
          notes: "",
        },
  });

  const type = useWatch({ control, name: "type" });
  const amount = useWatch({ control, name: "amount" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const accountId = useWatch({ control, name: "accountId" });
  const date = useWatch({ control, name: "date" });

  const isExpense = type === "EXPENSE";
  const visibleCategories = categories.filter((c) => c.type === type);
  const budgetByCategory = useMemo(() => new Map((budgets ?? []).map((b) => [b.categoryId, b])), [budgets]);

  const today = toDateInputValue();
  const yesterday = toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1));
  const validAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0;

  // Budget status for the chosen category. The budgets passed in are for the
  // current month, so only show it when the transaction falls in this month.
  const budget = isExpense && categoryId && date?.slice(0, 7) === toMonthStr() ? budgetByCategory.get(categoryId) : undefined;
  const spent = budget?.spentAmount ?? 0;
  // When editing, this transaction is already part of "spent", so don't add it twice.
  const projected = spent + (!isEdit && validAmount ? amount : 0);
  const budgetLeft = budget ? budget.amount - projected : 0;
  const budgetPct = budget ? Math.min(100, Math.round((projected / budget.amount) * 100)) : 0;

  const onSubmit = (data: TransactionFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("amount", data.amount.toString());
      formData.append("type", data.type);
      formData.append("categoryId", data.categoryId);
      if (data.accountId) formData.append("accountId", data.accountId);
      formData.append("date", data.date);
      if (data.notes) formData.append("notes", data.notes);

      const result = transaction
        ? await updateTransaction(transaction.id, formData)
        : await createTransaction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        if (!isEdit) reset();
        onSuccess?.();
      }
    });
  };

  const submitLabel = isEdit ? "Save changes" : isExpense ? "Add expense" : "Add income";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Type */}
      <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
        {(["EXPENSE", "INCOME"] as const).map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (type === t) return;
                setValue("type", t);
                setValue("categoryId", ""); // categories differ per type
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                active
                  ? cn("bg-white shadow-sm", t === "EXPENSE" ? "text-rose-600" : "text-emerald-600")
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t === "EXPENSE" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div className="rounded-3xl bg-gray-50 px-4 py-5 text-center">
        <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className={cn("text-3xl font-bold", isExpense ? "text-rose-600" : "text-emerald-600")}>
            {getCurrencySymbol(currency)}
          </span>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            autoFocus={!isEdit}
            aria-invalid={!!errors.amount}
            className="w-44 bg-transparent text-center text-4xl font-bold tabular-nums text-[#1e293b] outline-none placeholder:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            {...register("amount", { valueAsNumber: true })}
          />
        </div>
        {errors.amount && (
          <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
            {errors.amount.message}
          </p>
        )}
      </div>

      {/* Description */}
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Input
          id="description"
          placeholder={isExpense ? "e.g. Weekly groceries" : "e.g. October salary"}
          className="h-11 rounded-xl"
          {...register("description")}
        />
      </Field>

      {/* Category */}
      <Field label="Category" error={errors.categoryId?.message}>
        {visibleCategories.length === 0 ? (
          <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
            You have no {isExpense ? "expense" : "income"} categories yet.{" "}
            <Link href="/dashboard/categories" className="font-semibold underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
            {visibleCategories.map((cat) => {
              const b = isExpense ? budgetByCategory.get(cat.id) : undefined;
              return (
                <Chip
                  key={cat.id}
                  active={categoryId === cat.id}
                  tone={isExpense ? "rose" : "emerald"}
                  onClick={() => setValue("categoryId", cat.id, { shouldValidate: true })}
                  title={b ? `Has a ${formatCurrency(b.amount, currency)} budget this month` : undefined}
                >
                  {cat.name}
                  {b && <Wallet className="h-3 w-3 opacity-60" aria-label="Has a budget" />}
                </Chip>
              );
            })}
          </div>
        )}

        {budget && (
          <div className="mt-3 rounded-2xl bg-gray-50 p-3.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-gray-600">
                {budget.category?.name ?? "Category"} budget
              </span>
              <span className={cn("font-bold tabular-nums", budgetLeft < 0 ? "text-rose-600" : "text-emerald-600")}>
                {budgetLeft < 0
                  ? `${formatCurrency(-budgetLeft, currency)} over`
                  : `${formatCurrency(budgetLeft, currency)} left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={cn("h-full rounded-full transition-all", budgetLeft < 0 ? "bg-rose-500" : "bg-emerald-500")}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {isEdit
                ? `${formatCurrency(spent, currency)} of ${formatCurrency(budget.amount, currency)} spent this month`
                : validAmount
                  ? `After this: ${formatCurrency(projected, currency)} of ${formatCurrency(budget.amount, currency)} spent`
                  : `${formatCurrency(spent, currency)} of ${formatCurrency(budget.amount, currency)} spent this month`}
            </p>
          </div>
        )}
      </Field>

      {/* Account */}
      {accounts && accounts.length > 0 && (
        <Field label="Account" hint={isExpense ? "Paid from" : "Deposited to"}>
          <div role="radiogroup" aria-label="Account" className="flex flex-wrap gap-2">
            <Chip active={!accountId} onClick={() => setValue("accountId", "")}>
              None
            </Chip>
            {accounts.map((acc) => (
              <Chip key={acc.id} active={accountId === acc.id} onClick={() => setValue("accountId", acc.id)}>
                {acc.name}
              </Chip>
            ))}
          </div>
          {accountId && <p className="text-xs text-gray-400">The account balance updates automatically.</p>}
        </Field>
      )}

      {/* Date */}
      <Field label="Date" htmlFor="date" error={errors.date?.message}>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Quick date">
          <Chip active={date === today} onClick={() => setValue("date", today, { shouldValidate: true })}>
            Today
          </Chip>
          <Chip active={date === yesterday} onClick={() => setValue("date", yesterday, { shouldValidate: true })}>
            Yesterday
          </Chip>
          <Input id="date" type="date" className="h-9 min-w-40 flex-1 rounded-full px-3.5" {...register("date")} />
        </div>
      </Field>

      {/* Notes */}
      <Field label="Notes" htmlFor="notes" hint="Optional">
        <Input id="notes" placeholder="Anything worth remembering" className="h-11 rounded-xl" {...register("notes")} />
      </Field>

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "h-12 w-full rounded-full text-base font-bold text-white",
          isExpense ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
        )}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
        {validAmount && <span className="ml-2 font-semibold opacity-80">· {formatCurrency(amount, currency)}</span>}
      </Button>
    </form>
  );
}
