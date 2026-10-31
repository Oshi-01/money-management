import { getTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsPagination } from "@/components/transactions/transactions-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { getUserCalendar } from "@/lib/user-calendar";
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
  const { currentMonth } = await getUserCalendar();

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
    <div className="space-y-6 pb-8">

      <PageHeader title="Transactions" description="The everyday details of your money.">
        <NewTransactionDialog
          categories={categories}
          accounts={accounts}
          budgets={budgetData.budgets}
          currency={currency}
        />
      </PageHeader>

      {/* Full Width List */}
      <div className="app-panel p-4 sm:p-6 space-y-6">
        <TransactionFilters categories={categories} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {isFiltered ? "Matching transactions" : "All transactions"}
          </h3>
          {totalCount > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Income <span className="font-bold text-income tabular-nums">+{formatCurrency(totals.income, currency)}</span>
              </span>
              <span className="text-muted-foreground">
                Expenses <span className="font-bold text-expense tabular-nums">-{formatCurrency(totals.expense, currency)}</span>
              </span>
              <span className="text-muted-foreground">
                Net <span className="font-bold text-foreground tabular-nums">{formatCurrency(totals.income - totals.expense, currency)}</span>
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
