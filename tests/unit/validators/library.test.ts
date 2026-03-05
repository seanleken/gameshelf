import { describe, it, expect, vi } from "vitest";

// Must mock @prisma/client before importing the validator (which imports LibraryStatus at module level)
vi.mock("@prisma/client", () => ({
  LibraryStatus: {
    PLAYING: "PLAYING",
    COMPLETED: "COMPLETED",
    BACKLOG: "BACKLOG",
    DROPPED: "DROPPED",
    WISHLIST: "WISHLIST",
  },
}));

const { upsertLibraryEntrySchema, deleteLibraryEntrySchema } = await import(
  "@/lib/validators/library"
);

describe("upsertLibraryEntrySchema", () => {
  it("accepts valid entry with status only", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "PLAYING",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = ["PLAYING", "COMPLETED", "BACKLOG", "DROPPED", "WISHLIST"];
    for (const status of statuses) {
      expect(
        upsertLibraryEntrySchema.safeParse({ gameId: "game-1", status }).success
      ).toBe(true);
    }
  });

  it("accepts valid half-star rating", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "COMPLETED",
      rating: 4.5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null rating", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "BACKLOG",
      rating: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating not a multiple of 0.5", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "COMPLETED",
      rating: 3.3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 0.5", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "COMPLETED",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "COMPLETED",
      rating: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "game-1",
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty gameId", () => {
    const result = upsertLibraryEntrySchema.safeParse({
      gameId: "",
      status: "PLAYING",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteLibraryEntrySchema", () => {
  it("accepts valid gameId", () => {
    expect(deleteLibraryEntrySchema.safeParse({ gameId: "game-1" }).success).toBe(true);
  });

  it("rejects empty gameId", () => {
    expect(deleteLibraryEntrySchema.safeParse({ gameId: "" }).success).toBe(false);
  });
});
