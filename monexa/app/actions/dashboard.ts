"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  
  const currency = user?.currency || "USD";

  // 1. Get total income and expense
  const aggregates = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });

  const totalIncome = aggregates.find((a) => a.type === "INCOME")?._sum.amount || 0;
  const totalExpense = aggregates.find((a) => a.type === "EXPENSE")?._sum.amount || 0;
  const balance = totalIncome - totalExpense;

  // 2. Get recent 5 transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 5,
    include: { category: true },
  });

  // 3. Get monthly data for the last 30 days (simplified: group by date)
  // For a basic chart, we can fetch all transactions in the last 30 days and group them by date
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rawTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  // Group by date (YYYY-MM-DD)
  const chartDataMap: Record<string, { income: number; expense: number }> = {};
  
  rawTransactions.forEach((tx) => {
    const dateStr = tx.date.toISOString().split("T")[0];
    if (!chartDataMap[dateStr]) {
      chartDataMap[dateStr] = { income: 0, expense: 0 };
    }
    if (tx.type === "INCOME") {
      chartDataMap[dateStr].income += tx.amount;
    } else {
      chartDataMap[dateStr].expense += tx.amount;
    }
  });

  const chartData = Object.keys(chartDataMap).map((date) => ({
    date,
    income: chartDataMap[date].income,
    expense: chartDataMap[date].expense,
  }));

  return {
    totalIncome,
    totalExpense,
    balance,
    recentTransactions,
    chartData,
    currency,
  };
}
