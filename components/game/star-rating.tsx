"use client";

import { useState, useCallback } from "react";

// ─── Interactive input ────────────────────────────────────────────────────────

interface StarRatingInputProps {
  value: number | null;       // current rating (0.5–5.0) or null
  onChange: (rating: number | null) => void;
  size?: "sm" | "md" | "lg";
}

const inputSizeClasses = { sm: "w-5 h-5", md: "w-6 h-6", lg: "w-8 h-8" };

export function StarRatingInput({ value, onChange, size = "md" }: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const displayed = hover ?? value ?? 0;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientX - rect.left) / rect.width < 0.5;
    setHover(starIndex + (half ? 0.5 : 1));
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientX - rect.left) / rect.width < 0.5;
    const rating = starIndex + (half ? 0.5 : 1);
    // clicking the same rating again clears it
    onChange(rating === value ? null : rating);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = value ?? 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, current + 0.5) || 0.5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = current - 0.5;
      onChange(next <= 0 ? null : next);
    }
  }, [value, onChange]);

  const starClass = inputSizeClasses[size];

  return (
    <div
      role="slider"
      aria-label="Rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
      aria-valuetext={value ? `${value} out of 5` : "No rating"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
      className="flex items-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = displayed - i;
        const type = filled >= 1 ? "full" : filled >= 0.5 ? "half" : "empty";
        return (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={(e) => handleClick(e, i)}
            className={`${starClass} transition-transform hover:scale-110 cursor-pointer focus:outline-none`}
            aria-hidden
          >
            <StarSvg type={type} />
          </button>
        );
      })}
      {value && (
        <span className="ml-1 text-text-secondary font-mono text-sm">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

// ─── Display (read-only) ──────────────────────────────────────────────────────

interface StarRatingProps {
  rating: number; // 0.0 – 5.0 in 0.5 increments
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function StarRating({ rating, size = "md", showValue = true }: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating - i;
    if (filled >= 1) return "full";
    if (filled >= 0.5) return "half";
    return "empty";
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((type, i) => (
          <span key={i} className={sizeClasses[size]}>
            <StarSvg type={type as "full" | "half" | "empty"} />
          </span>
        ))}
      </div>
      {showValue && rating > 0 && (
        <span className={`text-text-secondary font-mono ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ─── Shared star SVG ──────────────────────────────────────────────────────────

function StarSvg({ type }: { type: "full" | "half" | "empty" }) {
  const path = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

  if (type === "full") {
    return (
      <svg className="w-full h-full text-accent" viewBox="0 0 20 20" fill="currentColor">
        <path d={path} />
      </svg>
    );
  }

  if (type === "half") {
    return (
      <svg className="w-full h-full" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half-fill">
            <stop offset="50%" stopColor="var(--color-accent, #e5a837)" />
            <stop offset="50%" stopColor="var(--color-text-tertiary, #555d72)" />
          </linearGradient>
        </defs>
        <path fill="url(#half-fill)" d={path} />
      </svg>
    );
  }

  return (
    <svg className="w-full h-full text-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
      <path d={path} />
    </svg>
  );
}
