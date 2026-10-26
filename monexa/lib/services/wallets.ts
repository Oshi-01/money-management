import prisma from "@/lib/prisma";
import { walletInputSchema, walletUpdateSchema, isCreditWallet, type Wallet } from "@/shared/wallets";

const select = { id: true, name: true, type: true, prefix: true, balance: true, updatedAt: true } as const;
const serialize = (account: Omit<Wallet, "updatedAt"> & { updatedAt: Date }): Wallet => ({ ...account, updatedAt: account.updatedAt.toISOString() });

export class WalletError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function getWallets(userId: string): Promise<Wallet[]> {
  return (await prisma.account.findMany({ where: { userId }, select, orderBy: { createdAt: "asc" } })).map(serialize);
}

export async function getWallet(userId: string, id: string): Promise<Wallet> {
  const account = await prisma.account.findFirst({ where: { id, userId }, select });
  if (!account) throw new WalletError("Wallet or card not found.", 404);
  return serialize(account);
}

function accountData(input: ReturnType<typeof walletInputSchema.parse>) {
  return { name: input.name, type: input.type, prefix: input.last4 ? `•••• ${input.last4}` : null, balance: isCreditWallet(input.type) ? -input.amount : input.amount };
}

export async function createWallet(userId: string, value: unknown): Promise<Wallet> {
  const input = walletInputSchema.parse(value);
  return serialize(await prisma.account.create({ data: { userId, ...accountData(input) }, select }));
}

export async function updateWallet(userId: string, id: string, value: unknown): Promise<Wallet> {
  const input = walletUpdateSchema.parse(value);
  const changed = await prisma.account.updateMany({
    where: { id, userId, updatedAt: new Date(input.updatedAt), balance: input.previousBalance },
    data: accountData(input),
  });
  if (!changed.count) {
    await getWallet(userId, id);
    throw new WalletError("This balance changed while you were editing. Reload the latest details before saving again.", 409);
  }
  return getWallet(userId, id);
}
