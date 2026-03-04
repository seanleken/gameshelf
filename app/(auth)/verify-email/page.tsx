import { Metadata } from "next";
import Link from "next/link";
import { verifyEmail } from "@/actions/auth";
import { ResendVerificationForm } from "./resend-form";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Token present — attempt verification immediately
  if (token) {
    const result = await verifyEmail(token);

    if (result.success) {
      return (
        <AuthCard>
          <StatusIcon success />
          <h1 className="mt-4 text-xl font-semibold text-text-primary">Email verified!</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block w-full rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-bg-primary transition hover:opacity-90"
          >
            Sign In
          </Link>
        </AuthCard>
      );
    }

    return (
      <AuthCard>
        <StatusIcon success={false} />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">Link invalid or expired</h1>
        <p className="mt-2 text-sm text-text-secondary">{result.error}</p>
        <p className="mt-4 text-sm text-text-secondary">
          Enter your email below to get a fresh verification link.
        </p>
        <div className="mt-4">
          <ResendVerificationForm />
        </div>
      </AuthCard>
    );
  }

  // No token — "check your inbox" state after registration
  return (
    <AuthCard>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">Check your inbox</h1>
      <p className="mt-2 text-sm text-text-secondary">
        We sent a verification link to your email. Click it to activate your account.
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
      </p>
      <div className="mt-6 border-t border-subtle pt-5">
        <p className="mb-3 text-xs text-text-tertiary">Didn&apos;t receive it?</p>
        <ResendVerificationForm />
      </div>
    </AuthCard>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-text-primary">GameShelf</span>
        </div>
        <div className="rounded-xl border border-subtle bg-bg-surface p-8 text-center">
          {children}
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

function StatusIcon({ success }: { success: boolean }) {
  return (
    <div
      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
        success ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
      }`}
    >
      {success ? (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}
