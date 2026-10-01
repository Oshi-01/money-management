"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { carryOverBudgets } from "@/lib/budget-carry-over";
import { toMonthStr } from "@/lib/dates";

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

  const loans = await prisma.loan.findMany({
    where: { userId, includeInTotal: true },
    select: { loanType: true, balance: true, startDate: true }
  });

  const borrowedBalance = loans.filter(l => l.loanType === 'BORROWED').reduce((acc, l) => acc + l.balance, 0);
  const lentBalance = loans.filter(l => l.loanType === 'LENT').reduce((acc, l) => acc + l.balance, 0);

  const totalIncome = aggregates.find((a) => a.type === "INCOME")?._sum.amount || 0;
  const totalExpense = aggregates.find((a) => a.type === "EXPENSE")?._sum.amount || 0;
  
  // Total balance includes cash flow from active loans (if includeInTotal is true)
  const balance = (totalIncome + borrowedBalance) - (totalExpense + lentBalance);

  // 1b. Calculate trends (compared to last month)
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisMonthAggregates = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: firstDayThisMonth } },
    _sum: { amount: true },
  });
  const thisMonthLoans = loans.filter(l => l.startDate >= firstDayThisMonth);
  const thisMonthBorrowed = thisMonthLoans.filter(l => l.loanType === 'BORROWED').reduce((acc, l) => acc + l.balance, 0);
  const thisMonthLent = thisMonthLoans.filter(l => l.loanType === 'LENT').reduce((acc, l) => acc + l.balance, 0);

  const thisMonthIncome = thisMonthAggregates.find(a => a.type === "INCOME")?._sum.amount || 0;
  const thisMonthExpense = thisMonthAggregates.find(a => a.type === "EXPENSE")?._sum.amount || 0;
  const thisMonthBalance = (thisMonthIncome + thisMonthBorrowed) - (thisMonthExpense + thisMonthLent);

  const lastMonthAggregates = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: firstDayLastMonth, lt: firstDayThisMonth } },
    _sum: { amount: true },
  });
  const lastMonthLoans = loans.filter(l => l.startDate >= firstDayLastMonth && l.startDate < firstDayThisMonth);
  const lastMonthBorrowed = lastMonthLoans.filter(l => l.loanType === 'BORROWED').reduce((acc, l) => acc + l.balance, 0);
  const lastMonthLent = lastMonthLoans.filter(l => l.loanType === 'LENT').reduce((acc, l) => acc + l.balance, 0);

  const lastMonthIncome = lastMonthAggregates.find(a => a.type === "INCOME")?._sum.amount || 0;
  const lastMonthExpense = lastMonthAggregates.find(a => a.type === "EXPENSE")?._sum.amount || 0;
  const lastMonthBalance = (lastMonthIncome + lastMonthBorrowed) - (lastMonthExpense + lastMonthLent);

  // Standard percent-change breaks down when `previous` is negative (it
  // flips the sign of the result, e.g. going from -1,550 to +30,000 would
  // read as "-2035%" instead of the huge improvement it actually is).
  // Dividing by the absolute value keeps the sign of the result meaningful:
  // positive whenever current > previous, negative whenever current < previous.
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : (current > 0 ? 100 : -100);
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Balance is a running cumulative total, so its own "growth" is measured
  // against what the balance was before this month's activity (not against
  // last month's period delta, which is a different quantity).
  const balanceBeforeThisMonth = balance - thisMonthBalance;

  const trends = {
    incomeChange: calculateChange(thisMonthIncome, lastMonthIncome),
    expenseChange: calculateChange(thisMonthExpense, lastMonthExpense),
    balanceChange: calculateChange(thisMonthBalance, lastMonthBalance),
    totalBalanceChange: calculateChange(balance, balanceBeforeThisMonth),
    lastMonthIncome,
    lastMonthExpense,
    lastMonthBalance,
    thisMonthIncome,
    thisMonthExpense,
    thisMonthBalance,
  };

  // 2. Get recent 5 transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 5,
    include: { category: true },
  });

  // 3. Get monthly data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rawTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  const thirtyDaysLoans = loans.filter(l => l.startDate >= thirtyDaysAgo);
  
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

  thirtyDaysLoans.forEach((loan) => {
    const dateStr = loan.startDate.toISOString().split("T")[0];
    if (!chartDataMap[dateStr]) {
      chartDataMap[dateStr] = { income: 0, expense: 0 };
    }
    if (loan.loanType === "BORROWED") {
      chartDataMap[dateStr].income += loan.balance;
    } else {
      chartDataMap[dateStr].expense += loan.balance;
    }
  });

  const chartData = Object.keys(chartDataMap).map((date) => ({
    date,
    income: chartDataMap[date].income,
    expense: chartDataMap[date].expense,
  }));

  // 4. Spendings Breakdown (Top 5 categories by expense percentage)
  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE" },
    _sum: { amount: true },
  });

  // Fetch categories using the centralized function to ensure seeding happens
  const { getCategories } = await import('@/app/actions/categories');
  const categories = await getCategories();
  
  let spendingsBreakdown: { name: string; amount: number; percent: number; colorHex: string }[] = [];
  
  if (totalExpense > 0) {
    const sortedExpenses = expenseByCategory
      .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
      .slice(0, 5);
      
    const colors = ['#f97316', '#eab308', '#84cc16', '#14b8a6', '#8b5cf6', '#64748b'];

    spendingsBreakdown = sortedExpenses.map((exp, index) => {
      const cat = categories.find(c => c.id === exp.categoryId);
      return {
        name: cat?.name || 'Other',
        amount: exp._sum.amount || 0,
        percent: Math.round(((exp._sum.amount || 0) / totalExpense) * 100),
        colorHex: colors[index % colors.length]
      };
    });
  }

  // 5. Savings Trend (Last 6 months net balance)
  // Get all transactions in the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of the month 6 months ago

  const sixMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: sixMonthsAgo }
    }
  });

  const monthlyNet = Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      net: 0,
      income: 0,
      expense: 0
    };
  });

  const sixMonthLoans = loans.filter(l => l.startDate >= sixMonthsAgo);
  
  sixMonthTransactions.forEach(tx => {
    const txMonth = tx.date.getMonth();
    const txYear = tx.date.getFullYear();
    const now = new Date();
    const monthsAgo = (now.getFullYear() - txYear) * 12 + (now.getMonth() - txMonth);
    
    if (monthsAgo >= 0 && monthsAgo < 6) {
      const index = 5 - monthsAgo;
      if (tx.type === 'INCOME') {
        monthlyNet[index].net += tx.amount;
        monthlyNet[index].income += tx.amount;
      } else {
        monthlyNet[index].net -= tx.amount;
        monthlyNet[index].expense += tx.amount;
      }
    }
  });

  sixMonthLoans.forEach(loan => {
    const loanMonth = loan.startDate.getMonth();
    const loanYear = loan.startDate.getFullYear();
    const now = new Date();
    const monthsAgo = (now.getFullYear() - loanYear) * 12 + (now.getMonth() - loanMonth);
    
    if (monthsAgo >= 0 && monthsAgo < 6) {
      const index = 5 - monthsAgo;
      if (loan.loanType === 'BORROWED') {
        monthlyNet[index].net += loan.balance;
        monthlyNet[index].income += loan.balance;
      } else {
        monthlyNet[index].net -= loan.balance;
        monthlyNet[index].expense += loan.balance;
      }
    }
  });

  const savingsTrend = monthlyNet.map(m => ({ month: m.month, net: m.net }));
  const incomeTrend = monthlyNet.map(m => ({ month: m.month, income: m.income }));
  const expenseTrend = monthlyNet.map(m => ({ month: m.month, expense: m.expense }));

  // 6. Savings Goals
  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { userId },
    take: 4,
  });

  // 7. Monthly Budgets
  const currentMonthStr = toMonthStr(); // YYYY-MM, local time like the budgets page
  await carryOverBudgets(userId, currentMonthStr);
  const [budgets, currentMonthExpenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month: currentMonthStr },
      include: { category: true },
      orderBy: { amount: "desc" },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: firstDayThisMonth,
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const currentMonthSpent = new Map(
    currentMonthExpenses.map((expense) => [expense.categoryId, expense._sum.amount || 0]),
  );

  const budgetsWithSpent = budgets.map(b => {
    return {
      ...b,
      spent: currentMonthSpent.get(b.categoryId) || 0,
    };
  });

  return {
    totalIncome,
    totalExpense,
    balance,
    recentTransactions,
    chartData,
    currency,
    spendingsBreakdown,
    savingsTrend,
    incomeTrend,
    expenseTrend,
    savingsGoals,
    budgets: budgetsWithSpent,
    trends
  };
}
