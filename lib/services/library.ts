import { prisma } from "@/lib/prisma";
import type { LibraryStatus, Prisma } from "@prisma/client";

export type LibraryEntryWithGame = Prisma.LibraryEntryGetPayload<{
  include: {
    game: {
      include: {
        genres: { include: { genre: true } };
        platforms: { include: { platform: true } };
      };
    };
  };
}>;

export type LibrarySort = "recent" | "rating" | "title";

export async function getUserLibrary(
  userId: string,
  status?: LibraryStatus,
  sort: LibrarySort = "recent",
): Promise<LibraryEntryWithGame[]> {
  const orderBy: Prisma.LibraryEntryOrderByWithRelationInput =
    sort === "recent"
      ? { createdAt: "desc" }
      : sort === "rating"
      ? { rating: { sort: "desc", nulls: "last" } }
      : { game: { title: "asc" } };

  return prisma.libraryEntry.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: {
      game: {
        include: {
          genres: { include: { genre: true } },
          platforms: { include: { platform: true } },
        },
      },
    },
    orderBy,
  });
}

export async function getLibraryEntryCounts(userId: string) {
  const rows = await prisma.libraryEntry.groupBy({
    by: ["status"],
    where: { userId },
    _count: { id: true },
  });

  const counts: Partial<Record<LibraryStatus, number>> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row._count.id;
    total += row._count.id;
  }
  return { counts, total };
}

/** Returns the user's library entry for a specific game, or null. */
export async function getUserLibraryEntry(userId: string, gameId: string) {
  return prisma.libraryEntry.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });
}

/** Recent + rated entries for a public profile preview. */
export async function getPublicLibraryPreview(userId: string, limit = 6) {
  return prisma.libraryEntry.findMany({
    where: { userId, status: { in: ["PLAYING", "COMPLETED"] } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          avgRating: true,
        },
      },
    },
  });
}
