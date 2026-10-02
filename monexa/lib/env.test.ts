import { describe, expect, it } from "vitest";
import { checkEnv } from "./env";

const base = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@db.example.com/app",
  AUTH_SECRET: "x".repeat(40),
  RESEND_API_KEY: "re_test",
  EMAIL_FROM: "Monexa <no-reply@example.com>",
} as NodeJS.ProcessEnv;

describe("checkEnv in production", () => {
  it("requires an app URL outside Vercel", () => {
    const { errors } = checkEnv({ ...base, AUTH_TRUST_HOST: "true" });
    expect(errors.some((e) => e.includes("APP_URL"))).toBe(true);
  });

  it("accepts Vercel's production domain in place of APP_URL", () => {
    const { errors, warnings } = checkEnv({ ...base, VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "monexa.vercel.app" });
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("accepts SMTP without Resend", () => {
    const { warnings } = checkEnv({
      ...base,
      RESEND_API_KEY: undefined,
      VERCEL: "1",
      VERCEL_PROJECT_PRODUCTION_URL: "monexa.vercel.app",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_USER: "me@gmail.com",
      SMTP_PASS: "app-password",
    });
    expect(warnings).toEqual([]);
  });

  it("warns about Resend's test sender", () => {
    const { warnings } = checkEnv({ ...base, APP_URL: "https://m.example.com", AUTH_TRUST_HOST: "true", EMAIL_FROM: "Monexa <onboarding@resend.dev>" });
    expect(warnings.some((w) => w.includes("resend.dev"))).toBe(true);
  });
});
