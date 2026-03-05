"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LibraryStatus } from "@prisma/client";
import type { LibraryEntryWithGame } from "@/lib/services/library";
import { StarRating } from "@/components/game/star-rating";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryShelfProps {
  entries: LibraryEntryWithGame[];
  counts: Partial<Record<LibraryStatus, number>>;
  total: number;
  activeStatus?: LibraryStatus;
  activeSort: "recent" | "rating" | "title";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: LibraryStatus | "ALL"; label: string }[] = [
  { key: "ALL",       label: "All" },
  { key: "PLAYING",   label: "Playing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "BACKLOG",   label: "Backlog" },
  { key: "DROPPED",   label: "Dropped" },
  { key: "WISHLIST",  label: "Wishlist" },
];

const STATUS_BADGE: Record<LibraryStatus, string> = {
  PLAYING:   "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  COMPLETED: "text-green-400 bg-green-400/10 border-green-400/30",
  BACKLOG:   "text-amber-400 bg-amber-400/10 border-amber-400/30",
  DROPPED:   "text-rose-400 bg-rose-400/10 border-rose-400/30",
  WISHLIST:  "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

const STATUS_LABEL: Record<LibraryStatus, string> = {
  PLAYING:   "Playing",
  COMPLETED: "Completed",
  BACKLOG:   "Backlog",
  DROPPED:   "Dropped",
  WISHLIST:  "Wishlist",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "rating",  label: "My Rating" },
  { value: "title",   label: "Title A–Z" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function LibraryShelf({ entries, counts, total, activeStatus, activeSort }: LibraryShelfProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div>
      {/* Status tabs */}
      <div className="border-b border-subtle mb-6">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Library status filter">
          {STATUS_TABS.map(({ key, label }) => {
            const isActive = key === "ALL" ? !activeStatus : activeStatus === key;
            const count = key === "ALL" ? total : (counts[key as LibraryStatus] ?? 0);
            return (
              <button
                key={key}
                onClick={() => updateParam("status", key === "ALL" ? undefined : key)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs font-mono ${isActive ? "text-accent/70" : "text-text-tertiary"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sort control */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-tertiary">
          {entries.length} {entries.length === 1 ? "game" : "games"}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-text-tertiary">Sort:</label>
          <select
            id="sort"
            value={activeSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="bg-bg-elevated border border-subtle text-text-secondary text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Game grid */}
      {entries.length === 0 ? (
        <EmptyState status={activeStatus} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map((entry) => (
            <LibraryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Library card ─────────────────────────────────────────────────────────────

function LibraryCard({ entry }: { entry: LibraryEntryWithGame }) {
  const { game, status, rating } = entry;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block bg-bg-surface rounded-card border border-subtle hover:bg-bg-surface-hover hover:border-accent/30 transition-all"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full rounded-t-card overflow-hidden bg-bg-elevated">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover group-hover:-translate-y-0.5 transition-transform duration-150"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <span className="text-text-tertiary text-xs text-center leading-tight">{game.title}</span>
          </div>
        )}
        {/* Status badge overlay */}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-text-primary text-sm font-medium leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {game.title}
        </p>
        {rating ? (
          <div className="mt-1.5">
            <StarRating rating={rating} size="sm" showValue />
          </div>
        ) : (
          <p className="mt-1.5 text-text-tertiary text-xs">Not rated</p>
        )}
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ status }: { status?: LibraryStatus }) {
  const messages: Record<string, string> = {
    PLAYING:   "Nothing in progress. Time to boot up a game!",
    COMPLETED: "No completed games yet. Finish one and mark it done!",
    BACKLOG:   "Your backlog is clear — enjoy it while it lasts.",
    DROPPED:   "No abandoned games. Good discipline!",
    WISHLIST:  "Your wishlist is empty. Browse games to add some.",
  };

  const message = status ? messages[status] : "Your shelf is empty. Browse games to start tracking!";

  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">🎮</div>
      <p className="text-text-secondary text-sm">{message}</p>
      <Link
        href="/games"
        className="mt-4 inline-block text-sm text-accent hover:text-accent-hover underline underline-offset-2"
      >
        Browse Games
      </Link>
    </div>
  );
}
