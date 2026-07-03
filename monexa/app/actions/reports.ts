"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getReportData() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    
    // 1. Expense Breakdown for current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const expensesThisMonth = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      include: { category: true }
    });

    // Group expenses by category
    const expenseBreakdown = Object.values(expensesThisMonth.reduce((acc, tx) => {
      if (!acc[tx.categoryId]) {
        acc[tx.categoryId] = {
          name: tx.category.name,
          value: 0
        };
      }
      acc[tx.categoryId].value += tx.amount;
      return acc;
    }, {} as Record<string, { name: string, value: number }>));

    // Sort by highest value
    expenseBreakdown.sort((a, b) => b.value - a.value);

    // 2. Cash Flow (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo }
      }
    });

    const monthlyData: Record<string, { month: string, income: number, expense: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const yearStr = d.getFullYear().toString().slice(-2);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyData[key] = { month: `${monthStr} '${yearStr}`, income: 0, expense: 0 };
    }

    recentTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
      if (monthlyData[key]) {
        if (tx.type === "INCOME") {
          monthlyData[key].income += tx.amount;
        } else {
          monthlyData[key].expense += tx.amount;
        }
      }
    });

    const cashFlow = Object.values(monthlyData);

    return { 
      expenseBreakdown,
      cashFlow
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    return { expenseBreakdown: [], cashFlow: [] };
  }
}
