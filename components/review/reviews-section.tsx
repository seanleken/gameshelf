"use client";

import { useState } from "react";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import type { ReviewWithUser } from "@/lib/services/review";

interface ReviewsSectionProps {
  initialReviews: ReviewWithUser[];
  currentUserId?: string;
  gameId: string;
}

type Sort = "recent" | "helpful";

export function ReviewsSection({
  initialReviews,
  currentUserId,
  gameId,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>(initialReviews);
  const [sort, setSort] = useState<Sort>("recent");
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(null);

  const sorted = [...reviews].sort((a, b) =>
    sort === "helpful"
      ? b.helpfulCount - a.helpfulCount
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const hasOwnReview = reviews.some((r) => r.userId === currentUserId);

  function handleCreated(review: ReviewWithUser) {
    setReviews((prev) => [review, ...prev]);
    setShowForm(false);
  }

  function handleUpdated(review: ReviewWithUser) {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
    setEditingReview(null);
  }

  function handleDeleted(reviewId: string) {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-text-tertiary text-sm">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
        <div className="flex items-center gap-3">
          {reviews.length > 1 && (
            <div className="flex rounded-lg overflow-hidden border border-subtle text-xs">
              {(["recent", "helpful"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 capitalize transition-colors ${sort === s ? "bg-bg-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
                >
                  {s === "recent" ? "Most Recent" : "Most Helpful"}
                </button>
              ))}
            </div>
          )}
          {currentUserId && !hasOwnReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-accent text-bg-primary text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-accent-hover transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {/* Write / edit form */}
      {(showForm || editingReview) && (
        <div className="bg-bg-surface border border-subtle rounded-card p-5">
          <h3 className="text-text-primary font-semibold mb-4">
            {editingReview ? "Edit Your Review" : "Write a Review"}
          </h3>
          <ReviewForm
            gameId={gameId}
            existing={editingReview ?? undefined}
            onSuccess={editingReview ? handleUpdated : handleCreated}
            onCancel={() => {
              setShowForm(false);
              setEditingReview(null);
            }}
          />
        </div>
      )}

      {/* Reviews list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-sm">No reviews yet.</p>
          {currentUserId && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-accent hover:text-accent-hover underline underline-offset-2"
            >
              Be the first to review this game
            </button>
          )}
          {!currentUserId && (
            <p className="mt-2 text-text-tertiary text-xs">
              <a href="/login" className="text-accent hover:underline">Sign in</a> to write a review.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={review.userId === currentUserId ? (r) => { setShowForm(false); setEditingReview(r); } : undefined}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
