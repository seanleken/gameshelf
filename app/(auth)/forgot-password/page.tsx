import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">GameShelf</h1>
          <p className="mt-2 text-text-secondary">Reset your password</p>
        </div>
        <div className="rounded-xl border border-subtle bg-bg-surface p-8">
          <ForgotPasswordForm />
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
