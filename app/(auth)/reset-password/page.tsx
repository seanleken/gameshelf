import { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-text-secondary">Invalid reset link.</p>
          <Link href="/forgot-password" className="mt-3 inline-block text-sm text-accent hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">GameShelf</h1>
          <p className="mt-2 text-text-secondary">Choose a new password</p>
        </div>
        <div className="rounded-xl border border-subtle bg-bg-surface p-8">
          <ResetPasswordForm token={token} />
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
