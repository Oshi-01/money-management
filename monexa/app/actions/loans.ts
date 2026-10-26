"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as service from "@/lib/services/loans";

export async function getLoans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const result = await service.getLoans(session.user.id);
  return result;
}

export async function createLoan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.createLoan(session.user.id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function updateLoan(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.updateLoan(session.user.id, id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function deleteLoan(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.deleteLoan(session.user.id, id);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function addLoanAmount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.addLoanAmount(session.user.id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}

export async function addRepayment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const result = await service.addRepayment(session.user.id, formData);
  if (result.success) revalidatePath("/dashboard", "layout");
  return result;
}
