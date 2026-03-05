"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createReply } from "@/actions/forum";
import type { ReplyWithAuthor } from "@/lib/services/forum";

interface ReplyComposerProps {
  threadId: string;
  parentId?: string;
  onSuccess: (reply: ReplyWithAuthor) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function ReplyComposer({
  threadId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "Write your reply… (Markdown supported)",
}: ReplyComposerProps) {
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError("Reply cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReply({ body: body.trim(), threadId, parentId });
        if (result.success) {
          setBody("");
          setPreview(false);
          onSuccess(result.reply);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            {parentId ? "Reply" : "Post a reply"}
          </label>
          <div className="flex rounded-lg overflow-hidden border border-subtle text-xs">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`px-3 py-1 transition-colors ${
                !preview
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`px-3 py-1 transition-colors ${
                preview
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {preview ? (
          <div className="min-h-[100px] bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5">
            {body.trim() ? (
              <div className="prose prose-invert prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:text-accent [&_code]:bg-bg-primary [&_code]:px-1 [&_code]:rounded [&_pre]:bg-bg-primary [&_pre]:rounded-lg [&_pre]:p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-text-tertiary text-sm italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={parentId ? 4 : 5}
            maxLength={20000}
            placeholder={placeholder}
            className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-y transition-colors"
          />
        )}
        <p className="text-text-tertiary text-xs mt-1 text-right font-mono">
          {body.length}/20000
        </p>
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="bg-accent text-bg-primary text-sm font-semibold px-5 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isPending ? "Posting…" : "Post Reply"}
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
