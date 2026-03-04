"use client";

import { useState, useTransition } from "react";
import { resendVerification } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResendVerificationForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;

    startTransition(async () => {
      const result = await resendVerification(email);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-green-400">
        If that email has an unverified account, a new link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Input
        id="resend-email"
        name="email"
        type="email"
        placeholder="your@email.com"
        required
      />
      <Button type="submit" variant="secondary" loading={isPending} className="w-full">
        Resend verification email
      </Button>
    </form>
  );
}
