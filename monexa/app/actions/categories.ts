"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  let categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }, // System defaults
      ],
    },
    orderBy: { name: "asc" },
  });

  // Auto-seed categories to ensure defaults always exist
  const defaultCategories = [
    { name: "Salary", type: "INCOME" as const },
    { name: "Investments", type: "INCOME" as const },
    { name: "Housing", type: "EXPENSE" as const },
    { name: "Groceries", type: "EXPENSE" as const },
    { name: "Utilities", type: "EXPENSE" as const },
    { name: "Transportation", type: "EXPENSE" as const },
    { name: "Dining Out", type: "EXPENSE" as const },
    { name: "Entertainment", type: "EXPENSE" as const },
    { name: "Shopping", type: "EXPENSE" as const },
    { name: "Travel", type: "EXPENSE" as const },
    { name: "Health", type: "EXPENSE" as const },
    { name: "Education", type: "EXPENSE" as const },
  ];
  
  // Seed the defaults once, for a user who has no categories of their own yet.
  // (Checking each default by name would bring a category straight back after
  // the user renamed or deleted it.) skipDuplicates makes it safe when several
  // requests load at the same moment.
  const hasOwnCategories = categories.some(c => c.userId === userId);
  let added = false;
  if (!hasOwnCategories) {
    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({ name: cat.name, type: cat.type, userId })),
      skipDuplicates: true,
    });
    added = true;
  }

  if (added) {
    categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { name: "asc" },
    });
  }

  return categories;
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const data = Object.fromEntries(formData.entries());
    const validated = categorySchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const name = validated.data.name.trim();
    if (!name) return { error: "Name is required" };

    await prisma.category.create({
      data: {
        ...validated.data,
        name,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Category created successfully" };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "You already have a category with that name and type" };
    console.error("Failed to create category", error);
    return { error: "Failed to create category" };
  }
}

/** Prisma unique-constraint violation (P2002). */
function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

/**
 * Rename a category or change its type. The type can only change while
 * nothing uses the category - otherwise existing income transactions would end
 * up under an expense category (or the other way round).
 */
export async function updateCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const validated = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: "Invalid data" };
    const name = validated.data.name.trim();
    if (!name) return { error: "Name is required" };

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: "Category not found" };
    if (category.userId !== userId) return { error: "Cannot edit system category" };

    if (validated.data.type !== category.type) {
      const usage = await getCategoryUsage(id);
      if (usage.transactions > 0 || usage.budgets > 0) {
        return { error: "This category has transactions or budgets, so its type can't be changed. Create a new category instead." };
      }
    }

    await prisma.category.update({
      where: { id },
      data: { name, type: validated.data.type },
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Category updated" };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "You already have a category with that name and type" };
    console.error("Failed to update category", error);
    return { error: "Failed to update category" };
  }
}

/** How much data is attached to a category - shown before deleting it. */
export async function getCategoryUsage(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { transactions: 0, budgets: 0 };
  const userId = session.user.id;

  const [transactions, budgets] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id, userId } }),
    prisma.budget.count({ where: { categoryId: id, userId } }),
  ]);
  return { transactions, budgets };
}

/**
 * Deletes a category. The database cascades a category delete to its
 * transactions and budgets, so anything attached is first moved to
 * `moveToId` - nothing is ever silently lost.
 */
export async function deleteCategory(id: string, moveToId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: "Category not found" };
    if (category.userId !== userId) return { error: "Cannot delete system category" };

    const usage = await getCategoryUsage(id);
    const hasData = usage.transactions > 0 || usage.budgets > 0;

    let target: { id: string; name: string } | null = null;
    if (hasData) {
      if (!moveToId) {
        return { error: "Choose a category to move this category's transactions and budgets to" };
      }
      target = await prisma.category.findFirst({
        where: { id: moveToId, type: category.type, OR: [{ userId }, { userId: null }] },
        select: { id: true, name: true },
      });
      if (!target || target.id === id) return { error: "Choose a valid category to move data to" };
    }

    await prisma.$transaction(async (tx) => {
      if (target) {
        await tx.transaction.updateMany({
          where: { categoryId: id, userId },
          data: { categoryId: target.id },
        });

        // Budgets are unique per category+month: merge into the target's
        // budget for the same month (limits added), otherwise just move it.
        const budgets = await tx.budget.findMany({ where: { categoryId: id, userId } });
        for (const b of budgets) {
          const existing = await tx.budget.findUnique({
            where: { userId_categoryId_month: { userId, categoryId: target.id, month: b.month } },
          });
          if (existing) {
            await tx.budget.update({ where: { id: existing.id }, data: { amount: existing.amount + b.amount } });
            await tx.budget.delete({ where: { id: b.id } });
          } else {
            await tx.budget.update({ where: { id: b.id }, data: { categoryId: target.id } });
          }
        }
      }

      await tx.category.delete({ where: { id } });
    });

    revalidatePath("/dashboard", "layout");
    return {
      success: target
        ? `"${category.name}" deleted - its data was moved to "${target.name}"`
        : `"${category.name}" deleted`,
    };
  } catch (error) {
    console.error("Failed to delete category", error);
    return { error: "Failed to delete category" };
  }
}
