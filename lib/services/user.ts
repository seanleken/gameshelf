import { prisma } from "@/lib/prisma";

export type UserStats = {
  completed: number;
  playing: number;
  totalInLibrary: number;
  avgRating: number | null;
  topGenre: string | null;
};

export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const [statusGroups, ratingAgg, genreRows] = await Promise.all([
    prisma.libraryEntry.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.libraryEntry.aggregate({
      where: { userId, rating: { not: null } },
      _avg: { rating: true },
    }),
    prisma.gameGenre.findMany({
      where: { game: { libraryEntries: { some: { userId } } } },
      include: { genre: { select: { name: true } } },
    }),
  ]);

  const completed = statusGroups.find((e) => e.status === "COMPLETED")?._count.id ?? 0;
  const playing = statusGroups.find((e) => e.status === "PLAYING")?._count.id ?? 0;
  const totalInLibrary = statusGroups.reduce((sum, e) => sum + e._count.id, 0);
  const avgRating = ratingAgg._avg.rating;

  const genreCounts = new Map<string, number>();
  for (const gg of genreRows) {
    const name = gg.genre.name;
    genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
  }
  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { completed, playing, totalInLibrary, avgRating, topGenre };
}

export async function searchUsers(q: string, limit = 12): Promise<PublicUser[]> {
  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
    take: limit,
  });
}

export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}
