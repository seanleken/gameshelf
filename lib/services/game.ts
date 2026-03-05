import { prisma } from "@/lib/prisma";
import { type RawgGameDetail } from "@/lib/rawg";
import { slugify } from "@/lib/utils";
import type { Game, Genre, Platform, Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameWithRelations = Prisma.GameGetPayload<{
  include: {
    genres: { include: { genre: true } };
    platforms: { include: { platform: true } };
  };
}>;

export type GameSearchResult = {
  id: string;
  rawgId: number | null;
  title: string;
  slug: string;
  coverUrl: string | null;
  releaseDate: Date | null;
  genres: { name: string }[];
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getGameBySlug(slug: string): Promise<GameWithRelations | null> {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      platforms: { include: { platform: true } },
    },
  });
}

export async function searchLocalGames(query: string, limit = 5): Promise<GameSearchResult[]> {
  const games = await prisma.game.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
    },
    take: limit,
    include: {
      genres: { include: { genre: true } },
    },
    orderBy: { avgRating: "desc" },
  });

  return games.map((g) => ({
    id: g.id,
    rawgId: g.rawgId,
    title: g.title,
    slug: g.slug,
    coverUrl: g.coverUrl,
    releaseDate: g.releaseDate,
    genres: g.genres.map((gg: { genre: Genre }) => ({ name: gg.genre.name })),
  }));
}

export async function getBrowseGames({
  genreSlug,
  platformSlug,
  sort = "newest",
  page = 1,
  perPage = 24,
}: {
  genreSlug?: string;
  platformSlug?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}): Promise<{ games: GameWithRelations[]; total: number }> {
  const where: Prisma.GameWhereInput = {};

  if (genreSlug) {
    where.genres = { some: { genre: { slug: genreSlug } } };
  }
  if (platformSlug) {
    where.platforms = { some: { platform: { slug: platformSlug } } };
  }

  const orderBy: Prisma.GameOrderByWithRelationInput =
    sort === "rating"
      ? { avgRating: "desc" }
      : sort === "alpha"
        ? { title: "asc" }
        : { releaseDate: { sort: "desc", nulls: "last" } };

  const [games, total] = await prisma.$transaction([
    prisma.game.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    }),
    prisma.game.count({ where }),
  ]);

  return { games, total };
}

export async function getGameById(id: string): Promise<{ id: string; title: string } | null> {
  return prisma.game.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
}

export async function getTrendingGames(limit = 8): Promise<GameSearchResult[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const topIds = await prisma.libraryEntry.groupBy({
    by: ["gameId"],
    where: { createdAt: { gte: since } },
    _count: { gameId: true },
    orderBy: { _count: { gameId: "desc" } },
    take: limit,
  });

  if (topIds.length === 0) return getTopRatedGames(limit);

  const games = await prisma.game.findMany({
    where: { id: { in: topIds.map((g) => g.gameId) } },
    include: { genres: { include: { genre: true } } },
  });

  const countMap = new Map(topIds.map((g) => [g.gameId, g._count.gameId]));
  return games
    .sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0))
    .map((g) => ({
      id: g.id,
      rawgId: g.rawgId,
      title: g.title,
      slug: g.slug,
      coverUrl: g.coverUrl,
      releaseDate: g.releaseDate,
      genres: g.genres.map((gg: { genre: Genre }) => ({ name: gg.genre.name })),
    }));
}

export async function getTopRatedGames(limit = 8): Promise<GameSearchResult[]> {
  const games = await prisma.game.findMany({
    where: { totalRatings: { gte: 2 }, avgRating: { gt: 0 } },
    orderBy: [{ avgRating: "desc" }, { totalRatings: "desc" }],
    take: limit,
    include: { genres: { include: { genre: true } } },
  });

  return games.map((g) => ({
    id: g.id,
    rawgId: g.rawgId,
    title: g.title,
    slug: g.slug,
    coverUrl: g.coverUrl,
    releaseDate: g.releaseDate,
    genres: g.genres.map((gg: { genre: Genre }) => ({ name: gg.genre.name })),
  }));
}

export async function getAllGenres(): Promise<Genre[]> {
  return prisma.genre.findMany({ orderBy: { name: "asc" } });
}

export async function getAllPlatforms(): Promise<Platform[]> {
  return prisma.platform.findMany({ orderBy: { name: "asc" } });
}

// ─── RAWG Persistence ─────────────────────────────────────────────────────────

export async function persistRawgGame(raw: RawgGameDetail): Promise<Game> {
  const coverUrl = raw.background_image ?? null;
  const description = raw.description_raw ?? null;
  const releaseDate = raw.released ? new Date(raw.released) : null;
  const developer = raw.developers?.[0]?.name ?? null;
  const publisher = raw.publishers?.[0]?.name ?? null;

  // Generate a unique slug based on RAWG's slug
  const baseSlug = raw.slug ?? slugify(raw.name);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.game.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Upsert genres
    const genreConnections: { genreId: string }[] = [];
    for (const g of raw.genres ?? []) {
      const genre = await tx.genre.upsert({
        where: { slug: g.slug },
        update: { name: g.name },
        create: { name: g.name, slug: g.slug },
      });
      genreConnections.push({ genreId: genre.id });
    }

    // Upsert platforms (RAWG nests platform data under `.platform`)
    const platformConnections: { platformId: string }[] = [];
    for (const entry of raw.platforms ?? []) {
      const p = entry.platform;
      const platform = await tx.platform.upsert({
        where: { slug: p.slug },
        update: { name: p.name },
        create: { name: p.name, slug: p.slug },
      });
      platformConnections.push({ platformId: platform.id });
    }

    // Create the game
    const game = await tx.game.create({
      data: {
        rawgId: raw.id,
        title: raw.name,
        slug,
        description,
        coverUrl,
        releaseDate,
        developer,
        publisher,
        genres: { create: genreConnections },
        platforms: { create: platformConnections },
      },
    });

    return game;
  });
}
