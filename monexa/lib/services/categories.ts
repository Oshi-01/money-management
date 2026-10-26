import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { categoryInputSchema, type ManagedCategory } from "@/shared/categories";

export class CategoryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const defaultCategories = [
  { name: "Salary", type: "INCOME" as const }, { name: "Investments", type: "INCOME" as const },
  ...["Housing", "Groceries", "Utilities", "Transportation", "Dining Out", "Entertainment", "Shopping", "Travel", "Health", "Education"].map(name => ({ name, type: "EXPENSE" as const })),
];

export async function getCategories(userId: string) {
  const where = { OR: [{ userId }, { userId: null }] };
  let categories = await prisma.category.findMany({ where, orderBy: { name: "asc" } });
  if (!categories.some(category => category.userId === userId)) {
    await prisma.category.createMany({ data: defaultCategories.map(category => ({ ...category, userId })), skipDuplicates: true });
    categories = await prisma.category.findMany({ where, orderBy: { name: "asc" } });
  }
  return categories;
}

export async function getManagedCategories(userId: string): Promise<ManagedCategory[]> {
  const categories = await getCategories(userId);
  const [transactions, budgets] = await Promise.all([
    prisma.transaction.groupBy({ by: ["categoryId"], where: { userId }, _count: { _all: true } }),
    prisma.budget.groupBy({ by: ["categoryId"], where: { userId }, _count: { _all: true } }),
  ]);
  const txCounts = new Map(transactions.map(item => [item.categoryId, item._count._all]));
  const budgetCounts = new Map(budgets.map(item => [item.categoryId, item._count._all]));
  return categories.map(category => ({ id: category.id, name: category.name, type: category.type, isSystem: category.userId === null, transactions: txCounts.get(category.id) ?? 0, budgets: budgetCounts.get(category.id) ?? 0 }));
}

export async function getCategoryUsage(userId: string, id: string) {
  const [transactions, budgets] = await Promise.all([
    prisma.transaction.count({ where: { userId, categoryId: id } }),
    prisma.budget.count({ where: { userId, categoryId: id } }),
  ]);
  return { transactions, budgets };
}

export async function getManagedCategory(userId: string, id: string): Promise<ManagedCategory> {
  const category = await prisma.category.findFirst({ where: { id, OR: [{ userId }, { userId: null }] } });
  if (!category) throw new CategoryError("Category not found.", 404);
  return { id: category.id, name: category.name, type: category.type, isSystem: category.userId === null, ...await getCategoryUsage(userId, id) };
}

function translateDatabaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new CategoryError("You already have a category with that name and type.", 409);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new CategoryError("This category changed during the request. Refresh and try again.", 409);
  throw error;
}

export async function createCategory(userId: string, value: unknown) {
  const input = categoryInputSchema.parse(value);
  try { return await prisma.category.create({ data: { ...input, userId } }); }
  catch (error) { return translateDatabaseError(error); }
}

async function lockCategories(tx: Prisma.TransactionClient, ids: string[]) {
  await tx.$queryRaw`SELECT "id" FROM "Category" WHERE "id" IN (${Prisma.join([...new Set(ids)].sort())}) ORDER BY "id" FOR UPDATE`;
}

export async function updateCategory(userId: string, id: string, value: unknown) {
  const input = categoryInputSchema.parse(value);
  try {
    return await prisma.$transaction(async tx => {
      await lockCategories(tx, [id]);
      const category = await tx.category.findFirst({ where: { id, OR: [{ userId }, { userId: null }] } });
      if (!category) throw new CategoryError("Category not found.", 404);
      if (category.userId !== userId) throw new CategoryError("Built-in categories cannot be edited.", 403);
      if (input.type !== category.type) {
        const [transactions, budgets] = await Promise.all([tx.transaction.count({ where: { categoryId: id } }), tx.budget.count({ where: { categoryId: id } })]);
        if (transactions || budgets) throw new CategoryError("This category has transactions or budgets. Create a new category to use a different type.", 409);
      }
      return tx.category.update({ where: { id }, data: { name: input.name, type: input.type } });
    });
  } catch (error) { return translateDatabaseError(error); }
}

export async function deleteCategory(userId: string, id: string, moveToId?: string) {
  try {
    return await prisma.$transaction(async tx => {
      // Lock before counting: a concurrent transaction cannot be silently cascaded away.
      await lockCategories(tx, moveToId ? [id, moveToId] : [id]);
      const category = await tx.category.findFirst({ where: { id, OR: [{ userId }, { userId: null }] } });
      if (!category) throw new CategoryError("Category not found.", 404);
      if (category.userId !== userId) throw new CategoryError("Built-in categories cannot be deleted.", 403);
      const [transactionCount, budgets] = await Promise.all([tx.transaction.count({ where: { categoryId: id } }), tx.budget.findMany({ where: { categoryId: id } })]);
      const hasData = transactionCount > 0 || budgets.length > 0;
      let target: { id: string; name: string } | null = null;
      if (hasData) {
        if (!moveToId) throw new CategoryError("Choose a category to move the existing transactions and budgets to.", 409);
        target = await tx.category.findFirst({ where: { id: moveToId, type: category.type, OR: [{ userId }, { userId: null }] }, select: { id: true, name: true } });
        if (!target || target.id === id) throw new CategoryError("Choose another category of the same type.");
        const foreignTransactions = await tx.transaction.count({ where: { categoryId: id, userId: { not: userId } } });
        if (foreignTransactions || budgets.some(budget => budget.userId !== userId)) throw new CategoryError("This category has shared references and cannot be deleted.", 409);
        await tx.transaction.updateMany({ where: { categoryId: id, userId }, data: { categoryId: target.id } });
        for (const budget of budgets) {
          const existing = await tx.budget.findUnique({ where: { userId_categoryId_month: { userId, categoryId: target.id, month: budget.month } } });
          if (existing) {
            await tx.budget.update({ where: { id: existing.id }, data: { amount: { increment: budget.amount }, showOnDashboard: existing.showOnDashboard || budget.showOnDashboard } });
            await tx.budget.delete({ where: { id: budget.id } });
          } else await tx.budget.update({ where: { id: budget.id }, data: { categoryId: target.id } });
        }
      }
      await tx.category.delete({ where: { id } });
      return { success: target ? `“${category.name}” deleted. Its data was moved to “${target.name}”.` : `“${category.name}” deleted.` };
    });
  } catch (error) { return translateDatabaseError(error); }
}
