"use client";

import { useState } from "react";
import { ReviewsSection } from "@/components/review/reviews-section";
import type { ReviewWithUser } from "@/lib/services/review";

interface GameTabsProps {
  about: React.ReactNode;
  reviews: ReviewWithUser[];
  currentUserId?: string;
  gameId: string;
}

const TABS = ["About", "Reviews"] as const;
type Tab = typeof TABS[number];

export function GameTabs({ about, reviews, currentUserId, gameId }: GameTabsProps) {
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
                <span className={`ml-1.5 text-xs font-mono ${active === tab ? "text-accent/70" : "text-text-tertiary"}`}>
                  {reviews.length}
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
      </div>
    </div>
  );
}
