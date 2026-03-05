import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  editProfileSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "user@example.com",
    username: "gamer42",
    password: "strongpass",
    confirmPassword: "strongpass",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.success).toBe(false);
  });

  it("rejects username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({ ...valid, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects username longer than 20 characters", () => {
    const result = registerSchema.safeParse({ ...valid, username: "a".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({ ...valid, username: "user-name!" });
    expect(result.success).toBe(false);
  });

  it("accepts username with underscores and numbers", () => {
    const result = registerSchema.safeParse({ ...valid, username: "gamer_42" });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "bad-email" });
    expect(result.success).toBe(false);
  });
});

describe("editProfileSchema", () => {
  it("accepts all optional fields empty", () => {
    expect(editProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid display name and bio", () => {
    const result = editProfileSchema.safeParse({ displayName: "GamerDude", bio: "I love games" });
    expect(result.success).toBe(true);
  });

  it("accepts empty avatarUrl string", () => {
    const result = editProfileSchema.safeParse({ avatarUrl: "" });
    expect(result.success).toBe(true);
  });

  it("accepts valid avatar URL", () => {
    const result = editProfileSchema.safeParse({ avatarUrl: "https://example.com/avatar.png" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid avatar URL (non-empty, non-url)", () => {
    const result = editProfileSchema.safeParse({ avatarUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects displayName over 50 characters", () => {
    const result = editProfileSchema.safeParse({ displayName: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects bio over 500 characters", () => {
    const result = editProfileSchema.safeParse({ bio: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "newpassword", confirmPassword: "newpassword" });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "newpassword", confirmPassword: "different" });
    expect(result.success).toBe(false);
  });

  it("rejects password under 8 characters", () => {
    const result = resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
});
