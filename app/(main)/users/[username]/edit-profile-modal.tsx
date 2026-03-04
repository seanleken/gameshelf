"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface UserData {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export function EditProfileModal({ user }: { user: UserData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Edit Profile
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-xl border border-subtle bg-bg-elevated shadow-2xl">
            <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
              <h2 className="text-base font-semibold text-text-primary">Edit Profile</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              {error && (
                <p className="rounded-lg bg-red-900/20 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
              <Input
                id="displayName"
                name="displayName"
                label="Display Name"
                placeholder="How you want to be known"
                defaultValue={user.displayName ?? ""}
              />
              <Textarea
                id="bio"
                name="bio"
                label="Bio"
                placeholder="Tell the community about yourself..."
                defaultValue={user.bio ?? ""}
                rows={3}
              />
              <Input
                id="avatarUrl"
                name="avatarUrl"
                label="Avatar URL"
                placeholder="https://..."
                defaultValue={user.avatarUrl ?? ""}
                type="url"
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
