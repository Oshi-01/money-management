"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const currency = formData.get("currency") as string;

    if (!currency || !["USD", "GBP", "BDT"].includes(currency)) {
      throw new Error("Invalid currency selected");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        currency,
      },
    });

    revalidatePath("/", "layout");

    return { success: true, message: "Settings updated successfully" };
  } catch (error: unknown) {
    console.error("Error updating settings:", error);
    const msg = error instanceof Error ? error.message : "Failed to update settings";
    return { success: false, error: msg };
  }
}

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, currency: true },
  });

  return user;
}
