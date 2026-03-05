import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoryBySlug, getThreadsByCategory, type ThreadSort } from "@/lib/services/forum";
import { ThreadCard } from "@/components/forum/thread-card";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} — GameShelf Forums` : "Forums — GameShelf",
  };
}

const VALID_SORTS: ThreadSort[] = ["latest", "newest", "popular"];
const PER_PAGE = 20;

export default async function ForumCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { sort: sortParam, page: pageParam } = await searchParams;

  const sort: ThreadSort = VALID_SORTS.includes(sortParam as ThreadSort)
    ? (sortParam as ThreadSort)
    : "latest";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [category, { threads, total }] = await Promise.all([
    getCategoryBySlug(slug),
    getThreadsByCategory(slug, sort, page, PER_PAGE),
  ]);

  if (!category) notFound();

  const session = await getServerSession(authOptions);
  const totalPages = Math.ceil(total / PER_PAGE);

  const sortLabels: Record<ThreadSort, string> = {
    latest: "Latest Reply",
    newest: "Newest",
    popular: "Most Viewed",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-6 font-mono">
        <Link href="/forum" className="hover:text-text-secondary transition-colors">
          Forums
        </Link>
        <span>/</span>
        <span
          className="font-medium"
          style={{ color: category.color }}
        >
          {category.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{category.name}</h1>
          <p className="text-text-secondary text-sm mt-1">{category.description}</p>
        </div>
        {session?.user ? (
          <Link
            href={`/forum/threads/new?category=${category.slug}`}
            className="flex-shrink-0 bg-accent text-bg-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
          >
            New Thread
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex-shrink-0 border border-subtle text-text-secondary text-sm font-medium px-4 py-2 rounded-lg hover:bg-bg-surface-hover transition-colors"
          >
            Sign in to post
          </Link>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-text-tertiary text-xs font-mono">Sort:</span>
        {VALID_SORTS.map((s) => (
          <Link
            key={s}
            href={`/forum/${slug}?sort=${s}&page=1`}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              sort === s
                ? "bg-accent/15 text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
            }`}
          >
            {sortLabels[s]}
          </Link>
        ))}
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="text-center py-16 border border-subtle rounded-card">
          <p className="text-text-secondary font-medium">No threads yet</p>
          <p className="text-text-tertiary text-sm mt-1">
            Be the first to start a discussion in {category.name}!
          </p>
          {session?.user && (
            <Link
              href={`/forum/threads/new?category=${category.slug}`}
              className="inline-block mt-4 bg-accent text-bg-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
            >
              Start a Thread
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <Link
            href={page > 1 ? `/forum/${slug}?sort=${sort}&page=${page - 1}` : "#"}
            className={`text-sm font-medium px-4 py-2 rounded-lg border border-subtle transition-colors ${
              page <= 1
                ? "opacity-40 pointer-events-none"
                : "hover:bg-bg-surface-hover text-text-secondary"
            }`}
          >
            ← Previous
          </Link>
          <span className="text-text-tertiary text-sm font-mono">
            Page {page} of {totalPages}
          </span>
          <Link
            href={page < totalPages ? `/forum/${slug}?sort=${sort}&page=${page + 1}` : "#"}
            className={`text-sm font-medium px-4 py-2 rounded-lg border border-subtle transition-colors ${
              page >= totalPages
                ? "opacity-40 pointer-events-none"
                : "hover:bg-bg-surface-hover text-text-secondary"
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
