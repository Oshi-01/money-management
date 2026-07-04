"use server";

import { signIn, signOut } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(prevState: unknown, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = registerSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        categories: {
          create: [
            { name: "Salary", type: "INCOME" },
            { name: "Investments", type: "INCOME" },
            { name: "Housing", type: "EXPENSE" },
            { name: "Groceries", type: "EXPENSE" },
            { name: "Utilities", type: "EXPENSE" },
            { name: "Transportation", type: "EXPENSE" },
            { name: "Dining Out", type: "EXPENSE" },
            { name: "Entertainment", type: "EXPENSE" },
            { name: "Shopping", type: "EXPENSE" },
          ]
        }
      },
    });

    return { success: "Registration successful. You can now log in." };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "Something went wrong" };
  }
}

export async function authenticate(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}

export async function logOut() {
  await signOut();
}
