import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { toggleFollow } from "@/actions/social";

const mockSession = (userId: string | null) => {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? ({ user: { id: userId } } as never) : null
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toggleFollow", () => {
  it("throws if not authenticated", async () => {
    mockSession(null);
    await expect(toggleFollow("other-user")).rejects.toThrow("Unauthorized");
  });

  it("throws if user tries to follow themselves", async () => {
    mockSession("user-1");
    await expect(toggleFollow("user-1")).rejects.toThrow("Cannot follow yourself");
  });

  it("follows a user when no relationship exists", async () => {
    mockSession("user-1");
    prismaMock.follow.findUnique.mockResolvedValue(null);
    prismaMock.follow.create.mockResolvedValue({});

    const result = await toggleFollow("user-2");

    expect(result.success).toBe(true);
    expect(result.following).toBe(true);
    expect(prismaMock.follow.create).toHaveBeenCalledWith({
      data: { followerId: "user-1", followingId: "user-2" },
    });
  });

  it("unfollows a user when relationship exists", async () => {
    mockSession("user-1");
    prismaMock.follow.findUnique.mockResolvedValue({ followerId: "user-1" });
    prismaMock.follow.delete.mockResolvedValue({});

    const result = await toggleFollow("user-2");

    expect(result.success).toBe(true);
    expect(result.following).toBe(false);
    expect(prismaMock.follow.delete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: { followerId: "user-1", followingId: "user-2" },
      },
    });
  });

  it("checks the correct follow relationship (not reversed)", async () => {
    mockSession("user-1");
    prismaMock.follow.findUnique.mockResolvedValue(null);
    prismaMock.follow.create.mockResolvedValue({});

    await toggleFollow("user-2");

    expect(prismaMock.follow.findUnique).toHaveBeenCalledWith({
      where: {
        followerId_followingId: { followerId: "user-1", followingId: "user-2" },
      },
      select: { followerId: true },
    });
  });
});
