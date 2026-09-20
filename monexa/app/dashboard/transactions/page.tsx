import { getTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsPagination } from "@/components/transactions/transactions-pagination";
import { ArrowLeftRight } from "lucide-react";
import { toMonthStr } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";

export const metadata = {
  title: "Transactions - Monexa",
  description: "Manage your financial transactions",
};

const PAGE_SIZE = 50;

export default async function TransactionsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const param = (key: string) => {
    const v = searchParams?.[key];
    return typeof v === "string" && v ? v : undefined;
  };

  const filters = {
    search: param("q"),
    type: param("type"),
    categoryId: param("category"),
    from: param("from"),
    to: param("to"),
  };
  const isFiltered = Object.values(filters).some(Boolean);
  const requestedPage = parseInt(param("page") ?? "1", 10);
  const currentMonth = toMonthStr(); // YYYY-MM, local time like the budgets page

  const [transactionsData, categories, accounts, userSettings, budgetData] = await Promise.all([
    getTransactions(requestedPage, PAGE_SIZE, filters),
    getCategories(),
    getUserAccounts(),
    import("@/app/actions/settings").then(m => m.getUserSettings()),
    getEnfixBudgetsData(currentMonth)
  ]);

  const currency = userSettings?.currency || "USD";
  const { totals, totalCount, page } = transactionsData;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* Header in a white card */}
      <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Transactions</h2>
            <p className="text-sm text-gray-400">Track and manage your income and expenses.</p>
          </div>
        </div>

        <NewTransactionDialog
          categories={categories}
          accounts={accounts}
          budgets={budgetData.budgets}
          currency={currency}
        />
      </div>

      {/* Full Width List */}
      <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 space-y-6">
        <TransactionFilters categories={categories} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-xl font-bold text-[#1e293b]">
            {isFiltered ? "Matching transactions" : "All transactions"}
          </h3>
          {totalCount > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="text-gray-400">
                Income <span className="font-bold text-emerald-600 tabular-nums">+{formatCurrency(totals.income, currency)}</span>
              </span>
              <span className="text-gray-400">
                Expenses <span className="font-bold text-rose-600 tabular-nums">-{formatCurrency(totals.expense, currency)}</span>
              </span>
              <span className="text-gray-400">
                Net <span className="font-bold text-[#1e293b] tabular-nums">{formatCurrency(totals.income - totals.expense, currency)}</span>
              </span>
            </div>
          )}
        </div>

        <div>
          <TransactionList
            transactions={transactionsData.transactions}
            currency={currency}
            isFiltered={isFiltered}
            formOptions={{ categories, accounts, budgets: budgetData.budgets }}
          />
          <TransactionsPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            params={{
              q: filters.search,
              type: filters.type,
              category: filters.categoryId,
              from: filters.from,
              to: filters.to,
            }}
          />
        </div>
      </div>

    </div>
  );
}
