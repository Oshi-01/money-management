"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getEnfixProfileData() {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    // 1. Calculate Monthly Budget vs Spent
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month: currentMonthStr },
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: mStart, lte: mEnd }
      }
    });

    const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 2. Recent Spending (Last 7 months) for the small line chart
    const recentSpending = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const txs = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: start, lte: end }
        }
      });

      const monthSpent = txs.reduce((sum, t) => sum + t.amount, 0);
      // Just some baseline dummy data if user has no data so the chart isn't flat 0
      const amount = monthSpent > 0 ? monthSpent : 0;

      recentSpending.push({
        year: d.getFullYear().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        amount: amount
      });
    }

    // 3. Real "Connected Accounts" from Database
    const dbAccounts = await prisma.account.findMany({
      where: { userId: user.id },
      include: {
        transactions: {
          where: {
            date: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) }
          }
        }
      }
    });

    const accounts = dbAccounts.map((acc: { transactions: any[]; balance: number; id: any; name: any; type: any; prefix: any; }) => {
      // Generate a 7-point trend line based on actual transactions
      // We know current balance, and we'll work backwards or forward
      // Actually, since acc.balance is the CURRENT balance, we can work backwards 
      // by subtracting incomes and adding expenses that happened in each month

      const trend = [];
      let sum = 0;
      let max = -Infinity;
      let min = Infinity;

      // Group transactions by month
      const txsByMonth: Record<string, number> = {};
      acc.transactions.forEach((t: { date: { getFullYear: () => any; getMonth: () => number; }; type: string; amount: number; }) => {
        const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        if (!txsByMonth[key]) txsByMonth[key] = 0;
        // if income, it added to balance. if expense, it subtracted from balance.
        // So net change for the month:
        txsByMonth[key] += (t.type === "INCOME" ? t.amount : -t.amount);
      });

      // To find historical balances, we start from current balance and subtract the net change of the CURRENT and PAST months as we go backwards.
      // Wait, a simpler way: just generate points going forwards. 
      // Calculate balance 6 months ago = current balance - sum of all net changes in last 6 months.
      const totalNetChangeLast6Months = acc.transactions.reduce((sum: any, t: { type: string; amount: number; }) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);
      let runningBalance = acc.balance - totalNetChangeLast6Months;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const netChange = txsByMonth[key] || 0;
        runningBalance += netChange;

        if (runningBalance > max) max = runningBalance;
        if (runningBalance < min) min = runningBalance;
        sum += runningBalance;

        trend.push({
          point: d.toLocaleDateString('en-US', { month: 'short' }),
          balance: runningBalance
        });
      }

      if (max === -Infinity) max = acc.balance;
      if (min === Infinity) min = acc.balance;

      return {
        id: acc.id,
        name: acc.name,
        fullName: acc.name,
        type: acc.type,
        prefix: acc.prefix || '',
        balance: acc.balance,
        trend,
        stats: {
          average: sum / 7,
          highest: max,
          lowest: min
        }
      };
    });

    return {
      user: {
        name: user.name || "Finance Manager",
        email: user.email,
        image: user.image || "/images/avatar.png"
      },
      budget: {
        total: totalBudget, // dynamic
        spent: totalSpent, // dynamic
      },
      recentSpending,
      accounts
    };

  } catch (error) {
    console.error("Error fetching profile data:", error);
    return null;
  }
}

export async function createAccount(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return { error: "User not found" };

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const prefix = formData.get("prefix") as string;
    const balance = parseFloat(formData.get("balance") as string);

    if (!name || !type || isNaN(balance)) {
      return { error: "Missing required fields" };
    }

    await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        prefix,
        balance
      }
    });

    return { success: "Account created successfully" };
  } catch (error) {
    console.error("Error creating account:", error);
    return { error: "Failed to create account" };
  }
}
