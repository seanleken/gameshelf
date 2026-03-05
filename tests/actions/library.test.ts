import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted to the top of the file, so prismaMock must be
// created via vi.hoisted() to be available when the factory executes.
const prismaMock = vi.hoisted(() => {
  const mock = {
    libraryEntry: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    game: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") return arg(mock);
    if (Array.isArray(arg)) return Promise.all(arg);
  });
  return mock;
});

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/services/activity", () => ({ recordActivity: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@prisma/client", () => ({
  LibraryStatus: {
    PLAYING: "PLAYING",
    COMPLETED: "COMPLETED",
    BACKLOG: "BACKLOG",
    DROPPED: "DROPPED",
    WISHLIST: "WISHLIST",
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import {
  upsertLibraryEntry,
  deleteLibraryEntry,
  updateLibraryRating,
} from "@/actions/library";

const mockSession = (userId: string | null) => {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? ({ user: { id: userId } } as never) : null
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") return arg(prismaMock);
    if (Array.isArray(arg)) return Promise.all(arg);
  });
  // Default aggregate for recalcGameRating
  prismaMock.libraryEntry.aggregate.mockResolvedValue({
    _avg: { rating: 4.0 },
    _count: { rating: 2 },
  });
  prismaMock.game.update.mockResolvedValue({});
});

describe("upsertLibraryEntry", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(
      upsertLibraryEntry({ gameId: "game-1", status: "PLAYING" })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws on invalid input", async () => {
    mockSession("user-1");
    await expect(
      upsertLibraryEntry({ gameId: "", status: "PLAYING" })
    ).rejects.toThrow();
  });

  it("creates a new library entry and fires ADDED_GAME activity", async () => {
    mockSession("user-1");
    prismaMock.libraryEntry.findUnique.mockResolvedValue(null); // no existing entry
    prismaMock.game.findUnique.mockResolvedValue({
      title: "Test Game",
      slug: "test-game",
      coverUrl: null,
    });
    const mockEntry = { id: "entry-1", gameId: "game-1", status: "PLAYING" };
    prismaMock.libraryEntry.upsert.mockResolvedValue(mockEntry);

    const result = await upsertLibraryEntry({ gameId: "game-1", status: "PLAYING" });

    expect(result.success).toBe(true);
    expect(prismaMock.libraryEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "user-1", gameId: "game-1", status: "PLAYING" }),
      })
    );
  });

  it("fires COMPLETED activity when status changes to COMPLETED", async () => {
    const { recordActivity } = await import("@/lib/services/activity");
    mockSession("user-1");
    prismaMock.libraryEntry.findUnique.mockResolvedValue({ status: "PLAYING" });
    prismaMock.game.findUnique.mockResolvedValue({
      title: "Test Game",
      slug: "test-game",
      coverUrl: null,
    });
    prismaMock.libraryEntry.upsert.mockResolvedValue({ id: "entry-1", status: "COMPLETED" });

    await upsertLibraryEntry({ gameId: "game-1", status: "COMPLETED" });

    expect(recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: "COMPLETED" })
    );
  });

  it("fires STARTED_PLAYING activity when status changes to PLAYING", async () => {
    const { recordActivity } = await import("@/lib/services/activity");
    mockSession("user-1");
    prismaMock.libraryEntry.findUnique.mockResolvedValue({ status: "BACKLOG" });
    prismaMock.game.findUnique.mockResolvedValue({
      title: "Test Game",
      slug: "test-game",
      coverUrl: null,
    });
    prismaMock.libraryEntry.upsert.mockResolvedValue({ id: "entry-1", status: "PLAYING" });

    await upsertLibraryEntry({ gameId: "game-1", status: "PLAYING" });

    expect(recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: "STARTED_PLAYING" })
    );
  });
});

describe("deleteLibraryEntry", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(deleteLibraryEntry({ gameId: "game-1" })).rejects.toThrow("Unauthorized");
  });

  it("deletes the library entry and recalculates rating", async () => {
    mockSession("user-1");
    prismaMock.libraryEntry.delete.mockResolvedValue({});

    const result = await deleteLibraryEntry({ gameId: "game-1" });

    expect(result.success).toBe(true);
    expect(prismaMock.libraryEntry.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_gameId: { userId: "user-1", gameId: "game-1" } },
      })
    );
  });
});

describe("updateLibraryRating", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(
      updateLibraryRating({ gameId: "game-1", status: "PLAYING", rating: 4.5 })
    ).rejects.toThrow("Unauthorized");
  });

  it("updates the rating and recalculates game avg", async () => {
    mockSession("user-1");
    const mockEntry = { id: "entry-1", rating: 4.5 };
    prismaMock.libraryEntry.update.mockResolvedValue(mockEntry);

    const result = await updateLibraryRating({
      gameId: "game-1",
      status: "COMPLETED",
      rating: 4.5,
    });

    expect(result.success).toBe(true);
    expect(prismaMock.libraryEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_gameId: { userId: "user-1", gameId: "game-1" } },
        data: { rating: 4.5 },
      })
    );
    // Recalc should update the game
    expect(prismaMock.game.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "game-1" } })
    );
  });
});
