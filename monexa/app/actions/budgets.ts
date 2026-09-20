"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { carryOverBudgets } from "@/lib/budget-carry-over";

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

    // New month? Bring last month's budgets forward (spent restarts at 0).
    await carryOverBudgets(user.id, monthStr);

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

    // --- Weekly setup: last 8 weeks (Mon-Sun), anchored to today ---
    const now = new Date();
    const startOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay(); // 0 = Sun
      const diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
      date.setHours(0, 0, 0, 0);
      return date;
    };
    const currentWeekStart = startOfWeek(now);
    const weekRanges = Array.from({ length: 8 }, (_, idx) => {
      const i = 7 - idx;
      const s = new Date(currentWeekStart);
      s.setDate(s.getDate() - i * 7);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: `${s.getDate()}/${s.getMonth() + 1}` };
    });

    // --- Yearly setup: this year + previous 2 years ---
    const yearList = [year - 2, year - 1, year];

    // Fetch all transactions needed for monthly history, weekly view and yearly view
    // in one query, spanning the widest required range.
    const categoryIds = currentBudgets.map(b => b.categoryId);
    const queryStart = new Date(Math.min(tenMonthsAgo.getTime(), new Date(yearList[0], 0, 1).getTime()));
    const queryEnd = new Date(Math.max(endDate.getTime(), now.getTime(), weekRanges[weekRanges.length - 1].end.getTime()));
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        categoryId: { in: categoryIds },
        date: { gte: queryStart, lte: queryEnd }
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

      // --- Weekly view: monthly amount spread evenly across the weeks of
      // the selected month (the schema only stores a monthly figure). ---
      const daysInSelectedMonth = new Date(year, month, 0).getDate();
      const weeklyBudgetAmount = budget.amount / (daysInSelectedMonth / 7);

      const weeklyChart = weekRanges.map(w => {
        const spent = transactions
          .filter(t => t.categoryId === budget.categoryId && t.date >= w.start && t.date <= w.end)
          .reduce((sum, t) => sum + t.amount, 0);
        return { month: w.label, fullMonth: w.label, spent, budget: weeklyBudgetAmount };
      });
      const thisWeekSpent = weeklyChart[weeklyChart.length - 1].spent;
      const lastWeekSpent = weeklyChart[weeklyChart.length - 2].spent;

      // --- Yearly view: sums actual months that have a budget set for that
      // calendar year; falls back to (monthly amount x 12) if none are set. ---
      const yearlyChart = yearList.map(y => {
        const yStart = new Date(y, 0, 1);
        const yEnd = new Date(y, 11, 31, 23, 59, 59, 999);
        const spent = transactions
          .filter(t => t.categoryId === budget.categoryId && t.date >= yStart && t.date <= yEnd)
          .reduce((sum, t) => sum + t.amount, 0);
        const budgetedMonths = historicalBudgets.filter(
          b => b.categoryId === budget.categoryId && b.month.startsWith(`${y}-`)
        );
        const yearBudget = budgetedMonths.length > 0
          ? budgetedMonths.reduce((sum, b) => sum + b.amount, 0)
          : (y === year ? budget.amount * 12 : 0);
        return { month: String(y), fullMonth: String(y), spent, budget: yearBudget };
      });
      const thisYear = yearlyChart[yearlyChart.length - 1];
      const lastYear = yearlyChart[yearlyChart.length - 2];

      return {
        ...budget,
        spentAmount: currentSpent,
        lastMonthSpent,
        isOverBudget: currentSpent > budget.amount,
        history,
        periods: {
          weekly: {
            totalBudget: weeklyBudgetAmount,
            spent: thisWeekSpent,
            lastPeriodSpent: lastWeekSpent,
            isOverBudget: thisWeekSpent > weeklyBudgetAmount,
            chart: weeklyChart,
          },
          yearly: {
            totalBudget: thisYear.budget,
            spent: thisYear.spent,
            lastPeriodSpent: lastYear.spent,
            isOverBudget: thisYear.spent > thisYear.budget,
            chart: yearlyChart,
          },
        },
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
