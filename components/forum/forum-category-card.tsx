import Link from "next/link";
import type { CategoryWithCount } from "@/lib/services/forum";

interface ForumCategoryCardProps {
  category: CategoryWithCount;
}

export function ForumCategoryCard({ category }: ForumCategoryCardProps) {
  return (
    <Link href={`/forum/${category.slug}`} className="block group">
      <div className="bg-bg-surface border border-subtle rounded-card p-6 hover:bg-bg-surface-hover transition-colors">
        <div className="flex items-start gap-4">
          {/* Color dot */}
          <div
            className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary font-semibold text-lg group-hover:text-accent transition-colors">
              {category.name}
            </h2>
            <p className="text-text-secondary text-sm mt-1 leading-relaxed">
              {category.description}
            </p>
            <p className="text-text-tertiary text-xs font-mono mt-3">
              {category._count.threads}{" "}
              {category._count.threads === 1 ? "thread" : "threads"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
