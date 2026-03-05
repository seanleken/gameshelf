"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  toggleHelpfulSchema,
} from "@/lib/validators/review";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const reviewInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  votes: { select: { userId: true } },
  game: { select: { slug: true, title: true } },
} as const;

export async function createReview(raw: unknown) {
  const userId = await requireSession();
  const input = createReviewSchema.parse(raw);

  const review = await prisma.review.create({
    data: {
      userId,
      gameId: input.gameId,
      title: input.title,
      body: input.body,
      rating: input.rating,
      containsSpoilers: input.containsSpoilers,
    },
    include: reviewInclude,
  });

  return { success: true as const, review };
}

export async function updateReview(raw: unknown) {
  const userId = await requireSession();
  const input = updateReviewSchema.parse(raw);

  const review = await prisma.review.update({
    where: { id: input.reviewId, userId },
    data: {
      title: input.title,
      body: input.body,
      rating: input.rating,
      containsSpoilers: input.containsSpoilers,
    },
    include: reviewInclude,
  });

  return { success: true as const, review };
}

export async function deleteReview(raw: unknown) {
  const userId = await requireSession();
  const input = deleteReviewSchema.parse(raw);

  await prisma.review.delete({
    where: { id: input.reviewId, userId },
  });

  return { success: true as const };
}

export async function toggleHelpful(raw: unknown) {
  const userId = await requireSession();
  const input = toggleHelpfulSchema.parse(raw);

  const existing = await prisma.reviewVote.findUnique({
    where: { userId_reviewId: { userId, reviewId: input.reviewId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reviewVote.delete({
        where: { userId_reviewId: { userId, reviewId: input.reviewId } },
      }),
      prisma.review.update({
        where: { id: input.reviewId },
        data: { helpfulCount: { decrement: 1 } },
      }),
    ]);
    return { success: true as const, voted: false };
  } else {
    await prisma.$transaction([
      prisma.reviewVote.create({
        data: { userId, reviewId: input.reviewId },
      }),
      prisma.review.update({
        where: { id: input.reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);
    return { success: true as const, voted: true };
  }
}
