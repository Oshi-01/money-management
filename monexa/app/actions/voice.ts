"use server";

import { auth } from "@/auth";
import { consumeRateLimit, MINUTE } from "@/lib/rate-limit";
import { interpretVoice } from "@/lib/voice-ai";

export async function understandVoice(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." };
  const limit = await consumeRateLimit(`voice:${session.user.id}`, 15, MINUTE);
  if (!limit.allowed) return { error: "Too many AI requests. Try again in a minute." };
  try { return await interpretVoice(input, true); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not understand this command." }; }
}
