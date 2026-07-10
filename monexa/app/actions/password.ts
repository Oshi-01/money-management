"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { headers } from "next/headers";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = requestResetSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const { email } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { success: "If an account with that email exists, we sent a password reset link." };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: tokenExpiry,
      },
    });

    // In a real app, send this link via email (e.g., using Resend, SendGrid)
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;
    
    console.log("\n\n=======================================");
    console.log("PASSWORD RESET REQUESTED");
    console.log(`Email: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log("=======================================\n\n");

    return { success: "If an account with that email exists, we sent a password reset link." };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is missing"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(prevState: unknown, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = resetPasswordSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }

    const { token, password } = validatedData.data;

    // Find user with this token and check if it's expired
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { error: "Invalid or expired password reset token." };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
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
