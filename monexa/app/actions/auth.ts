"use server";

import { signIn, signOut } from "@/auth";
import prisma from "@/lib/prisma";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { emailSchema, nameSchema, newPasswordSchema, normalizeEmail } from "@/lib/auth-validation";
import { findUserByEmail, hashPassword } from "@/lib/user-auth";
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
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
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

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return { error: "Email already in use" };
    }

    const hashedPassword = await hashPassword(password);

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
    // Two sign-ups with the same email at once: the unique index catches the second.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Email already in use" };
    }
    console.error("Error registering user:", error);
    return { error: "Something went wrong" };
  }
}

export async function authenticate(prevState: unknown, formData: FormData) {
  // The real enforcement is inside auth.ts (authorize). This read-only check
  // just lets us say WHY the login is refused, instead of "invalid password".
  const email = normalizeEmail(String(formData.get("email") ?? ""));
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
