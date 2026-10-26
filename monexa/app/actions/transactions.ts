"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as service from "@/lib/services/transactions";
import type { TransactionFilters } from "@/lib/services/transactions";
export type { TransactionFilters } from "@/lib/services/transactions";

export async function getTransactions(page = 1, pageSize = 10, filters?: TransactionFilters) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const result = await service.getTransactions(session.user.id, page, pageSize, filters);
  return result;
}

export async function createTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.createTransaction(session.user.id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function updateTransaction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.updateTransaction(session.user.id, id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.deleteTransaction(session.user.id, id);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}
