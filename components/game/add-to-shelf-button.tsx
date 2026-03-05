"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { LibraryStatus } from "@prisma/client";
import { upsertLibraryEntry, deleteLibraryEntry } from "@/actions/library";

export type ShelfEntry = {
  id: string;
  status: LibraryStatus;
  rating: number | null;
};

interface AddToShelfButtonProps {
  gameId: string;
  initialEntry: ShelfEntry | null;
}

const STATUS_CONFIG: Record<LibraryStatus, { label: string; dotClass: string; chipClass: string }> = {
  PLAYING:   { label: "Playing",   dotClass: "bg-cyan-400",   chipClass: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  COMPLETED: { label: "Completed", dotClass: "bg-green-400",  chipClass: "text-green-400 bg-green-400/10 border-green-400/30" },
  BACKLOG:   { label: "Backlog",   dotClass: "bg-amber-400",  chipClass: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  DROPPED:   { label: "Dropped",   dotClass: "bg-rose-400",   chipClass: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
  WISHLIST:  { label: "Wishlist",  dotClass: "bg-purple-400", chipClass: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
};

const STATUS_ORDER: LibraryStatus[] = ["PLAYING", "COMPLETED", "BACKLOG", "DROPPED", "WISHLIST"];

export function AddToShelfButton({ gameId, initialEntry }: AddToShelfButtonProps) {
  const [entry, setEntry] = useState<ShelfEntry | null>(initialEntry);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleSelectStatus(status: LibraryStatus) {
    setOpen(false);
    setEntry({ id: entry?.id ?? "pending", status, rating: entry?.rating ?? null });

    startTransition(async () => {
      const result = await upsertLibraryEntry({ gameId, status, rating: entry?.rating });
      if (result.success) {
        setEntry({ id: result.entry.id, status: result.entry.status, rating: result.entry.rating });
      }
    });
  }

  function handleRemove() {
    setOpen(false);
    setEntry(null);
    startTransition(async () => {
      await deleteLibraryEntry({ gameId });
    });
  }

  const config = entry ? STATUS_CONFIG[entry.status] : null;

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          config
            ? `w-full flex items-center gap-2 border rounded-lg py-2.5 px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${config.chipClass}`
            : "w-full flex items-center justify-center gap-2 bg-accent text-bg-primary rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
        }
      >
        {config ? (
          <>
            {/* check icon */}
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="flex-1 text-left">{config.label}</span>
          </>
        ) : (
          <>
            {/* bookmark icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Add to Shelf
          </>
        )}
        {/* chevron */}
        <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 z-50 bg-bg-elevated border border-subtle rounded-lg shadow-xl overflow-hidden"
        >
          {STATUS_ORDER.map((status) => {
            const { label, dotClass, chipClass } = STATUS_CONFIG[status];
            const isActive = status === entry?.status;
            return (
              <li key={status} role="option" aria-selected={isActive}>
                <button
                  onClick={() => handleSelectStatus(status)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-bg-surface-hover transition-colors ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                  {label}
                  {isActive && (
                    <svg className={`w-3.5 h-3.5 ml-auto ${chipClass.split(" ")[0]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}

          {entry && (
            <>
              <li className="border-t border-subtle" />
              <li>
                <button
                  onClick={handleRemove}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 text-rose-400 hover:bg-bg-surface-hover transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove from Shelf
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
