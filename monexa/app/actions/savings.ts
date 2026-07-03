"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.number().positive("Amount must be positive"),
  deadline: z.string().optional(),
});

const addFundsSchema = z.object({
  id: z.string(),
  amount: z.number().positive("Amount must be positive"),
});

export async function getSavingsGoals() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { deadline: "asc" },
    });

    return { goals };
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return { goals: [] };
  }
}

export async function createSavingsGoal(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return { error: "User not found" };

    const rawData = {
      title: formData.get("title") as string,
      targetAmount: parseFloat(formData.get("targetAmount") as string),
      deadline: formData.get("deadline") as string || undefined,
    };

    const validatedData = createGoalSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid data provided" };
    }

    await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        title: validatedData.data.title,
        targetAmount: validatedData.data.targetAmount,
        deadline: validatedData.data.deadline ? new Date(validatedData.data.deadline) : null,
      },
    });

    revalidatePath("/dashboard/savings");
    return { success: "Savings goal created successfully" };
  } catch (error) {
    console.error("Error creating savings goal:", error);
    return { error: "Failed to create savings goal" };
  }
}

export async function addFundsToGoal(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const rawData = {
      id: formData.get("id") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    const validatedData = addFundsSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid data provided" };
    }

    // Check if goal exists and belongs to user
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const goal = await prisma.savingsGoal.findUnique({
      where: { id: validatedData.data.id },
    });

    if (!goal || goal.userId !== user.id) {
      return { error: "Goal not found" };
    }

    await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: {
        savedAmount: goal.savedAmount + validatedData.data.amount,
      },
    });

    revalidatePath("/dashboard/savings");
    return { success: "Funds added successfully" };
  } catch (error) {
    console.error("Error adding funds:", error);
    return { error: "Failed to add funds" };
  }
}

export async function deleteSavingsGoal(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "User not found" };

    const goal = await prisma.savingsGoal.findUnique({
      where: { id },
    });

    if (!goal || goal.userId !== user.id) {
      return { error: "Goal not found or unauthorized" };
    }

    await prisma.savingsGoal.delete({
      where: { id },
    });

    revalidatePath("/dashboard/savings");
    return { success: "Goal deleted successfully" };
  } catch (error) {
    console.error("Error deleting goal:", error);
    return { error: "Failed to delete goal" };
  }
}
