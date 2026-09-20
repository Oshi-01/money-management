"use server";

import { signIn, signOut } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import {
  consumeRateLimit,
  formatRetryAfter,
  getClientIp,
  HOUR,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  peekRateLimit,
} from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(prevState: unknown, formData: FormData) {
  // Stops scripts from mass-creating accounts.
  const limit = await consumeRateLimit(`register:ip:${await getClientIp()}`, 10, HOUR);
  if (!limit.allowed) {
    return { error: `Too many sign-up attempts. Please try again in ${formatRetryAfter(limit.retryAfterSec)}.` };
  }

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
  // The real enforcement is inside auth.ts (authorize). This read-only check
  // just lets us say WHY the login is refused, instead of "invalid password".
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    const [byEmail, byIp] = await Promise.all([
      peekRateLimit(`login:email:${email}`, LOGIN_EMAIL_LIMIT),
      peekRateLimit(`login:ip:${await getClientIp()}`, LOGIN_IP_LIMIT),
    ]);
    const blocked = !byEmail.allowed ? byEmail : !byIp.allowed ? byIp : null;
    if (blocked) {
      return { error: `Too many login attempts. Please try again in ${formatRetryAfter(blocked.retryAfterSec)}.` };
    }
  }

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
