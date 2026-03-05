"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createThread } from "@/actions/forum";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ThreadFormProps {
  categories: Category[];
  defaultCategorySlug?: string;
  defaultGameId?: string;
  defaultGameTitle?: string;
}

export function ThreadForm({
  categories,
  defaultCategorySlug,
  defaultGameId,
  defaultGameTitle,
}: ThreadFormProps) {
  const router = useRouter();
  const defaultCategory = defaultCategorySlug
    ? categories.find((c) => c.slug === defaultCategorySlug)
    : null;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory?.id ?? categories[0]?.id ?? "");
  const [gameId] = useState(defaultGameId ?? "");
  const [tagsInput, setTagsInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Post body must be at least 10 characters.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createThread({
          title: title.trim(),
          body: body.trim(),
          categoryId,
          gameId: gameId || undefined,
          tags: parseTags(tagsInput),
        });

        if (result.success) {
          router.push(`/forum/threads/${result.thread.slug}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category selector */}
      <div>
        <label htmlFor="thread-category" className="block text-sm font-medium text-text-secondary mb-1.5">
          Category <span className="text-rose-400">*</span>
        </label>
        <select
          id="thread-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="thread-title" className="block text-sm font-medium text-text-secondary mb-1.5">
          Title <span className="text-rose-400">*</span>
        </label>
        <input
          id="thread-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="A clear and descriptive title…"
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
        <p className="text-text-tertiary text-xs mt-1 text-right font-mono">
          {title.length}/200
        </p>
      </div>

      {/* Game link */}
      {defaultGameTitle && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Related Game
          </label>
          <div className="bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary">
            {defaultGameTitle}
          </div>
        </div>
      )}

      {/* Body */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Post <span className="text-rose-400">*</span>
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
          <div className="min-h-[200px] bg-bg-elevated border border-subtle rounded-lg px-4 py-3">
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
            rows={10}
            maxLength={50000}
            placeholder="Share your thoughts… (Markdown supported)"
            className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-y transition-colors"
          />
        )}
        <p className="text-text-tertiary text-xs mt-1 text-right font-mono">
          {body.length}/50000
        </p>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="thread-tags" className="block text-sm font-medium text-text-secondary mb-1.5">
          Tags{" "}
          <span className="text-text-tertiary font-normal">(optional, comma-separated, max 5)</span>
        </label>
        <input
          id="thread-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. question, tips, spoilers"
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
        {tagsInput && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parseTags(tagsInput).map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded border border-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-bg-primary text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isPending ? "Posting…" : "Post Thread"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

