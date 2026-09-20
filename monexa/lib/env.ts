/**
 * Checks the server's environment variables when it starts (see
 * instrumentation.ts), so a bad deployment fails immediately with a clear
 * message instead of breaking at the first login or password reset.
 */

const isProduction = () => process.env.NODE_ENV === "production";

/** Values people copy from .env.example and forget to change. */
const PLACEHOLDER_SECRETS = ["changeme", "change-me", "secret", "your-secret-here", "generate-a-random-secret"];

export type EnvReport = {
  /** Problems that make the app unsafe or broken - startup is refused in production. */
  errors: string[];
  /** Things that will not work fully but do not stop the app. */
  warnings: string[];
};

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prod = env.NODE_ENV === "production";

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set.");
  } else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
    errors.push("DATABASE_URL must be a postgres:// or postgresql:// connection string.");
  }

  const secret = env.AUTH_SECRET;
  if (!secret) {
    errors.push("AUTH_SECRET is not set. Generate one with: openssl rand -base64 32");
  } else if (prod && (secret.length < 32 || PLACEHOLDER_SECRETS.includes(secret.toLowerCase()))) {
    errors.push("AUTH_SECRET is too short or a placeholder. Use a random value of at least 32 characters.");
  }

  if (prod) {
    // Auth.js refuses requests from an unknown host unless told to trust it
    // (Vercel is trusted automatically).
    if (!env.VERCEL && env.AUTH_TRUST_HOST !== "true" && !env.AUTH_URL) {
      errors.push("Set AUTH_TRUST_HOST=true (or AUTH_URL) - without it Auth.js rejects every login in production.");
    }

    // Password-reset links must point at YOUR site. Building them from the
    // request's Host header would let an attacker forge a link to their own site.
    if (!env.APP_URL && !env.AUTH_URL) {
      errors.push("Set APP_URL (e.g. https://money.example.com) - it is the base of password-reset links.");
    } else {
      const url = env.APP_URL ?? env.AUTH_URL ?? "";
      if (!/^https:\/\//.test(url)) warnings.push("APP_URL should start with https:// in production.");
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      warnings.push("RESEND_API_KEY / EMAIL_FROM are not set - password-reset emails cannot be sent.");
    }
  }

  return { errors, warnings };
}

/** Called once at server start. Throws in production if the setup is unsafe. */
export function assertEnv() {
  const { errors, warnings } = checkEnv();

  for (const warning of warnings) console.warn(`[env] Warning: ${warning}`);

  if (errors.length === 0) return;
  const message = `Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
  if (isProduction()) throw new Error(message);
  console.warn(`[env] ${message}`);
}

/**
 * Public base URL of the app, used for links in emails.
 * In production it comes from APP_URL - never from request headers.
 * In development it falls back to localhost.
 */
export function getAppUrl(devFallback = "http://localhost:3000"): string {
  const configured = process.env.APP_URL ?? process.env.AUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (isProduction()) throw new Error("APP_URL is not set");
  return devFallback;
}
