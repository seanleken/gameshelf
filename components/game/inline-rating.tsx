"use client";

import { useState, useTransition } from "react";
import { StarRatingInput } from "./star-rating";
import { upsertLibraryEntry } from "@/actions/library";
import type { LibraryStatus } from "@prisma/client";

interface InlineRatingProps {
  gameId: string;
  status: LibraryStatus;
  initialRating: number | null;
}

export function InlineRating({ gameId, status, initialRating }: InlineRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [isPending, startTransition] = useTransition();

  function handleChange(newRating: number | null) {
    setRating(newRating);
    startTransition(async () => {
      await upsertLibraryEntry({ gameId, status, rating: newRating });
    });
  }

  return (
    <div className={`transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <p className="text-text-tertiary text-xs font-mono uppercase tracking-wide mb-1.5">Your Rating</p>
      <StarRatingInput value={rating} onChange={handleChange} size="lg" />
    </div>
  );
}
