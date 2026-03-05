export default function ThreadPageLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-12 rounded bg-bg-elevated shimmer" />
        <div className="h-3 w-2 rounded bg-bg-elevated shimmer" />
        <div className="h-3 w-24 rounded bg-bg-elevated shimmer" />
        <div className="h-3 w-2 rounded bg-bg-elevated shimmer" />
        <div className="h-3 w-40 rounded bg-bg-elevated shimmer" />
      </div>

      {/* Thread header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-12 rounded bg-bg-elevated shimmer" />
          <div className="h-5 w-16 rounded bg-bg-elevated shimmer" />
        </div>
        <div className="h-7 w-3/4 rounded bg-bg-elevated shimmer" />
        <div className="h-4 w-1/3 rounded bg-bg-elevated shimmer" />
      </div>

      {/* Original post skeleton */}
      <div className="bg-bg-surface border border-subtle rounded-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-bg-elevated shimmer" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-bg-elevated shimmer" />
            <div className="h-3 w-40 rounded bg-bg-elevated shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-4 rounded bg-bg-elevated shimmer ${i === 4 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </div>
      </div>

      {/* Replies heading skeleton */}
      <div className="h-5 w-24 rounded bg-bg-elevated shimmer mb-4" />

      {/* Reply skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-bg-surface border border-subtle rounded-card p-5 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-bg-elevated shimmer" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-bg-elevated shimmer" />
              <div className="h-3 w-32 rounded bg-bg-elevated shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div
                key={j}
                className={`h-4 rounded bg-bg-elevated shimmer ${j === 2 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
