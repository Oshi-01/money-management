import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import type { MobileUser } from "@/shared/mobile-api";

export const mobileUserSelect = { id: true, name: true, email: true, currency: true } as const;
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function hashMobileToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function bearerToken(request: Request): string | null {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}

export async function issueMobileSession(userId: string, sessionVersion: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await prisma.mobileSession.create({ data: { userId, sessionVersion, tokenHash: hashMobileToken(token), expiresAt } });
  await prisma.mobileSession.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  return { token, expiresAt };
}

export async function authenticateMobile(request: Request): Promise<{ sessionId: string; user: MobileUser } | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const session = await prisma.mobileSession.findUnique({
    where: { tokenHash: hashMobileToken(token) },
    include: { user: { select: { ...mobileUserSelect, sessionVersion: true } } },
  });
  if (!session || session.expiresAt <= new Date() || session.sessionVersion !== session.user.sessionVersion) return null;
  const { sessionVersion: _version, ...user } = session.user;
  void _version;
  return { sessionId: session.id, user };
}
