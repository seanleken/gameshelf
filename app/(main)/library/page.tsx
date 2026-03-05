import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserLibrary, getLibraryEntryCounts } from "@/lib/services/library";
import { LibraryShelf } from "./library-shelf";
import type { LibraryStatus } from "@/types/library";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Shelf — GameShelf" };

const VALID_STATUSES = ["PLAYING", "COMPLETED", "BACKLOG", "DROPPED", "WISHLIST"] as const;
const VALID_SORTS = ["recent", "rating", "title"] as const;

interface PageProps {
  searchParams: Promise<{ status?: string; sort?: string }>;
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { status: statusParam, sort: sortParam } = await searchParams;

  const status = VALID_STATUSES.includes(statusParam as LibraryStatus)
    ? (statusParam as LibraryStatus)
    : undefined;

  const sort = VALID_SORTS.includes(sortParam as typeof VALID_SORTS[number])
    ? (sortParam as typeof VALID_SORTS[number])
    : "recent";

  const [entries, { counts, total }] = await Promise.all([
    getUserLibrary(session.user.id, status, sort),
    getLibraryEntryCounts(session.user.id),
  ]);

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">My Shelf</h1>
      <LibraryShelf
        entries={entries}
        counts={counts}
        total={total}
        activeStatus={status}
        activeSort={sort}
      />
    </main>
  );
}
