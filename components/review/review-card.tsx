"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/game/star-rating";
import { formatRelativeDate } from "@/lib/utils";
import { toggleHelpful, deleteReview } from "@/actions/reviews";
import type { ReviewWithUser } from "@/lib/services/review";

interface ReviewCardProps {
  review: ReviewWithUser;
  currentUserId?: string;
  /** Show "reviewed <game>" link — use on profile pages, omit on game pages */
  showGame?: boolean;
  onEdit?: (review: ReviewWithUser) => void;
  onDeleted?: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  currentUserId,
  showGame,
  onEdit,
  onDeleted,
}: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [hasVoted, setHasVoted] = useState(
    review.votes.some((v) => v.userId === currentUserId),
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isOwner = currentUserId === review.user.id;
  const canVote = !!currentUserId && !isOwner;

  function handleHelpful() {
    if (!canVote) return;
    const nextVoted = !hasVoted;
    setHasVoted(nextVoted);
    setHelpfulCount((c) => (nextVoted ? c + 1 : c - 1));
    startTransition(async () => {
      const res = await toggleHelpful({ reviewId: review.id });
      if (!res.success) {
        // revert
        setHasVoted(!nextVoted);
        setHelpfulCount((c) => (nextVoted ? c - 1 : c + 1));
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete your review? This cannot be undone.")) return;
    startDeleteTransition(async () => {
      const res = await deleteReview({ reviewId: review.id });
      if (res.success) onDeleted?.(review.id);
    });
  }

  const displayName = review.user.displayName ?? review.user.username;

  return (
    <article className="bg-bg-surface border border-subtle rounded-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/users/${review.user.username}`} className="flex-shrink-0">
            <Avatar src={review.user.avatarUrl} name={displayName} size="md" />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/users/${review.user.username}`}
              className="text-text-primary font-medium text-sm hover:text-accent transition-colors"
            >
              {displayName}
            </Link>
            {showGame && (
              <p className="text-text-tertiary text-xs mt-0.5">
                reviewed{" "}
                <Link href={`/games/${review.game.slug}`} className="hover:text-accent transition-colors">
                  {review.game.title}
                </Link>
              </p>
            )}
            <p className="text-text-tertiary text-xs font-mono mt-0.5">
              {formatRelativeDate(review.createdAt)}
              {review.updatedAt > review.createdAt && " · edited"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-text-primary font-semibold">{review.title}</h3>

      {/* Body */}
      {review.containsSpoilers && !spoilerRevealed ? (
        <div className="relative">
          <div className="blur-sm select-none pointer-events-none text-text-secondary text-sm line-clamp-3">
            {review.body}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setSpoilerRevealed(true)}
              className="bg-bg-elevated border border-subtle text-text-primary text-xs font-medium px-4 py-2 rounded-lg hover:border-accent/50 transition-colors"
            >
              ⚠ Spoiler — click to reveal
            </button>
          </div>
        </div>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none text-text-secondary
          prose-headings:text-text-primary prose-a:text-accent prose-a:no-underline
          hover:prose-a:underline prose-code:text-accent prose-code:bg-bg-elevated
          prose-code:px-1 prose-code:rounded prose-blockquote:border-accent/40
          prose-blockquote:text-text-tertiary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.body}</ReactMarkdown>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Helpful */}
          <button
            onClick={handleHelpful}
            disabled={!canVote || isPending}
            title={
              !currentUserId
                ? "Sign in to vote"
                : isOwner
                ? "Can't vote on your own review"
                : hasVoted
                ? "Mark as not helpful"
                : "Mark as helpful"
            }
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              hasVoted
                ? "text-accent"
                : "text-text-tertiary hover:text-text-secondary disabled:hover:text-text-tertiary"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
            </svg>
            Helpful{helpfulCount > 0 && ` (${helpfulCount})`}
          </button>

          {review.containsSpoilers && (
            <span className="text-xs text-amber-400/70 font-mono">⚠ spoilers</span>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
