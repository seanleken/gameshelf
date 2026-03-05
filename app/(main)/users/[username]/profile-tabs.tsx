"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/game/star-rating";
import { ReviewCard } from "@/components/review/review-card";
import type { ReviewWithUser } from "@/lib/services/review";

type LibraryEntry = {
  id: string;
  rating: number | null;
  game: { slug: string; title: string; coverUrl: string | null };
};

interface ProfileTabsProps {
  isOwner: boolean;
  username: string;
  displayName: string;
  libraryPreview: LibraryEntry[];
  reviews: ReviewWithUser[];
  currentUserId?: string;
}

const TABS = ["Shelf", "Reviews"] as const;
type Tab = typeof TABS[number];

export function ProfileTabs({
  isOwner,
  username,
  displayName,
  libraryPreview,
  reviews,
  currentUserId,
}: ProfileTabsProps) {
  const [active, setActive] = useState<Tab>("Shelf");

  return (
    <div className="mt-10 border-t border-subtle pt-8">
      {/* Tab bar */}
      <div className="flex gap-6 border-b border-subtle mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === tab
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {tab}
            {tab === "Reviews" && reviews.length > 0 && (
              <span className={`ml-1.5 text-xs font-mono ${active === tab ? "text-accent/70" : "text-text-tertiary"}`}>
                {reviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Shelf tab */}
      {active === "Shelf" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-secondary text-sm">
              {isOwner ? "Recently played & completed" : `${displayName}'s shelf`}
            </p>
            {isOwner && (
              <Link href="/library" className="text-sm text-accent hover:text-accent-hover transition-colors">
                View all →
              </Link>
            )}
          </div>

          {libraryPreview.length === 0 ? (
            <p className="text-text-tertiary text-sm">
              {isOwner ? "Your shelf is empty. Browse games to start tracking!" : "No games on shelf yet."}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {libraryPreview.map((entry) => (
                <Link key={entry.id} href={`/games/${entry.game.slug}`} className="group block">
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-bg-elevated border border-subtle group-hover:border-accent/30 transition-colors">
                    {entry.game.coverUrl ? (
                      <Image
                        src={entry.game.coverUrl}
                        alt={entry.game.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <span className="text-text-tertiary text-[10px] text-center">{entry.game.title}</span>
                      </div>
                    )}
                  </div>
                  {entry.rating && (
                    <div className="mt-1.5">
                      <StarRating rating={entry.rating} size="sm" showValue={false} />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reviews tab */}
      {active === "Reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-text-tertiary text-sm">
              {isOwner ? "You haven't written any reviews yet." : `${displayName} hasn't written any reviews yet.`}
            </p>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                showGame
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
