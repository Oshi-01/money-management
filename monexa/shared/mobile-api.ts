export type MobileUser = { id: string; name: string | null; email: string; currency: string };
export type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };
export type Account = { id: string; name: string; balance: number };
export type TransactionInput = {
  description: string; amount: number; type: "INCOME" | "EXPENSE";
  categoryId: string; accountId?: string; date: string; notes?: string;
};
export type Transaction = Omit<TransactionInput, "accountId" | "notes"> & {
  id: string; accountId: string | null; notes: string | null;
  category: Category;
};
export type LoanInput = {
  personName: string; principalAmount: number; loanType: "BORROWED" | "LENT";
  startDate: string; dueDate?: string; notes?: string; includeInTotal: boolean;
};
export type Repayment = { id: string; amount: number; paymentDate: string; notes: string | null };
export type Loan = Omit<LoanInput, "dueDate" | "notes"> & {
  id: string; balance: number; dueDate: string | null; notes: string | null;
  status: "ACTIVE" | "PAID" | "OVERDUE"; repayments: Repayment[];
};
export type Dashboard = { income: number; expense: number; borrowed: number; lent: number; balance: number };
export type Bootstrap = { user: MobileUser; categories: Category[]; accounts: Account[]; dashboard: Dashboard };
export type TransactionPage = { transactions: Transaction[]; totalCount: number; page: number; pageSize: number };
export type LoginResult = { token: string; expiresAt: string; user: MobileUser };
