import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">GameShelf</h1>
          <p className="mt-2 text-text-secondary">Sign in to your account</p>
        </div>

        {params.reset && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-900/20 px-4 py-3 text-sm text-green-400">
            Password updated! Sign in with your new password.
          </div>
        )}

        <div className="rounded-xl border border-subtle bg-bg-surface p-8">
          <LoginForm callbackUrl={params.callbackUrl} />
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-accent hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
