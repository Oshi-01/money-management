"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { consumeRateLimit, formatRetryAfter, getClientIp, HOUR } from "@/lib/rate-limit";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/env";

const RESET_TOKEN_TTL_MS = HOUR;

/**
 * Only a SHA-256 hash of the reset token is stored. The real token exists only
 * in the emailed link, so a leaked database can't be used to reset passwords.
 * (The token is 256 random bits, so a fast hash is fine here - unlike passwords.)
 */
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Base URL for links in emails. Production uses APP_URL; development can use the request's host. */
async function resetBaseUrl() {
  if (process.env.NODE_ENV === "production") return getAppUrl();
  const host = (await headers()).get("host") || "localhost:3000";
  return getAppUrl(`http://${host}`);
}

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ActionResult = { success?: string; error?: string };

export async function requestPasswordReset(prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = requestResetSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const { email } = validatedData.data;

    // Limit per IP and per email address. The limit is keyed on the address
    // text - not on whether an account exists - so it reveals nothing.
    const [byIp, byEmail] = await Promise.all([
      consumeRateLimit(`forgot:ip:${await getClientIp()}`, 10, HOUR),
      consumeRateLimit(`forgot:email:${email.toLowerCase()}`, 3, HOUR),
    ]);
    if (!byIp.allowed || !byEmail.allowed) {
      const wait = Math.max(byIp.retryAfterSec, byEmail.retryAfterSec);
      return { error: `Too many reset requests. Please try again in ${formatRetryAfter(wait)}.` };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Same answer whether or not the account exists, so this form can't be
    // used to find out who has an account.
    const genericSuccess = { success: "If an account with that email exists, we sent a password reset link." };

    if (!user) return genericSuccess;

    // Store only the hash; the raw token goes into the email.
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(token),
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // Send after the response has gone out, so the request takes the same time
    // whether or not an email is sent (another way to avoid revealing accounts).
    const baseUrl = resetBaseUrl();
    after(async () => {
      try {
        const link = `${await baseUrl}/reset-password?token=${token}`;
        const sent = await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name, link }) });
        if (!sent) console.error("Password reset email could not be delivered.");
      } catch (error) {
        console.error("Password reset email failed:", error instanceof Error ? error.message : error);
      }
    });

    return genericSuccess;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is missing"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = resetPasswordSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const { token, password } = validatedData.data;

    // Stops guessing of reset tokens.
    const limit = await consumeRateLimit(`reset:ip:${await getClientIp()}`, 10, HOUR);
    if (!limit.allowed) {
      return { error: `Too many attempts. Please try again in ${formatRetryAfter(limit.retryAfterSec)}.` };
    }

    // Look the token up by its hash and check it has not expired.
    const user = await prisma.user.findUnique({
      where: { resetToken: hashToken(token) },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { error: "Invalid or expired password reset token." };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token (single use)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: "Your password has been successfully reset. You can now log in." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
