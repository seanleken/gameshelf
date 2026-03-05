"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/social";

interface FollowButtonProps {
  followingId: string;
  initialFollowing: boolean;
}

export function FollowButton({ followingId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFollow(followingId);
      setFollowing(result.following);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
        following
          ? "bg-bg-elevated border border-subtle text-text-secondary hover:border-rose-400/50 hover:text-rose-400"
          : "bg-accent text-bg-primary hover:bg-accent-hover"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
