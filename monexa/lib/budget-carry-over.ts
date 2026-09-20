import prisma from "@/lib/prisma";

const toMonthStr = (year: number, monthIndex: number) => {
  const d = new Date(year, monthIndex, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Budgets are stored per month, so a new month would otherwise start with none.
 * This copies the most recent earlier month's budgets (same categories, same
 * limits) into `monthStr` - and into any skipped months in between - the first
 * time that month is opened. Spending is always calculated from the month's
 * transactions, so "spent" naturally starts again from 0.
 *
 * It does nothing if:
 *  - `monthStr` already has budgets (so edits/deletes are never overwritten),
 *  - `monthStr` is in the future,
 *  - the user has no earlier budgets to carry over.
 */
export async function carryOverBudgets(userId: string, monthStr: string) {
  try {
    const now = new Date();
    const currentMonth = toMonthStr(now.getFullYear(), now.getMonth());
    if (monthStr > currentMonth) return;

    const existing = await prisma.budget.count({ where: { userId, month: monthStr } });
    if (existing > 0) return;

    const latest = await prisma.budget.findFirst({
      where: { userId, month: { lt: monthStr } },
      orderBy: { month: "desc" },
      select: { month: true },
    });
    if (!latest) return;

    const source = await prisma.budget.findMany({
      where: { userId, month: latest.month },
    });
    if (source.length === 0) return;

    // Fill every month after the source month up to (and including) monthStr,
    // so months the user skipped don't leave gaps in history / yearly totals.
    const [srcY, srcM] = latest.month.split("-").map(Number);
    const monthsToFill: string[] = [];
    for (let i = 1; i <= 240; i++) {
      const m = toMonthStr(srcY, srcM - 1 + i);
      if (m > monthStr) break;
      monthsToFill.push(m);
    }

    for (const month of monthsToFill) {
      await prisma.budget.createMany({
        data: source.map((b) => ({
          userId,
          categoryId: b.categoryId,
          amount: b.amount,
          month,
        })),
      });
    }
  } catch (error) {
    // A concurrent request may have already created these rows (unique
    // constraint) - that's fine, carry-over is best-effort.
    console.error("Budget carry-over skipped:", error);
  }
}
