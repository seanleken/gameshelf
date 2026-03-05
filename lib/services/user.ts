import { prisma } from "@/lib/prisma";

export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}
