"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeDate } from "@/lib/utils";
import { toggleReplyHelpful, deleteReply, markAcceptedAnswer, updateReply } from "@/actions/forum";
import type { ReplyWithAuthor } from "@/lib/services/forum";
import { ReplyComposer } from "./reply-composer";

interface ReplyCardProps {
  reply: ReplyWithAuthor;
  currentUserId?: string;
  isThreadAuthor: boolean;
  threadId: string;
  onReplyCreated: (reply: ReplyWithAuthor) => void;
  onDeleted: (replyId: string) => void;
  onUpdated: (reply: ReplyWithAuthor) => void;
  depth?: number;
}

export function ReplyCard({
  reply,
  currentUserId,
  isThreadAuthor,
  threadId,
  onReplyCreated,
  onDeleted,
  onUpdated,
  depth = 0,
}: ReplyCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(reply.helpfulCount);
  const [hasVoted, setHasVoted] = useState(
    reply.votes.some((v) => v.userId === currentUserId),
  );
  const [isAccepted, setIsAccepted] = useState(reply.isAcceptedAnswer);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(reply.body);
  const [isPendingHelpful, startHelpfulTransition] = useTransition();
  const [isPendingAccept, startAcceptTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingEdit, startEditTransition] = useTransition();

  const displayName = reply.author.displayName ?? reply.author.username;
  const isOwner = currentUserId === reply.author.id;
  const canVote = !!currentUserId && !isOwner;

  function handleHelpful() {
    if (!canVote) return;
    const nextVoted = !hasVoted;
    setHasVoted(nextVoted);
    setHelpfulCount((c) => (nextVoted ? c + 1 : c - 1));

    startHelpfulTransition(async () => {
      try {
        await toggleReplyHelpful({ replyId: reply.id });
      } catch {
        setHasVoted(!nextVoted);
        setHelpfulCount((c) => (nextVoted ? c - 1 : c + 1));
      }
    });
  }

  function handleAccept() {
    if (!isThreadAuthor) return;
    const nextAccepted = !isAccepted;
    setIsAccepted(nextAccepted);

    startAcceptTransition(async () => {
      try {
        await markAcceptedAnswer({ replyId: reply.id, threadId });
      } catch {
        setIsAccepted(!nextAccepted);
      }
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteReply({ replyId: reply.id });
        onDeleted(reply.id);
      } catch {
        // Keep as-is on error
      }
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    startEditTransition(async () => {
      try {
        const result = await updateReply({ replyId: reply.id, body: editBody });
        if (result.success) {
          onUpdated(result.reply);
          setIsEditing(false);
        }
      } catch {
        // Keep editing on error
      }
    });
  }

  return (
    <div
      className={`${isAccepted ? "border-l-2 border-green-500/50" : "border-l border-subtle"} pl-4`}
    >
      <article
        className={`rounded-lg p-4 space-y-3 ${
          isAccepted ? "bg-green-500/5 border border-green-500/20" : "bg-bg-surface border border-subtle"
        }`}
      >
        {/* Accepted answer badge */}
        {isAccepted && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Accepted Answer
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Link href={`/users/${reply.author.username}`}>
            <Avatar src={reply.author.avatarUrl} name={displayName} size="sm" />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/users/${reply.author.username}`}
              className="text-sm font-medium text-text-primary hover:text-accent transition-colors"
            >
              {displayName}
            </Link>
            <p className="text-xs text-text-tertiary font-mono">
              {formatRelativeDate(reply.createdAt)}
              {reply.updatedAt > reply.createdAt && " · edited"}
            </p>
          </div>
        </div>

        {/* Body */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-y"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPendingEdit}
                className="text-xs bg-accent text-bg-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {isPendingEdit ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(reply.body);
                }}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:text-accent [&_code]:bg-bg-primary [&_code]:px-1 [&_code]:rounded [&_pre]:bg-bg-primary [&_pre]:rounded-lg [&_pre]:p-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.body}</ReactMarkdown>
          </div>
        )}

        {/* Footer actions */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {/* Helpful button */}
              <button
                onClick={handleHelpful}
                disabled={!canVote || isPendingHelpful}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  hasVoted
                    ? "text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                } disabled:cursor-not-allowed`}
                title={!currentUserId ? "Sign in to vote" : isOwner ? "Cannot vote on your own reply" : ""}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={hasVoted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                  />
                </svg>
                Helpful{helpfulCount > 0 && ` (${helpfulCount})`}
              </button>

              {/* Reply button */}
              {currentUserId && depth < 3 && (
                <button
                  onClick={() => setShowReplyForm((v) => !v)}
                  className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showReplyForm ? "Cancel" : "Reply"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Accept answer (thread author only) */}
              {isThreadAuthor && !isOwner && (
                <button
                  onClick={handleAccept}
                  disabled={isPendingAccept}
                  className={`text-xs font-medium transition-colors ${
                    isAccepted
                      ? "text-green-400 hover:text-rose-400"
                      : "text-text-tertiary hover:text-green-400"
                  }`}
                  title={isAccepted ? "Unmark as accepted" : "Mark as accepted answer"}
                >
                  {isAccepted ? "✓ Accepted" : "Mark as Answer"}
                </button>
              )}

              {/* Owner actions */}
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPendingDelete}
                    className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Inline reply composer */}
      {showReplyForm && (
        <div className="mt-3 pl-2">
          <ReplyComposer
            threadId={threadId}
            parentId={reply.id}
            onSuccess={(newReply) => {
              onReplyCreated(newReply);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Reply to ${displayName}…`}
          />
        </div>
      )}
    </div>
  );
}
