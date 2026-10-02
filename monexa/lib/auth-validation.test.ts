import { describe, expect, it } from "vitest";
import { emailSchema, loginPasswordSchema, nameSchema, newPasswordSchema } from "./auth-validation";

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Foo.Bar@Example.COM ")).toBe("foo.bar@example.com");
  });

  it("rejects invalid addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("accepts a reasonable password", () => {
    expect(newPasswordSchema.safeParse("hunter22abc").success).toBe(true);
  });

  it("requires 8+ characters", () => {
    expect(newPasswordSchema.safeParse("abc123").success).toBe(false);
  });

  it("requires a letter and a number", () => {
    expect(newPasswordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(newPasswordSchema.safeParse("12345678").success).toBe(false);
  });

  it("rejects passwords bcrypt would truncate (over 72 bytes)", () => {
    expect(newPasswordSchema.safeParse("a1" + "x".repeat(70)).success).toBe(true);
    expect(newPasswordSchema.safeParse("a1" + "x".repeat(71)).success).toBe(false);
    // Multi-byte characters count by bytes, not characters.
    expect(newPasswordSchema.safeParse("a1" + "é".repeat(36)).success).toBe(false);
  });
});

describe("loginPasswordSchema", () => {
  it("still accepts short passwords from before the stricter rules", () => {
    expect(loginPasswordSchema.safeParse("abc123").success).toBe(true);
  });

  it("rejects empty", () => {
    expect(loginPasswordSchema.safeParse("").success).toBe(false);
  });
});

describe("nameSchema", () => {
  it("trims and enforces length", () => {
    expect(nameSchema.parse("  Ann  ")).toBe("Ann");
    expect(nameSchema.safeParse(" A ").success).toBe(false);
  });
});
