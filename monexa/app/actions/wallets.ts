"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as wallets from "@/lib/services/wallets";

export async function saveWallet(value: unknown, id?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  if (id !== undefined && (typeof id !== "string" || !id || id.length > 100)) return { error: "Invalid wallet." };
  try {
    const wallet = id ? await wallets.updateWallet(session.user.id, id, value) : await wallets.createWallet(session.user.id, value);
    revalidatePath("/dashboard", "layout");
    return { wallet };
  } catch (error) {
    if (error instanceof wallets.WalletError) return { error: error.message, conflict: error.status === 409 };
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Check the account details." };
    return { error: "Could not save this wallet. Your changes are still here; please try again." };
  }
}
