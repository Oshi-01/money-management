"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as categories from "@/lib/services/categories";

function categoryError(error: unknown) {
  if (error instanceof categories.CategoryError) return { error: error.message };
  if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Check the category details." };
  return { error: "Could not save the category. Please try again." };
}

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return categories.getCategories(session.user.id);
}

export async function getCategoryUsage(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { transactions: 0, budgets: 0 };
  return categories.getCategoryUsage(session.user.id, id);
}

export async function createCategory(formData: FormData): Promise<{ error?: string; success?: string; category?: { id: string; name: string; type: "INCOME" | "EXPENSE" } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    const category = await categories.createCategory(session.user.id, Object.fromEntries(formData.entries()));
    revalidatePath("/dashboard", "layout");
    return { success: "Category created successfully", category: { id: category.id, name: category.name, type: category.type } };
  } catch (error) { return categoryError(error); }
}

export async function updateCategory(id: string, formData: FormData): Promise<{ error?: string; success?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    await categories.updateCategory(session.user.id, id, Object.fromEntries(formData.entries()));
    revalidatePath("/dashboard", "layout");
    return { success: "Category updated" };
  } catch (error) { return categoryError(error); }
}

export async function deleteCategory(id: string, moveToId?: string): Promise<{ error?: string; success?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    const result = await categories.deleteCategory(session.user.id, id, moveToId);
    revalidatePath("/dashboard", "layout");
    return result;
  } catch (error) { return categoryError(error); }
}
