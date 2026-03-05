"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function toggleFollow(
  followingId: string,
): Promise<{ success: true; following: boolean }> {
  const followerId = await requireSession();

  if (followerId === followingId) throw new Error("Cannot follow yourself");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { followerId: true },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
        return { success: true, following: false };
  } else {
    await prisma.follow.create({ data: { followerId, followingId } });
        return { success: true, following: true };
  }
}
