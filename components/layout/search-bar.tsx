"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SearchResult {
  id: string | null;
  rawgId: number | null;
  title: string;
  slug: string;
  coverUrl: string | null;
  releaseDate: string | null;
  genres: { name: string }[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as SearchResult[];
          setResults(data);
          setOpen(data.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const navigate = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setNavigating(true);
      router.push(`/games/${result.slug}`);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const releaseYear = (date: string | null) =>
    date ? new Date(date).getFullYear() : null;

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-56 lg:w-72">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search games…"
          aria-label="Search games"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full bg-bg-elevated border border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-colors"
        />
        {(loading || navigating) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-text-tertiary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-bg-elevated border border-subtle rounded-card shadow-xl overflow-hidden">
          <ul role="listbox">
            {results.map((result, i) => (
              <li key={result.slug} role="option" aria-selected={i === activeIndex}>
                <button
                  onClick={() => navigate(result)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? "bg-bg-surface-hover" : "hover:bg-bg-surface"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden bg-bg-surface border border-subtle">
                    {result.coverUrl ? (
                      <Image
                        src={result.coverUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full bg-bg-surface" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{result.title}</p>
                    <p className="text-text-tertiary text-xs font-mono">
                      {[releaseYear(result.releaseDate), result.genres[0]?.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-subtle">
            <Link
              href={`/games?q=${encodeURIComponent(query)}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs text-text-tertiary hover:text-text-secondary hover:bg-bg-surface transition-colors"
            >
              <span>View all results for &ldquo;{query}&rdquo;</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
