import { describe, expect, it } from "vitest";
import { walletInputSchema, walletTotals, walletInputAmount, walletLast4, type Wallet } from "@/shared/wallets";

const wallet = (type: string, balance: number): Wallet => ({ id: type, name: type, type, balance, prefix: null, updatedAt: "2026-10-27T00:00:00.000Z" });

describe("wallet tracking", () => {
  it("separates spendable recorded balances from card debt", () => {
    expect(walletTotals([wallet("BKASH", 1000), wallet("NAGAD", 2000), wallet("ROCKET", 500), wallet("VISA_DEBIT", 3000), wallet("VISA_CREDIT", -1500), wallet("VISA_CREDIT", 100)])).toEqual({ available: 6500, owed: 1500 });
    expect(walletInputAmount(wallet("VISA_CREDIT", -1500))).toBe(1500);
    expect(walletInputAmount(wallet("VISA_CREDIT", 100))).toBe(-100);
  });
  it.each(["BKASH", "NAGAD", "ROCKET", "VISA_DEBIT", "VISA_CREDIT", "OTHER"])("accepts %s without collecting credentials", type => {
    expect(walletInputSchema.parse({ name: " My account ", type, last4: "1234", amount: 100 })).toMatchObject({ name: "My account", type });
  });
  it.each([
    { last4: "1234567890123456" }, { last4: "123" }, { last4: "abcd" }, { name: " " },
    { amount: NaN }, { amount: Infinity }, { amount: 1e13 }, { type: "UNKNOWN" }, { userId: "another-user" }, { pin: "1234" },
  ])("rejects invalid or unrelated fields: %j", change => {
    expect(walletInputSchema.safeParse({ name: "Wallet", type: "BKASH", amount: 100, last4: "", ...change }).success).toBe(false);
  });
  it("uses only an explicit four-digit ending for display", () => {
    expect(walletLast4("•••• 1234")).toBe("1234");
    expect(walletLast4("123456781234")).toBe("");
    expect(walletLast4(null)).toBe("");
  });
});
