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

  return await prisma.category.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null }, // System defaults
      ],
    },
    orderBy: { name: "asc" },
  });
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
