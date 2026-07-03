"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { LoanType } from "@prisma/client";

const loanSchema = z.object({
  personName: z.string().min(1, "Person's name is required"),
  loanType: z.enum(["BORROWED", "LENT"]),
  principalAmount: z.coerce.number().positive("Amount must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function getLoans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { repayments: true },
  });

  return loans;
}

export async function createLoan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const data = Object.fromEntries(formData.entries());
    const validated = loanSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { personName, loanType, principalAmount, startDate, dueDate, notes } = validated.data;

    await prisma.loan.create({
      data: {
        userId: session.user.id,
        personName,
        loanType: loanType as LoanType,
        principalAmount,
        balance: principalAmount, // Initial balance is the principal amount
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
    });

    revalidatePath("/dashboard/loans");
    return { success: "Loan created successfully" };
  } catch (error) {
    console.error("Failed to create loan", error);
    return { error: "Failed to create loan" };
  }
}

export async function deleteLoan(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan || loan.userId !== session.user.id) {
      return { error: "Loan not found" };
    }

    await prisma.loan.delete({ where: { id } });
    
    revalidatePath("/dashboard/loans");
    return { success: "Loan deleted" };
  } catch (error) {
    console.error("Failed to delete loan", error);
    return { error: "Failed to delete loan" };
  }
}

const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

export async function addRepayment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const data = Object.fromEntries(formData.entries());
    const validated = repaymentSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { loanId, amount, paymentDate, notes } = validated.data;

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.userId !== session.user.id) {
      return { error: "Loan not found" };
    }

    if (amount > loan.balance) {
      return { error: "Repayment amount exceeds outstanding balance" };
    }

    // Wrap in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      await tx.repayment.create({
        data: {
          loanId,
          amount,
          paymentDate: new Date(paymentDate),
          notes,
        },
      });

      const newBalance = loan.balance - amount;
      
      await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: newBalance,
          status: newBalance <= 0 ? "PAID" : "ACTIVE",
        },
      });
    });

    revalidatePath("/dashboard/loans");
    return { success: "Repayment recorded successfully" };
  } catch (error) {
    console.error("Failed to add repayment", error);
    return { error: "Failed to add repayment" };
  }
}
