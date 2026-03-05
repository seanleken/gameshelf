import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => {
  const mock = {
    review: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    reviewVote: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { createReview, updateReview, deleteReview, toggleHelpful } from "@/actions/reviews";

const mockSession = (userId: string | null) => {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? ({ user: { id: userId } } as never) : null
  );
};

const makeReview = (overrides = {}) => ({
  id: "review-1",
  userId: "user-1",
  gameId: "game-1",
  title: "My Review",
  body: "Great game",
  rating: 4.5,
  containsSpoilers: false,
  helpfulCount: 0,
  user: { id: "user-1", username: "gamer", displayName: null, avatarUrl: null },
  votes: [],
  game: { slug: "game-slug", title: "Test Game", coverUrl: null },
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

describe("createReview", () => {
  const validInput = {
    gameId: "game-1",
    title: "My Review",
    body: "This game is absolutely fantastic and worth every penny.",
    rating: 4.5,
    containsSpoilers: false,
  };

  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(createReview(validInput)).rejects.toThrow("Unauthorized");
  });

  it("creates a review and records activity", async () => {
    const { recordActivity } = await import("@/lib/services/activity");
    mockSession("user-1");
    const mockReview = makeReview();
    prismaMock.review.create.mockResolvedValue(mockReview);

    const result = await createReview(validInput);

    expect(result.success).toBe(true);
    expect(prismaMock.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          gameId: "game-1",
          rating: 4.5,
        }),
      })
    );
    expect(recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: "REVIEWED", userId: "user-1" })
    );
  });

  it("throws on invalid input (body too short)", async () => {
    mockSession("user-1");
    await expect(
      createReview({ ...validInput, body: "too short" })
    ).rejects.toThrow();
  });
});

describe("updateReview", () => {
  const validInput = {
    reviewId: "review-1",
    title: "Updated Title",
    body: "Updated body with sufficient length to pass validation checks.",
    rating: 3.5,
    containsSpoilers: true,
  };

  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(updateReview(validInput)).rejects.toThrow("Unauthorized");
  });

  it("updates the review", async () => {
    mockSession("user-1");
    const mockReview = makeReview({ title: "Updated Title", rating: 3.5 });
    prismaMock.review.update.mockResolvedValue(mockReview);

    const result = await updateReview(validInput);

    expect(result.success).toBe(true);
    expect(prismaMock.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "review-1", userId: "user-1" },
        data: expect.objectContaining({ title: "Updated Title", rating: 3.5 }),
      })
    );
  });
});

describe("deleteReview", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(deleteReview({ reviewId: "review-1" })).rejects.toThrow("Unauthorized");
  });

  it("deletes the review scoped to the current user", async () => {
    mockSession("user-1");
    prismaMock.review.delete.mockResolvedValue({});

    const result = await deleteReview({ reviewId: "review-1" });

    expect(result.success).toBe(true);
    expect(prismaMock.review.delete).toHaveBeenCalledWith({
      where: { id: "review-1", userId: "user-1" },
    });
  });
});

describe("toggleHelpful", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(toggleHelpful({ reviewId: "review-1" })).rejects.toThrow("Unauthorized");
  });

  it("adds a vote when none exists", async () => {
    mockSession("user-1");
    prismaMock.reviewVote.findUnique.mockResolvedValue(null);
    prismaMock.reviewVote.create.mockResolvedValue({});
    prismaMock.review.update.mockResolvedValue({});

    const result = await toggleHelpful({ reviewId: "review-1" });

    expect(result.success).toBe(true);
    expect(result.voted).toBe(true);
    expect(prismaMock.reviewVote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: "user-1", reviewId: "review-1" },
      })
    );
  });

  it("removes a vote when one already exists", async () => {
    mockSession("user-1");
    prismaMock.reviewVote.findUnique.mockResolvedValue({ userId: "user-1", reviewId: "review-1" });
    prismaMock.reviewVote.delete.mockResolvedValue({});
    prismaMock.review.update.mockResolvedValue({});

    const result = await toggleHelpful({ reviewId: "review-1" });

    expect(result.success).toBe(true);
    expect(result.voted).toBe(false);
    expect(prismaMock.reviewVote.delete).toHaveBeenCalled();
  });
});
