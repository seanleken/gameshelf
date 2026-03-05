"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StarRatingInput } from "@/components/game/star-rating";
import { createReview, updateReview } from "@/actions/reviews";
import type { ReviewWithUser } from "@/lib/services/review";

interface ReviewFormProps {
  gameId: string;
  /** Pass existing review to enter edit mode */
  existing?: ReviewWithUser;
  onSuccess: (review: ReviewWithUser) => void;
  onCancel?: () => void;
}

export function ReviewForm({ gameId, existing, onSuccess, onCancel }: ReviewFormProps) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [containsSpoilers, setContainsSpoilers] = useState(existing?.containsSpoilers ?? false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!rating) { setError("Please add a star rating."); return; }
    if (!title.trim()) { setError("Please add a title."); return; }
    if (body.trim().length < 10) { setError("Review body must be at least 10 characters."); return; }

    startTransition(async () => {
      try {
        let result;
        if (existing) {
          result = await updateReview({
            reviewId: existing.id,
            title: title.trim(),
            body: body.trim(),
            rating,
            containsSpoilers,
          });
        } else {
          result = await createReview({
            gameId,
            title: title.trim(),
            body: body.trim(),
            rating,
            containsSpoilers,
          });
        }

        if (result.success) {
          onSuccess(result.review as ReviewWithUser);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className="text-text-tertiary text-xs font-mono uppercase tracking-wide block mb-2">
          Your Rating <span className="text-rose-400">*</span>
        </label>
        <StarRatingInput value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="text-text-tertiary text-xs font-mono uppercase tracking-wide block mb-1.5">
          Title <span className="text-rose-400">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your thoughts…"
          maxLength={200}
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Body with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="review-body" className="text-text-tertiary text-xs font-mono uppercase tracking-wide">
            Review <span className="text-rose-400">*</span>
          </label>
          <div className="flex rounded-lg overflow-hidden border border-subtle text-xs">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`px-3 py-1 transition-colors ${!preview ? "bg-bg-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`px-3 py-1 transition-colors ${preview ? "bg-bg-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
            >
              Preview
            </button>
          </div>
        </div>

        {preview ? (
          <div className="min-h-[160px] bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5">
            {body.trim() ? (
              <div className="prose prose-invert prose-sm max-w-none text-text-secondary
                prose-headings:text-text-primary prose-a:text-accent prose-code:text-accent
                prose-code:bg-bg-primary prose-code:px-1 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-text-tertiary text-sm italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your review… Markdown is supported."
            rows={8}
            maxLength={10000}
            className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-colors resize-y font-mono"
          />
        )}
        <p className="text-text-tertiary text-xs mt-1 text-right">{body.length}/10000</p>
      </div>

      {/* Spoiler checkbox */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={containsSpoilers}
          onChange={(e) => setContainsSpoilers(e.target.checked)}
          className="w-4 h-4 rounded border-subtle bg-bg-elevated accent-accent cursor-pointer"
        />
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          This review contains spoilers
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-bg-primary text-sm font-semibold px-5 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving…" : existing ? "Update Review" : "Publish Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
