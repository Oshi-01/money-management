import { PageHeader } from "@/components/dashboard/page-header";
import { getReportData } from "@/app/actions/reports";
import { getUserSettings } from "@/app/actions/settings";
import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";
import { CashFlowChart } from "@/components/reports/cash-flow-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { formatMonthLabel, monthOrCurrent } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Reports & Analytics - Monexa",
  description: "Visualize and analyze your financial data.",
};

export default async function ReportsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const month = monthOrCurrent(searchParams?.month);
  const periodLabel = formatMonthLabel(month);

  const [reportData, userSettings] = await Promise.all([
    getReportData(month),
    getUserSettings(),
  ]);

  const currency = userSettings?.currency || "USD";
  const { income, expense, net } = reportData.summary;

  const stats = [
    { label: "Income", value: income, icon: ArrowUpRight, tone: "bg-income-soft text-income", text: "text-income" },
    { label: "Expenses", value: expense, icon: ArrowDownRight, tone: "bg-expense-soft text-expense", text: "text-expense" },
    { label: "Net", value: net, icon: Scale, tone: "bg-muted text-secondary-foreground", text: net < 0 ? "text-expense" : "text-foreground" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Reports" description="See where your money goes, month by month.">
        <MonthSwitcher month={month} />
      </PageHeader>

      {/* Month summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone, text }) => (
          <div key={label} className="flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{label} · {periodLabel}</p>
              <p className={`text-2xl font-bold tabular-nums ${text}`}>{formatCurrency(value, currency)}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="app-panel p-4 sm:p-6 flex flex-col">
          <ExpenseBreakdownChart data={reportData.expenseBreakdown} currency={currency} periodLabel={periodLabel} />
        </div>

        <div className="app-panel p-4 sm:p-6 flex flex-col">
          <CashFlowChart data={reportData.cashFlow} currency={currency} periodLabel={periodLabel} />
        </div>
      </div>
    </div>
  );
}
