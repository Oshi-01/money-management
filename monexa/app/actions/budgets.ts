"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format"), // YYYY-MM
});

export async function getBudgetsWithSpending(monthStr: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { 
        userId: user.id,
        month: monthStr 
      },
      include: {
        category: true
      },
      orderBy: { amount: "desc" },
    });

    // To calculate spending, we need the start and end dates of the month
    const [year, month] = monthStr.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all expense transactions in this month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    // Group transactions by categoryId
    const spentByCategory = transactions.reduce((acc, tx) => {
      acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    // Combine budget data with spending data
    const budgetsWithSpending = budgets.map(budget => {
      const spent = spentByCategory[budget.categoryId] || 0;
      return {
        ...budget,
        spentAmount: spent,
        isOverBudget: spent > budget.amount
      };
    });

    // Calculate totals
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    // Only count spending for categories that have budgets for the total spent
    const totalSpentInBudgets = budgetsWithSpending.reduce((acc, b) => acc + b.spentAmount, 0);

    return { 
      budgets: budgetsWithSpending,
      summary: {
        totalBudget,
        totalSpent: totalSpentInBudgets
      }
    };
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return { budgets: [], summary: { totalBudget: 0, totalSpent: 0 } };
  }
}

export async function getEnfixBudgetsData(monthStr: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    const [year, month] = monthStr.split("-").map(Number);
    
    // Get all budgets for the requested month
    const currentBudgets = await prisma.budget.findMany({
      where: { userId: user.id, month: monthStr },
      include: { category: true },
      orderBy: { amount: "desc" },
    });

    if (currentBudgets.length === 0) {
      return { budgets: [], summary: { totalBudget: 0, totalSpent: 0 } };
    }

    // Prepare date ranges
    // Current month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Previous month
    const prevMonthStartDate = new Date(year, month - 2, 1);
    const prevMonthEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // 10 months ago
    const tenMonthsAgo = new Date(year, month - 10, 1);

    // Fetch all transactions for the last 10 months for these categories
    const categoryIds = currentBudgets.map(b => b.categoryId);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        categoryId: { in: categoryIds },
        date: { gte: tenMonthsAgo, lte: endDate }
      }
    });

    // Fetch all budgets for the last 10 months for these categories
    const historicalBudgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        categoryId: { in: categoryIds },
      }
    });

    const resultBudgets = currentBudgets.map(budget => {
      // Current month spending
      const currentSpent = transactions
        .filter(t => t.categoryId === budget.categoryId && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + t.amount, 0);

      // Last month spending
      const lastMonthSpent = transactions
        .filter(t => t.categoryId === budget.categoryId && t.date >= prevMonthStartDate && t.date <= prevMonthEndDate)
        .reduce((sum, t) => sum + t.amount, 0);

      // Build 10-month history
      const history = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 9; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const mSpent = transactions
          .filter(t => t.categoryId === budget.categoryId && t.date >= mStart && t.date <= mEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        const mBudget = historicalBudgets.find(b => b.categoryId === budget.categoryId && b.month === mStr)?.amount || 0;

        history.push({
          month: monthNames[d.getMonth()],
          fullMonth: mStr,
          spent: mSpent,
          budget: mBudget
        });
      }

      return {
        ...budget,
        spentAmount: currentSpent,
        lastMonthSpent,
        isOverBudget: currentSpent > budget.amount,
        history
      };
    });

    const totalBudget = resultBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = resultBudgets.reduce((sum, b) => sum + b.spentAmount, 0);

    return {
      budgets: resultBudgets,
      summary: { totalBudget, totalSpent }
    };
  } catch (error) {
    console.error("Error fetching Enfix budgets:", error);
    return { budgets: [], summary: { totalBudget: 0, totalSpent: 0 } };
  }
}

export async function createBudget(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return { error: "User not found" };

    const rawData = {
      categoryId: formData.get("categoryId") as string,
      amount: parseFloat(formData.get("amount") as string),
      month: formData.get("month") as string,
    };

    const validatedData = createBudgetSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid data provided" };
    }

    // Check if budget already exists for this category and month
    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month: {
          userId: user.id,
          categoryId: validatedData.data.categoryId,
          month: validatedData.data.month
        }
      }
    });

    if (existingBudget) {
      // Update existing
      await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: validatedData.data.amount }
      });
    } else {
      // Create new
      await prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: validatedData.data.categoryId,
          amount: validatedData.data.amount,
          month: validatedData.data.month,
        },
      });
    }

    revalidatePath("/dashboard/budgets");
    return { success: "Budget saved successfully" };
  } catch (error) {
    console.error("Error creating budget:", error);
    return { error: "Failed to save budget" };
  }
}

export async function deleteBudget(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const budget = await prisma.budget.findUnique({
      where: { id },
    });

    if (!budget || budget.userId !== user.id) {
      return { error: "Budget not found or unauthorized" };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/dashboard/budgets");
    return { success: "Budget deleted successfully" };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return { error: "Failed to delete budget" };
  }
}
