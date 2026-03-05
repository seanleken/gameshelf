import { prisma } from "@/lib/prisma";
import type { ActivityEventType } from "@/types/activity";

export type FeedEvent = {
  id: string;
  type: ActivityEventType;
  targetId: string;
  targetType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

function toFeedEvent(e: {
  id: string;
  type: string;
  targetId: string;
  targetType: string;
  metadata: unknown;
  createdAt: Date;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}): FeedEvent {
  return {
    ...e,
    type: e.type as ActivityEventType,
    metadata: (e.metadata as Record<string, unknown>) ?? null,
  };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { followerId: true },
  });
  return !!follow;
}

export async function getFollowCounts(
  userId: string,
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

export async function getFollowerFeed(userId: string, limit = 50): Promise<FeedEvent[]> {
  const followedIds = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  if (followedIds.length === 0) return [];

  const events = await prisma.activityEvent.findMany({
    where: { userId: { in: followedIds.map((f) => f.followingId) } },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map(toFeedEvent);
}

export async function getUserActivity(userId: string, limit = 20): Promise<FeedEvent[]> {
  const events = await prisma.activityEvent.findMany({
    where: { userId },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map(toFeedEvent);
}

export async function getGlobalActivity(limit = 20): Promise<FeedEvent[]> {
  const events = await prisma.activityEvent.findMany({
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map(toFeedEvent);
}
