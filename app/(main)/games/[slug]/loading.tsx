export default function GamePageLoading() {
  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-[280px_1fr] gap-8 mb-10">
        {/* Cover skeleton */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-[3/4] max-w-[280px] mx-auto lg:mx-0 rounded-card overflow-hidden bg-bg-elevated border border-subtle shimmer" />
          <div className="hidden lg:block h-10 rounded-lg bg-bg-elevated shimmer" />
        </div>

        {/* Metadata skeleton */}
        <div className="flex flex-col gap-4 pt-1">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded bg-bg-elevated shimmer" />
            <div className="h-4 w-1/3 rounded bg-bg-elevated shimmer" />
          </div>

          {/* Rating */}
          <div className="h-6 w-40 rounded bg-bg-elevated shimmer" />

          {/* Quick meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 rounded bg-bg-elevated shimmer" />
                <div className="h-4 w-24 rounded bg-bg-elevated shimmer" />
              </div>
            ))}
          </div>

          {/* Genre badges */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-bg-elevated shimmer" />
            ))}
          </div>

          {/* Platform badges */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-12 rounded-full bg-bg-elevated shimmer" />
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="border-b border-subtle mb-8">
        <div className="flex gap-6 pb-3">
          {["About", "Reviews", "Discussions"].map((tab) => (
            <div key={tab} className="h-4 w-16 rounded bg-bg-elevated shimmer" />
          ))}
        </div>
      </div>

      {/* Description skeleton */}
      <div className="max-w-3xl space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-4 rounded bg-bg-elevated shimmer ${i === 5 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </main>
  );
}
