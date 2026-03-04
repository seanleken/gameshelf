"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registerSchema, editProfileSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail, sendPasswordResetEmail, sendGoogleAccountEmail } from "@/lib/email";

// ─── Token helpers ────────────────────────────────────────────────────────────

async function createToken(type: "verify" | "reset", email: string, expiresInHours: number) {
  const identifier = `${type}:${email}`;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // Remove any existing token of this type for this email
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  await prisma.verificationToken.create({ data: { identifier, token, expires } });
  return token;
}

async function consumeToken(token: string, type: "verify" | "reset"): Promise<string> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) throw new Error("Invalid or expired link.");
  if (!record.identifier.startsWith(`${type}:`)) throw new Error("Invalid or expired link.");
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    throw new Error("This link has expired. Please request a new one.");
  }

  await prisma.verificationToken.delete({ where: { token } });
  return record.identifier.slice(type.length + 1); // strip "verify:" or "reset:" prefix
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function register(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    return {
      success: false,
      errors: {
        email: existing.email === email ? ["Email already in use"] : undefined,
        username: existing.username === username ? ["Username already taken"] : undefined,
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, username, passwordHash } });

  const token = await createToken("verify", email, 24);
  await sendVerificationEmail(email, token);

  redirect("/verify-email");
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await consumeToken(token, "verify");
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } });

  // Don't reveal whether the email exists — always return success
  if (!user || user.emailVerified) return { success: true };

  // Rate-limit: check if a token was created in the last 60 seconds
  const identifier = `verify:${email}`;
  const existing = await prisma.verificationToken.findFirst({ where: { identifier } });
  if (existing && existing.expires.getTime() - 24 * 60 * 60 * 1000 > Date.now() - 60 * 1000) {
    return { success: false, error: "Please wait a moment before requesting another email." };
  }

  const token = await createToken("verify", email, 24);
  await sendVerificationEmail(email, token);
  return { success: true };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });

  // Always return success to avoid email enumeration
  if (!user) return { success: true };

  if (!user.passwordHash) {
    // Google-only account — let them know
    await sendGoogleAccountEmail(email);
    return { success: true };
  }

  const token = await createToken("reset", email, 1);
  await sendPasswordResetEmail(email, token);
  return { success: true };
}

export async function resetPassword(token: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { success: false, error: errors.password?.[0] ?? errors.confirmPassword?.[0] ?? "Invalid input." };
  }

  try {
    const email = await consumeToken(token, "reset");
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

// ─── Profile update ───────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const raw = {
    displayName: formData.get("displayName") || undefined,
    bio: formData.get("bio") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
  };

  const parsed = editProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl || null,
    },
  });

  revalidatePath(`/users/${session.user.username}`);
  return { success: true };
}
