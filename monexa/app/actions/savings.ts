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

export async function getEnfixSavingsData() {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    const rawGoals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { deadline: "asc" },
    });

    const enrichedGoals = rawGoals.map(goal => {
      const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
      
      let monthsLeft = 0;
      if (goal.deadline) {
        const diffTime = Math.abs(goal.deadline.getTime() - new Date().getTime());
        monthsLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      }

      const monthlyNeed = monthsLeft > 0 ? remaining / monthsLeft : remaining;

      // Deterministic Wallet Split
      const wallets = [
        { name: "City Bank", amount: goal.savedAmount * 0.5, color: "bg-amber-500" },
        { name: "Cash Wallet", amount: goal.savedAmount * 0.3, color: "bg-indigo-500" },
        { name: "Visa Card", amount: goal.savedAmount * 0.2, color: "bg-blue-500" },
      ];

      // Deterministic History Generation (if there is savings)
      const history = [];
      if (goal.savedAmount > 0) {
        const now = new Date();
        history.push({
          id: `${goal.id}-h1`,
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          wallet: "City Bank",
          description: "Transfer from checking",
          amount: goal.savedAmount * 0.4
        });
        history.push({
          id: `${goal.id}-h2`,
          date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          wallet: "Visa Card",
          description: "Auto-save",
          amount: goal.savedAmount * 0.35
        });
        history.push({
          id: `${goal.id}-h3`,
          date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          wallet: "Cash Wallet",
          description: "Manual Deposit",
          amount: goal.savedAmount * 0.25
        });
      }

      return {
        ...goal,
        remaining,
        monthsLeft,
        monthlyNeed,
        wallets,
        history
      };
    });

    return { goals: enrichedGoals };
  } catch (error) {
    console.error("Error fetching Enfix savings goals:", error);
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
