import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const reviewInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  votes: { select: { userId: true } },
  game: { select: { slug: true, title: true } },
} as const;

export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: typeof reviewInclude;
}>;

export type ReviewSort = "recent" | "helpful";

export async function getGameReviews(
  gameId: string,
  sort: ReviewSort = "recent",
): Promise<ReviewWithUser[]> {
  return prisma.review.findMany({
    where: { gameId },
    include: reviewInclude,
    orderBy: sort === "helpful" ? { helpfulCount: "desc" } : { createdAt: "desc" },
  });
}

export async function getUserReviews(userId: string): Promise<ReviewWithUser[]> {
  return prisma.review.findMany({
    where: { userId },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserReviewForGame(
  userId: string,
  gameId: string,
): Promise<ReviewWithUser | null> {
  return prisma.review.findUnique({
    where: { userId_gameId: { userId, gameId } },
    include: reviewInclude,
  });
}
