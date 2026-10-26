import prisma from "@/lib/prisma";
import { z } from "zod";
import { LoanType } from "@prisma/client";
import { parseDateOnly } from "@/lib/dates";

const loanSchema = z.object({
  personName: z.string().min(1, "Person's name is required"),
  loanType: z.enum(["BORROWED", "LENT"]),
  principalAmount: z.coerce.number().positive("Amount must be positive"),
  startDate: z.iso.date(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(),
  notes: z.string().optional(),
  includeInTotal: z.boolean().default(true).optional(),
});

export async function getLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      repayments: { orderBy: { paymentDate: "desc" } },
      activities: { orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }] },
    },
  });

  return loans;
}

export async function createLoan(userId: string, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());

    // Explicitly handle boolean for includeInTotal from FormData
    const includeInTotal = data.includeInTotal === "true" || data.includeInTotal === "on";
    const dataToValidate = { ...data, includeInTotal };

    const validated = loanSchema.safeParse(dataToValidate);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { personName, loanType, principalAmount, startDate, dueDate, notes, includeInTotal: include } = validated.data;

    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          userId,
          personName,
          loanType: loanType as LoanType,
          principalAmount,
          balance: principalAmount,
          startDate: parseDateOnly(startDate),
          dueDate: dueDate ? parseDateOnly(dueDate) : null,
          notes,
          includeInTotal: include,
        },
      });

      await tx.loanActivity.create({
        data: {
          loanId: loan.id,
          type: "CREATED",
          amountDelta: principalAmount,
          balanceAfter: principalAmount,
          activityDate: parseDateOnly(startDate),
          notes: notes || null,
        },
      });
    });

    return { success: "Loan created successfully" };
  } catch (error) {
    console.error("Failed to create loan", error);
    return { error: "Failed to create loan" };
  }
}

export async function updateLoan(userId: string, id: string, formData: FormData) {
  try {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id } });
      if (!loan || loan.userId !== userId) {
        return { error: "Loan not found" };
      }

      const data = Object.fromEntries(formData.entries());
      const includeInTotal = data.includeInTotal === "true" || data.includeInTotal === "on";
      const dataToValidate = { ...data, includeInTotal };

      const validated = loanSchema.safeParse(dataToValidate);

      if (!validated.success) {
        return { error: "Invalid data" };
      }

      const { personName, loanType, principalAmount, startDate, dueDate, notes, includeInTotal: include } = validated.data;

      // Calculate new balance based on the difference in principal amount
      const principalDelta = principalAmount - loan.principalAmount;
      const newBalance = loan.balance + principalDelta;
      if (newBalance < 0) {
        return { error: "Principal cannot be lower than the amount already repaid" };
      }

      await tx.loan.update({
        where: { id },
        data: {
          personName,
          loanType: loanType as LoanType,
          principalAmount,
          balance: newBalance,
          status: newBalance === 0
            ? "PAID"
            : loan.status === "PAID" || principalDelta !== 0
              ? "ACTIVE"
              : loan.status,
          startDate: parseDateOnly(startDate),
          dueDate: dueDate ? parseDateOnly(dueDate) : null,
          notes,
          includeInTotal: include,
        },
      });

      if (principalDelta !== 0) {
        await tx.loanActivity.create({
          data: {
            loanId: id,
            type: "ADJUSTMENT",
            amountDelta: principalDelta,
            balanceAfter: newBalance,
            activityDate: new Date(),
            notes: principalDelta > 0 ? "Principal increased while editing" : "Principal reduced while editing",
          },
        });
      }

      return { success: "Loan updated successfully" };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    console.error("Failed to update loan", error);
    return { error: "Failed to update loan" };
  }
}

export async function deleteLoan(userId: string, id: string) {
  try {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan || loan.userId !== userId) {
      return { error: "Loan not found" };
    }

    await prisma.loan.delete({ where: { id } });

    return { success: "Loan deleted" };
  } catch (error) {
    console.error("Failed to delete loan", error);
    return { error: "Failed to delete loan" };
  }
}

const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentDate: z.iso.date(),
  notes: z.string().optional(),
});

const additionalAmountSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  activityDate: z.iso.date(),
  notes: z.string().optional(),
});

export async function addLoanAmount(userId: string, formData: FormData) {
  try {
    const validated = additionalAmountSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: "Invalid data" };

    const { loanId, amount, activityDate, notes } = validated.data;

    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId },
      });
      if (!loan) throw new Error("LOAN_NOT_FOUND");

      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          principalAmount: { increment: amount },
          balance: { increment: amount },
          status: "ACTIVE",
        },
      });

      await tx.loanActivity.create({
        data: {
          loanId,
          type: "ADDITION",
          amountDelta: amount,
          balanceAfter: updated.balance,
          activityDate: parseDateOnly(activityDate),
          notes: notes || null,
        },
      });
    });

    return { success: "Additional amount recorded" };
  } catch (error) {
    if (error instanceof Error && error.message === "LOAN_NOT_FOUND") return { error: "Loan not found" };
    console.error("Failed to add loan amount", error);
    return { error: "Failed to add amount" };
  }
}

export async function addRepayment(userId: string, formData: FormData) {
  try {
    return await prisma.$transaction(async (tx) => {
      const data = Object.fromEntries(formData.entries());
      const validated = repaymentSchema.safeParse(data);

      if (!validated.success) {
        return { error: "Invalid data" };
      }

      const { loanId, amount, paymentDate, notes } = validated.data;

      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan || loan.userId !== userId) {
        return { error: "Loan not found" };
      }

      if (amount > loan.balance) {
        return { error: "Repayment amount exceeds outstanding balance" };
      }

      // Wrap in transaction to ensure consistency
      await tx.repayment.create({
        data: {
          loanId,
          amount,
          paymentDate: parseDateOnly(paymentDate),
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

      return { success: "Repayment recorded successfully" };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    console.error("Failed to add repayment", error);
    return { error: "Failed to add repayment" };
  }
}
