"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getUserAccounts() {
  try {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return [];

    return await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}
