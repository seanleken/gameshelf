import { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">GameShelf</h1>
          <p className="mt-2 text-text-secondary">Create your account</p>
        </div>
        <div className="rounded-xl border border-subtle bg-bg-surface p-8">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <a href="/login" className="text-accent hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
