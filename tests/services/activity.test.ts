import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  activityEvent: { create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@prisma/client", () => ({
  ActivityEventType: {
    ADDED_GAME: "ADDED_GAME",
    REVIEWED: "REVIEWED",
    COMPLETED: "COMPLETED",
    STARTED_PLAYING: "STARTED_PLAYING",
    THREAD_CREATED: "THREAD_CREATED",
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { recordActivity } from "@/lib/services/activity";

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordActivity", () => {
  const base = {
    userId: "user-1",
    type: "ADDED_GAME" as const,
    targetId: "game-1",
    targetType: "game",
  };

  it("creates an activity event", async () => {
    prismaMock.activityEvent.create.mockResolvedValue({});

    await recordActivity(base);

    expect(prismaMock.activityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        type: "ADDED_GAME",
        targetId: "game-1",
        targetType: "game",
        metadata: {},
      }),
    });
  });

  it("includes metadata when provided", async () => {
    prismaMock.activityEvent.create.mockResolvedValue({});

    await recordActivity({
      ...base,
      metadata: { gameTitle: "Test Game", gameSlug: "test-game" },
    });

    expect(prismaMock.activityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: { gameTitle: "Test Game", gameSlug: "test-game" },
      }),
    });
  });

  it("swallows errors silently — never throws", async () => {
    prismaMock.activityEvent.create.mockRejectedValue(new Error("DB connection failed"));

    // Should not throw even when the DB call fails
    await expect(recordActivity(base)).resolves.toBeUndefined();
  });
});
