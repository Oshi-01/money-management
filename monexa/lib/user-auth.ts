import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth-validation";

export const BCRYPT_ROUNDS = 12;

/**
 * Hash of a random value nobody knows. Comparing against it when the account
 * doesn't exist makes a failed login take as long as a wrong password, so
 * response time doesn't reveal which emails have accounts.
 */
const DUMMY_HASH = "$2b$12$6hShcPmh2Ybcxz1zafxaEOO5c57hx/KdS8ZGPW/6LsH.znvrKYIz6";

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export async function verifyPassword(password: string, hash: string | null | undefined) {
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return Boolean(hash) && matches;
}

/**
 * Case-insensitive, because accounts created before emails were normalized may
 * have been stored with capitals.
 */
export function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: normalizeEmail(email), mode: "insensitive" } },
  });
}
