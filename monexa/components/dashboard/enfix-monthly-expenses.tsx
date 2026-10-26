import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";

interface SpendingBreakdown {
  name: string;
  amount: number;
  percent: number;
  colorHex: string;
}

export function EnfixMonthlyExpenses({ breakdown, currency = "USD" }: { breakdown: SpendingBreakdown[]; currency?: string }) {
  return <ExpenseBreakdownChart title="Spending by category" data={breakdown.map(row => ({ name: row.name, value: row.amount, percent: row.percent }))} currency={currency} />;
}
