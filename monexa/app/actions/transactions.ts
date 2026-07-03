"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const transactionSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export async function getTransactions(page = 1, pageSize = 10, filters?: { type?: string; categoryId?: string; search?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Record<string, unknown> = { userId: session.user.id };

  if (filters?.type && filters.type !== "ALL") {
    where.type = filters.type;
  }
  if (filters?.categoryId && filters.categoryId !== "ALL") {
    where.categoryId = filters.categoryId;
  }
  if (filters?.search) {
    where.description = { contains: filters.search, mode: "insensitive" };
  }

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, totalCount };
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

    await prisma.transaction.create({
      data: {
        ...validated.data,
        date: new Date(validated.data.date),
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/transactions");
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

    await prisma.transaction.delete({ where: { id } });
    
    revalidatePath("/dashboard/transactions");
    return { success: "Transaction deleted" };
  } catch (error) {
    console.error("Failed to delete transaction", error);
    return { error: "Failed to delete transaction" };
  }
}
