"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownRight, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createCategory } from "@/app/actions/categories";
import { categoryInputSchema } from "@/shared/categories";
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
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** A pill-shaped choice, used for categories, accounts and quick dates. */
function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
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
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50",
        active
          ? "border-primary/50 bg-primary-soft text-primary"
          : "border-border bg-card text-secondary-foreground hover:bg-muted",
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
  const [categoryPending, startCategoryTransition] = useTransition();
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
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
  const allCategories = [...categories, ...createdCategories.filter(category => !categories.some(existing => existing.id === category.id))];
  const visibleCategories = allCategories.filter((c) => c.type === type);
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

  function createInlineCategory() {
    if (isPending || categoryPending) return;
    const parsed = categoryInputSchema.safeParse({ name: categoryName, type });
    if (!parsed.success) { setCategoryError(parsed.error.issues[0]?.message ?? "Enter a category name."); return; }
    setCategoryError("");
    startCategoryTransition(async () => {
      try {
        const form = new FormData(); form.set("name", parsed.data.name); form.set("type", parsed.data.type);
        const result = await createCategory(form);
        if (result.error || !result.category) { setCategoryError(result.error ?? "Could not create this category."); return; }
        setCreatedCategories(current => [...current, result.category!]);
        setValue("categoryId", result.category.id, { shouldValidate: true });
        setCategoryName(""); setAddingCategory(false);
      } catch { setCategoryError("Could not confirm category creation. Check your categories before retrying."); }
    });
  }

  const onSubmit = (data: TransactionFormValues) => {
    if (categoryPending || isPending) return;
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
      } else if ("success" in result && result.success) {
        toast.success(result.success);
        if (!isEdit) reset();
        onSuccess?.();
      }
    });
  };

  const submitLabel = isEdit ? "Save changes" : isExpense ? "Add expense" : "Add income";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={isPending || categoryPending} className="min-w-0 space-y-5">
      {/* Type */}
      <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
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
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/50",
                active
                  ? cn("bg-card shadow-sm", t === "EXPENSE" ? "text-expense" : "text-income")
                  : "text-muted-foreground hover:text-secondary-foreground",
              )}
            >
              {t === "EXPENSE" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div className="rounded-3xl bg-muted px-4 py-5 text-center">
        <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className={cn("text-3xl font-bold", isExpense ? "text-expense" : "text-income")}>
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
            className="w-44 bg-transparent text-center text-4xl font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            {...register("amount", { valueAsNumber: true })}
          />
        </div>
        {errors.amount && (
          <p role="alert" className="mt-1 text-xs font-medium text-destructive">
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
          <p className="rounded-2xl bg-warning-soft p-3 text-sm text-warning">
            You have no {isExpense ? "expense" : "income"} categories yet.{" "}
            Add one below to continue.
          </p>
        ) : (
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
            {visibleCategories.map((cat) => {
              const b = isExpense ? budgetByCategory.get(cat.id) : undefined;
              return (
                <Chip
                  key={cat.id}
                  active={categoryId === cat.id}
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

        {addingCategory ? <div className="space-y-3 rounded-2xl border border-border bg-muted p-3">
          <label htmlFor="transaction-category-name" className="text-xs font-medium text-muted-foreground">New {isExpense ? "expense" : "income"} category</label>
          <Input id="transaction-category-name" aria-label="New category name" autoFocus value={categoryName} onChange={event => setCategoryName(event.target.value)} maxLength={40} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); createInlineCategory(); } }} />
          {categoryError && <p role="alert" className="text-sm text-danger">{categoryError}</p>}
          <div className="flex flex-wrap gap-2"><Button type="button" onClick={createInlineCategory}>{categoryPending && <Loader2 className="h-4 w-4 animate-spin" />}Create and use category</Button><Button type="button" variant="ghost" onClick={() => { setAddingCategory(false); setCategoryError(""); }}>Cancel category creation</Button></div>
        </div> : <Button type="button" variant="ghost" className="mt-2 h-9 px-2 text-primary" onClick={() => { setAddingCategory(true); setCategoryError(""); }}>Add a category</Button>}

        {budget && (
          <div className="mt-3 rounded-2xl bg-muted p-3.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-secondary-foreground">
                {budget.category?.name ?? "Category"} budget
              </span>
              <span className={cn("font-bold tabular-nums", budgetLeft < 0 ? "text-warning" : "text-foreground")}>
                {budgetLeft < 0
                  ? `${formatCurrency(-budgetLeft, currency)} over`
                  : `${formatCurrency(budgetLeft, currency)} left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", budgetLeft < 0 ? "bg-warning" : "bg-progress")}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
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
          {accountId && <p className="text-xs text-muted-foreground">The account balance updates automatically.</p>}
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
          "h-12 w-full rounded-full text-base font-bold text-primary-foreground",
          "bg-primary hover:bg-primary-hover",
        )}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
        {validAmount && <span className="ml-2 font-semibold opacity-80">· {formatCurrency(amount, currency)}</span>}
      </Button>
      </fieldset>
    </form>
  );
}
