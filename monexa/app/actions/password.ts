"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { clearRateLimit, consumeRateLimit, formatRetryAfter, getClientIp, HOUR } from "@/lib/rate-limit";
import { passwordChangedEmail, passwordResetEmail, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/env";
import { emailSchema, newPasswordSchema } from "@/lib/auth-validation";
import { findUserByEmail, hashPassword } from "@/lib/user-auth";

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
async function emailBaseUrl() {
  if (process.env.NODE_ENV === "production") return getAppUrl();
  const host = (await headers()).get("host") || "localhost:3000";
  return getAppUrl(`http://${host}`);
}

const requestResetSchema = z.object({
  email: emailSchema,
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
      consumeRateLimit(`forgot:email:${email}`, 3, HOUR),
    ]);
    if (!byIp.allowed || !byEmail.allowed) {
      const wait = Math.max(byIp.retryAfterSec, byEmail.retryAfterSec);
      return { error: `Too many reset requests. Please try again in ${formatRetryAfter(wait)}.` };
    }

    const user = await findUserByEmail(email);

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
    const baseUrl = emailBaseUrl();
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
  token: z.string().regex(/^[a-f0-9]{64}$/, "Invalid or expired password reset token."),
  password: newPasswordSchema,
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

    const hashedPassword = await hashPassword(password);

    // Claim the token and change the password in one statement, so a link can
    // only ever be used once even if submitted twice at the same moment.
    // Bumping sessionVersion logs out every existing session (see auth.ts).
    const tokenHash = hashToken(token);
    const user = await prisma.user.findUnique({ where: { resetToken: tokenHash }, select: { id: true, email: true, name: true } });
    const claimed = user
      ? await prisma.user.updateMany({
          where: { id: user.id, resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            sessionVersion: { increment: 1 },
          },
        })
      : { count: 0 };

    if (!user || claimed.count === 0) {
      return { error: "Invalid or expired password reset token." };
    }

    await clearRateLimit(`login:email:${user.email.toLowerCase()}`);

    // Tell the owner, so an unexpected reset (e.g. a hijacked inbox) doesn't go unnoticed.
    const baseUrl = emailBaseUrl();
    after(async () => {
      try {
        const sent = await sendEmail({
          to: user.email,
          ...passwordChangedEmail({ name: user.name, loginUrl: `${await baseUrl}/login` }),
        });
        if (!sent) console.error("Password changed email could not be delivered.");
      } catch (error) {
        console.error("Password changed email failed:", error instanceof Error ? error.message : error);
      }
    });

    return { success: "Your password has been successfully reset. You can now log in." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
