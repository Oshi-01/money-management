"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  let categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }, // System defaults
      ],
    },
    orderBy: { name: "asc" },
  });

  // Auto-seed categories to ensure defaults always exist
  const defaultCategories = [
    { name: "Salary", type: "INCOME" as const },
    { name: "Investments", type: "INCOME" as const },
    { name: "Housing", type: "EXPENSE" as const },
    { name: "Groceries", type: "EXPENSE" as const },
    { name: "Utilities", type: "EXPENSE" as const },
    { name: "Transportation", type: "EXPENSE" as const },
    { name: "Dining Out", type: "EXPENSE" as const },
    { name: "Entertainment", type: "EXPENSE" as const },
    { name: "Shopping", type: "EXPENSE" as const },
    { name: "Travel", type: "EXPENSE" as const },
    { name: "Health", type: "EXPENSE" as const },
    { name: "Education", type: "EXPENSE" as const },
  ];
  
  let added = false;
  for (const cat of defaultCategories) {
    if (!categories.find(c => c.name === cat.name)) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          userId,
        }
      });
      added = true;
    }
  }

  if (added) {
    categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { name: "asc" },
    });
  }

  return categories;
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const data = Object.fromEntries(formData.entries());
    const validated = categorySchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    await prisma.category.create({
      data: {
        ...validated.data,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/categories");
    return { success: "Category created successfully" };
  } catch (error) {
    console.error("Failed to create category", error);
    return { error: "Failed to create category" };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: "Category not found" };
    if (category.userId !== session.user.id) return { error: "Cannot delete system category" };

    await prisma.category.delete({ where: { id } });
    
    revalidatePath("/dashboard/categories");
    return { success: "Category deleted" };
  } catch (error) {
    console.error("Failed to delete category", error);
    return { error: "Failed to delete category" };
  }
}
