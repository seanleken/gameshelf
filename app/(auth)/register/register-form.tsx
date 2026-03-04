"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { register } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FieldErrors = {
  email?: string[];
  username?: string[];
  password?: string[];
  confirmPassword?: string[];
};

export function RegisterForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  function handleGoogleSignUp() {
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl: "/" });
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await register(formData);
      if (result && !result.success) {
        setErrors(result.errors ?? {});
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.[0]}
          required
        />
        <Input
          id="username"
          name="username"
          type="text"
          label="Username"
          placeholder="gamer_tag"
          autoComplete="username"
          error={errors.username?.[0]}
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="8+ characters"
          autoComplete="new-password"
          error={errors.password?.[0]}
          required
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Repeat password"
          autoComplete="new-password"
          error={errors.confirmPassword?.[0]}
          required
        />
        <Button type="submit" loading={isPending} className="w-full mt-1">
          Create Account
        </Button>
      </form>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-subtle" />
        <span className="text-xs text-text-tertiary">or</span>
        <div className="flex-1 border-t border-subtle" />
      </div>

      <Button
        variant="secondary"
        onClick={handleGoogleSignUp}
        loading={isGooglePending}
        className="w-full"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
