"use client";

import { useState } from "react";
import { createManualGame } from "@/actions/games";

interface Genre {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
}

interface SubmitGameFormProps {
  genres: Genre[];
  platforms: Platform[];
}

export function SubmitGameForm({ genres, platforms }: SubmitGameFormProps) {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await createManualGame(formData);

    if (result && !result.success) {
      setErrors(result.errors ?? { _: [result.error ?? "Something went wrong"] });
      setSubmitting(false);
    }
    // On success, createManualGame redirects — no further action needed
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._ && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {errors._[0]}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          placeholder="e.g. The Witcher 3: Wild Hunt"
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-xs text-red-400">{errors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 resize-y"
          placeholder="Describe the game…"
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-xs text-red-400">{errors.description[0]}</p>
        )}
      </div>

      {/* Cover URL */}
      <div>
        <label htmlFor="coverUrl" className="block text-sm font-medium text-text-primary mb-1.5">
          Cover Image URL <span className="text-text-tertiary text-xs font-normal">(optional)</span>
        </label>
        <input
          id="coverUrl"
          name="coverUrl"
          type="url"
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          placeholder="https://example.com/cover.jpg"
          aria-describedby={errors.coverUrl ? "coverUrl-error" : undefined}
        />
        {errors.coverUrl && (
          <p id="coverUrl-error" className="mt-1 text-xs text-red-400">{errors.coverUrl[0]}</p>
        )}
      </div>

      {/* Developer / Publisher */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="developer" className="block text-sm font-medium text-text-primary mb-1.5">
            Developer <span className="text-text-tertiary text-xs font-normal">(optional)</span>
          </label>
          <input
            id="developer"
            name="developer"
            type="text"
            className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
            placeholder="e.g. CD Projekt Red"
          />
        </div>
        <div>
          <label htmlFor="publisher" className="block text-sm font-medium text-text-primary mb-1.5">
            Publisher <span className="text-text-tertiary text-xs font-normal">(optional)</span>
          </label>
          <input
            id="publisher"
            name="publisher"
            type="text"
            className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
            placeholder="e.g. Bandai Namco"
          />
        </div>
      </div>

      {/* Release Date */}
      <div>
        <label htmlFor="releaseDate" className="block text-sm font-medium text-text-primary mb-1.5">
          Release Date <span className="text-text-tertiary text-xs font-normal">(optional)</span>
        </label>
        <input
          id="releaseDate"
          name="releaseDate"
          type="date"
          className="w-full bg-bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
        />
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <p className="block text-sm font-medium text-text-primary mb-2">
            Genres <span className="text-text-tertiary text-xs font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  name="genreIds"
                  value={g.id}
                  className="w-3.5 h-3.5 rounded accent-[#e5a837] bg-bg-elevated border-subtle"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {g.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Platforms */}
      {platforms.length > 0 && (
        <div>
          <p className="block text-sm font-medium text-text-primary mb-2">
            Platforms <span className="text-text-tertiary text-xs font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  name="platformIds"
                  value={p.id}
                  className="w-3.5 h-3.5 rounded accent-[#e5a837] bg-bg-elevated border-subtle"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {p.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-bg-primary font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? "Submitting…" : "Submit Game"}
      </button>
    </form>
  );
}
