// Runs once when the server starts (before it accepts requests).
export async function register() {
  // Only the Node.js server needs the database/auth setup, and `next build`
  // must not require production secrets.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { assertEnv } = await import("./lib/env");
  assertEnv();
}
