"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { parseDateOnly } from "@/lib/dates";
import type { Prisma } from "@prisma/client";

const transactionSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export type TransactionFilters = {
  type?: string;
  categoryId?: string;
  search?: string;
  /** Inclusive date range, "YYYY-MM-DD". */
  from?: string;
  to?: string;
};

export async function getTransactions(page = 1, pageSize = 10, filters?: TransactionFilters) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Prisma.TransactionWhereInput = { userId: session.user.id };

  if (filters?.type === "INCOME" || filters?.type === "EXPENSE") {
    where.type = filters.type;
  }
  if (filters?.categoryId && filters.categoryId !== "ALL") {
    where.categoryId = filters.categoryId;
  }
  const search = filters?.search?.trim();
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Dates are stored at 12:00 UTC (see lib/dates.ts), so compare on UTC days.
  const isDay = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (isDay(filters?.from) || isDay(filters?.to)) {
    where.date = {
      ...(isDay(filters?.from) && { gte: new Date(`${filters!.from}T00:00:00.000Z`) }),
      ...(isDay(filters?.to) && { lte: new Date(`${filters!.to}T23:59:59.999Z`) }),
    };
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const [transactions, totalCount, sums] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  // Totals cover everything that matches the filters, not just this page.
  const totals = {
    income: sums.find(s => s.type === "INCOME")?._sum.amount ?? 0,
    expense: sums.find(s => s.type === "EXPENSE")?._sum.amount ?? 0,
  };

  return { transactions, totalCount, totals, page: safePage, pageSize };
}

/**
 * The category must be the user's own (or a system default) and match the
 * type; the account (if any) must belong to the user - otherwise anyone could
 * change another user's balance by guessing an account id.
 * Returns an error message, or null when everything is valid.
 */
async function checkCategoryAndAccount(
  userId: string,
  categoryId: string,
  type: "INCOME" | "EXPENSE",
  accountId: string | null,
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) return "Category not found";
  if (category.type !== type) return `"${category.name}" is not an ${type.toLowerCase()} category`;

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return "Account not found";
  }
  return null;
}

/** How a transaction changes its account's balance (+ for income, - for expense). */
const balanceEffect = (type: string, amount: number) => (type === "INCOME" ? amount : -amount);

export async function updateTransaction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return { error: "Transaction not found" };

    const validated = transactionSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: "Invalid data" };

    const { categoryId, description, amount, type, date, notes } = validated.data;
    const accountId = validated.data.accountId || null;

    const ownershipError = await checkCategoryAndAccount(userId, categoryId, type, accountId);
    if (ownershipError) return { error: ownershipError };

    // Undo the old balance effect and apply the new one, all in one step, so
    // changing the amount, type or account always leaves balances correct.
    await prisma.$transaction(async (tx) => {
      if (existing.accountId) {
        await tx.account.updateMany({
          where: { id: existing.accountId, userId },
          data: { balance: { increment: -balanceEffect(existing.type, existing.amount) } },
        });
      }
      if (accountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceEffect(type, amount) } },
        });
      }

      await tx.transaction.update({
        where: { id },
        data: {
          description,
          amount,
          type,
          categoryId,
          accountId,
          date: parseDateOnly(date),
          notes: notes || null,
        },
      });
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Transaction updated" };
  } catch (error) {
    console.error("Failed to update transaction", error);
    return { error: "Failed to update transaction" };
  }
}

export async function createTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const data = Object.fromEntries(formData.entries());
    const validated = transactionSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { categoryId, description, amount, type, date, notes } = validated.data;
    const accountId = validated.data.accountId || null;
    const userId = session.user.id;

    const ownershipError = await checkCategoryAndAccount(userId, categoryId, type, accountId);
    if (ownershipError) return { error: ownershipError };

    // Create the transaction and update the account balance together.
    // Budget usage is calculated from transactions, so budgets need no update.
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId,
          description,
          amount,
          type,
          categoryId,
          accountId,
          date: parseDateOnly(date),
          notes,
        },
      });

      if (accountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: type === "INCOME" ? { increment: amount } : { decrement: amount } },
        });
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Transaction created successfully" };
  } catch (error) {
    console.error("Failed to create transaction", error);
    return { error: "Failed to create transaction" };
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== session.user.id) {
      return { error: "Transaction not found" };
    }

    // Delete and undo its effect on the linked account's balance in one step.
    const userId = session.user.id;
    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } });

      if (transaction.accountId) {
        await tx.account.updateMany({
          where: { id: transaction.accountId, userId },
          data: {
            balance: transaction.type === "INCOME"
              ? { decrement: transaction.amount }
              : { increment: transaction.amount },
          },
        });
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Transaction deleted" };
  } catch (error) {
    console.error("Failed to delete transaction", error);
    return { error: "Failed to delete transaction" };
  }
}
