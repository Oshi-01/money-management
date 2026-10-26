import { z } from "zod";

export const walletProviders = [
  { value: "BKASH", label: "bKash", kind: "Mobile wallet" },
  { value: "NAGAD", label: "Nagad", kind: "Mobile wallet" },
  { value: "ROCKET", label: "Rocket", kind: "Mobile wallet" },
  { value: "VISA_DEBIT", label: "Visa debit", kind: "Debit card" },
  { value: "VISA_CREDIT", label: "Visa credit", kind: "Credit card" },
  { value: "OTHER", label: "Other account", kind: "Account" },
] as const;

export const walletInputSchema = z.object({
  name: z.string().trim().min(1, "Give this wallet or card a name.").max(80),
  type: z.enum(["BKASH", "NAGAD", "ROCKET", "VISA_DEBIT", "VISA_CREDIT", "OTHER"]),
  last4: z.string().regex(/^(?:\d{4})?$/, "Enter only the last four digits, or leave this empty."),
  amount: z.number().finite().min(-1e12).max(1e12),
}).strict();
export const walletUpdateSchema = walletInputSchema.extend({ updatedAt: z.iso.datetime(), previousBalance: z.number().finite() });
export type WalletInput = z.infer<typeof walletInputSchema>;
export type Wallet = { id: string; name: string; type: string; prefix: string | null; balance: number; updatedAt: string };
export const isCreditWallet = (type: string) => type === "VISA_CREDIT";
export const walletProvider = (type: string) => walletProviders.find(provider => provider.value === type) ?? walletProviders[5];
export const walletLast4 = (prefix: string | null) => /(?:^|\D)(\d{4})$/.exec(prefix ?? "")?.[1] ?? "";
export const walletInputAmount = (wallet: Wallet) => isCreditWallet(wallet.type) ? -wallet.balance : wallet.balance;

export function walletTotals(wallets: Wallet[]) {
  return {
    available: wallets.filter(wallet => !isCreditWallet(wallet.type)).reduce((total, wallet) => total + wallet.balance, 0),
    owed: wallets.filter(wallet => isCreditWallet(wallet.type)).reduce((total, wallet) => total + Math.max(-wallet.balance, 0), 0),
  };
}
