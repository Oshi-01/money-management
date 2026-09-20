import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Small fixed-window rate limiter backed by the database (RateLimit table), so
 * the limit holds no matter how many server instances are running and needs
 * no extra infrastructure.
 *
 * Each key (e.g. "login:email:me@example.com") gets `limit` attempts per
 * window. If the database is unreachable the limiter fails OPEN (allows the
 * request) - the app can't do anything useful without the database anyway,
 * and a limiter outage should not lock every user out.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

// Limits, in one place so login, the login form's friendly message and any
// future change stay in step.
export const LOGIN_WINDOW = 15 * MINUTE;
export const LOGIN_EMAIL_LIMIT = 10; // attempts per account per window
export const LOGIN_IP_LIMIT = 30; // attempts per IP per window

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets (0 when allowed). */
  retryAfterSec: number;
};

const ALLOWED: RateLimitResult = { allowed: true, retryAfterSec: 0 };

/** Count one attempt against `key`. Returns whether it is still within the limit. */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  try {
    const now = new Date();

    // A window is already open: add one attempt (atomic increment in the database).
    const bumped = await prisma.rateLimit.updateMany({
      where: { key, resetAt: { gt: now } },
      data: { count: { increment: 1 } },
    });

    if (bumped.count === 0) {
      // No open window (first attempt, or the old one expired): start a new one.
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      });
      void purgeExpired(now);
      return ALLOWED;
    }

    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.count <= limit) return ALLOWED;
    return { allowed: false, retryAfterSec: secondsUntil(row.resetAt, now) };
  } catch (error) {
    console.error("Rate limiter unavailable, allowing request:", error);
    return ALLOWED;
  }
}

/** Look at `key` without counting an attempt. Blocked once `limit` attempts are used up. */
export async function peekRateLimit(key: string, limit: number): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt <= now || row.count < limit) return ALLOWED;
    return { allowed: false, retryAfterSec: secondsUntil(row.resetAt, now) };
  } catch (error) {
    console.error("Rate limiter unavailable, allowing request:", error);
    return ALLOWED;
  }
}

/** Forget a key, e.g. after a successful login. */
export async function clearRateLimit(key: string) {
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("Failed to clear rate limit:", error);
  }
}

/**
 * Best-effort client IP from the proxy headers.
 * Only trustworthy when the app sits behind a proxy that sets these headers
 * (Vercel, Cloudflare, nginx...). If it is exposed directly, a client can fake
 * the header - which is why login is ALSO limited per account (email).
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || h.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

/** "5 minutes", "1 minute", "30 seconds" - for error messages. */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function secondsUntil(date: Date, now: Date) {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));
}

/** Occasionally delete long-expired rows so the table doesn't grow forever. */
async function purgeExpired(now: Date) {
  if (Math.random() > 0.02) return;
  try {
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 24 * HOUR) } } });
  } catch {
    /* clean-up is best effort */
  }
}
