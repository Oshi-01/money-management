import { z } from "zod";

// Shared by the auth forms (client) and the server actions, so both enforce the
// same rules. Must stay free of server-only imports.

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt ignores everything after 72 bytes, so longer passwords would be silently truncated. */
export const PASSWORD_MAX_BYTES = 72;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Invalid email address")
  .transform(normalizeEmail);

/** Rules for choosing a new password (register / reset). Login accepts any non-empty password. */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, "Password is too long")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Password must include a letter and a number");

export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, "Invalid email or password");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long");
