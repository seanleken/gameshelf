"use client";

import { useState } from "react";
import Link from "next/link";
import { ReviewsSection } from "@/components/review/reviews-section";
import { ThreadCard } from "@/components/forum/thread-card";
import type { ReviewWithUser } from "@/lib/services/review";
import type { ThreadWithMeta } from "@/lib/services/forum";

interface GameTabsProps {
  about: React.ReactNode;
  reviews: ReviewWithUser[];
  currentUserId?: string;
  gameId: string;
  gameThreads: ThreadWithMeta[];
}

const TABS = ["About", "Reviews", "Discussions"] as const;
type Tab = (typeof TABS)[number];

export function GameTabs({
  about,
  reviews,
  currentUserId,
  gameId,
  gameThreads,
}: GameTabsProps) {
  const [active, setActive] = useState<Tab>("About");

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-subtle mb-8">
        <nav className="flex gap-6" aria-label="Game sections">
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
                <span
                  className={`ml-1.5 text-xs font-mono ${active === tab ? "text-accent/70" : "text-text-tertiary"}`}
                >
                  {reviews.length}
                </span>
              )}
              {tab === "Discussions" && gameThreads.length > 0 && (
                <span
                  className={`ml-1.5 text-xs font-mono ${active === tab ? "text-accent/70" : "text-text-tertiary"}`}
                >
                  {gameThreads.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Panels */}
      <div className="max-w-3xl">
        {active === "About" && about}
        {active === "Reviews" && (
          <ReviewsSection
            initialReviews={reviews}
            currentUserId={currentUserId}
            gameId={gameId}
          />
        )}
        {active === "Discussions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-text-secondary text-sm">
                {gameThreads.length === 0
                  ? "No discussions yet for this game."
                  : `${gameThreads.length} recent thread${gameThreads.length === 1 ? "" : "s"}`}
              </p>
              {currentUserId ? (
                <Link
                  href={`/forum/threads/new?gameId=${gameId}`}
                  className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  + Start Discussion
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Sign in to post
                </Link>
              )}
            </div>

            {gameThreads.length > 0 && (
              <div className="space-y-3">
                {gameThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} showCategory />
                ))}
              </div>
            )}

            {gameThreads.length === 0 && currentUserId && (
              <div className="text-center py-10 border border-subtle rounded-card">
                <p className="text-text-tertiary text-sm">
                  No one has started a discussion about this game yet.
                </p>
                <Link
                  href={`/forum/threads/new?gameId=${gameId}`}
                  className="inline-block mt-3 bg-accent text-bg-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Start a Discussion
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
