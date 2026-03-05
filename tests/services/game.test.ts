import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => {
  const mock = {
    game: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), groupBy: vi.fn() },
    libraryEntry: { groupBy: vi.fn() },
    genre: { findMany: vi.fn(), upsert: vi.fn() },
    platform: { findMany: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") return arg(mock);
    if (Array.isArray(arg)) return Promise.all(arg);
  });
  return mock;
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  getGameBySlug,
  searchLocalGames,
  getBrowseGames,
  getAllGenres,
  getAllPlatforms,
  persistRawgGame,
} from "@/lib/services/game";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeGame = (overrides = {}) => ({
  id: "game-1",
  rawgId: 1234,
  title: "Test Game",
  slug: "test-game",
  coverUrl: "https://example.com/cover.jpg",
  releaseDate: new Date("2024-01-01"),
  avgRating: 4.2,
  totalRatings: 10,
  genres: [{ genre: { id: "g1", name: "RPG", slug: "rpg" } }],
  platforms: [{ platform: { id: "p1", name: "PC", slug: "pc" } }],
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") return arg(prismaMock);
    if (Array.isArray(arg)) return Promise.all(arg);
  });
});

describe("getGameBySlug", () => {
  it("queries by slug with genre and platform includes", async () => {
    prismaMock.game.findUnique.mockResolvedValue(makeGame());

    const result = await getGameBySlug("test-game");

    expect(prismaMock.game.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "test-game" } })
    );
    expect(result?.slug).toBe("test-game");
  });

  it("returns null when game not found", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null);

    const result = await getGameBySlug("nonexistent");
    expect(result).toBeNull();
  });
});

describe("searchLocalGames", () => {
  it("searches case-insensitively and returns mapped results", async () => {
    const mockGame = makeGame();
    prismaMock.game.findMany.mockResolvedValue([mockGame]);

    const results = await searchLocalGames("test");

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { title: { contains: "test", mode: "insensitive" } },
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Test Game");
    expect(results[0].genres).toEqual([{ name: "RPG" }]);
  });

  it("respects the limit parameter", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);

    await searchLocalGames("q", 3);

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it("returns empty array when no games match", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    const results = await searchLocalGames("zzz");
    expect(results).toEqual([]);
  });
});

describe("getBrowseGames", () => {
  it("returns games and total count", async () => {
    const mockGame = makeGame();
    prismaMock.game.findMany.mockResolvedValue([mockGame]);
    prismaMock.game.count.mockResolvedValue(1);

    const { games, total } = await getBrowseGames({});

    expect(games).toHaveLength(1);
    expect(total).toBe(1);
  });

  it("filters by genre slug", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    prismaMock.game.count.mockResolvedValue(0);

    await getBrowseGames({ genreSlug: "rpg" });

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          genres: { some: { genre: { slug: "rpg" } } },
        }),
      })
    );
  });

  it("filters by platform slug", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    prismaMock.game.count.mockResolvedValue(0);

    await getBrowseGames({ platformSlug: "pc" });

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          platforms: { some: { platform: { slug: "pc" } } },
        }),
      })
    );
  });

  it("sorts by rating when sort=rating", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    prismaMock.game.count.mockResolvedValue(0);

    await getBrowseGames({ sort: "rating" });

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { avgRating: "desc" } })
    );
  });

  it("sorts alphabetically when sort=alpha", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    prismaMock.game.count.mockResolvedValue(0);

    await getBrowseGames({ sort: "alpha" });

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: "asc" } })
    );
  });

  it("paginates correctly", async () => {
    prismaMock.game.findMany.mockResolvedValue([]);
    prismaMock.game.count.mockResolvedValue(50);

    await getBrowseGames({ page: 3, perPage: 10 });

    expect(prismaMock.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});

describe("getAllGenres", () => {
  it("returns genres ordered by name", async () => {
    const mockGenres = [{ id: "g1", name: "Action", slug: "action" }];
    prismaMock.genre.findMany.mockResolvedValue(mockGenres);

    const result = await getAllGenres();

    expect(prismaMock.genre.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    expect(result).toEqual(mockGenres);
  });
});

describe("getAllPlatforms", () => {
  it("returns platforms ordered by name", async () => {
    const mockPlatforms = [{ id: "p1", name: "PC", slug: "pc" }];
    prismaMock.platform.findMany.mockResolvedValue(mockPlatforms);

    const result = await getAllPlatforms();

    expect(prismaMock.platform.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    expect(result).toEqual(mockPlatforms);
  });
});

describe("persistRawgGame", () => {
  const rawgGame = {
    id: 1234,
    name: "Elden Ring",
    slug: "elden-ring",
    background_image: "https://example.com/cover.jpg",
    description_raw: "An open world RPG.",
    released: "2022-02-25",
    developers: [{ name: "FromSoftware" }],
    publishers: [{ name: "Bandai Namco" }],
    genres: [{ name: "RPG", slug: "rpg" }],
    platforms: [{ platform: { name: "PC", slug: "pc" } }],
  };

  it("creates a game with correct fields", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null); // slug not taken
    prismaMock.genre.upsert.mockResolvedValue({ id: "g1" });
    prismaMock.platform.upsert.mockResolvedValue({ id: "p1" });
    const mockGame = { id: "game-1", slug: "elden-ring" };
    prismaMock.game.create.mockResolvedValue(mockGame);

    const result = await persistRawgGame(rawgGame as never);

    expect(prismaMock.game.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawgId: 1234,
          title: "Elden Ring",
          slug: "elden-ring",
          developer: "FromSoftware",
          publisher: "Bandai Namco",
        }),
      })
    );
    expect(result.slug).toBe("elden-ring");
  });

  it("upserts genres and platforms", async () => {
    prismaMock.game.findUnique.mockResolvedValue(null);
    prismaMock.genre.upsert.mockResolvedValue({ id: "g1" });
    prismaMock.platform.upsert.mockResolvedValue({ id: "p1" });
    prismaMock.game.create.mockResolvedValue({ id: "game-1", slug: "elden-ring" });

    await persistRawgGame(rawgGame as never);

    expect(prismaMock.genre.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "rpg" } })
    );
    expect(prismaMock.platform.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "pc" } })
    );
  });

  it("appends a suffix when slug is already taken", async () => {
    // First call (slug "elden-ring") returns existing game, second call returns null
    prismaMock.game.findUnique
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(null);
    prismaMock.genre.upsert.mockResolvedValue({ id: "g1" });
    prismaMock.platform.upsert.mockResolvedValue({ id: "p1" });
    prismaMock.game.create.mockResolvedValue({ id: "game-2", slug: "elden-ring-1" });

    const result = await persistRawgGame(rawgGame as never);

    expect(prismaMock.game.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "elden-ring-1" }),
      })
    );
    expect(result.slug).toBe("elden-ring-1");
  });
});
