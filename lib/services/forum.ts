import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const threadAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

const threadInclude = {
  author: { select: threadAuthorSelect },
  category: { select: { id: true, name: true, slug: true, color: true } },
  game: { select: { id: true, title: true, slug: true, coverUrl: true } },
  _count: { select: { replies: true } },
} as const;

const replyInclude = {
  author: { select: threadAuthorSelect },
  votes: { select: { userId: true } },
} as const;

export type ThreadWithMeta = Prisma.ForumThreadGetPayload<{
  include: typeof threadInclude;
}>;

export type ReplyWithAuthor = Prisma.ForumReplyGetPayload<{
  include: typeof replyInclude;
}>;

export type CategoryWithCount = Prisma.ForumCategoryGetPayload<{
  include: { _count: { select: { threads: true } } };
}>;

export async function getForumCategories(): Promise<CategoryWithCount[]> {
  return prisma.forumCategory.findMany({
    include: {
      _count: { select: { threads: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.forumCategory.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, color: true, description: true },
  });
}

export type ThreadSort = "latest" | "newest" | "popular";

export async function getThreadsByCategory(
  categorySlug: string,
  sort: ThreadSort = "latest",
  page = 1,
  perPage = 20,
): Promise<{ threads: ThreadWithMeta[]; total: number }> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { threads: [], total: 0 };

  const orderBy: Prisma.ForumThreadOrderByWithRelationInput[] =
    sort === "latest"
      ? [{ isPinned: "desc" }, { lastReplyAt: "desc" }]
      : sort === "newest"
        ? [{ isPinned: "desc" }, { createdAt: "desc" }]
        : [{ isPinned: "desc" }, { viewCount: "desc" }];

  const [threads, total] = await prisma.$transaction([
    prisma.forumThread.findMany({
      where: { categoryId: category.id },
      include: threadInclude,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.forumThread.count({ where: { categoryId: category.id } }),
  ]);

  return { threads, total };
}

export async function getThreadBySlug(slug: string): Promise<ThreadWithMeta | null> {
  return prisma.forumThread.findUnique({
    where: { slug },
    include: threadInclude,
  });
}

export async function getThreadReplies(threadId: string): Promise<ReplyWithAuthor[]> {
  return prisma.forumReply.findMany({
    where: { threadId },
    include: replyInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getGameThreads(gameId: string, limit = 5): Promise<ThreadWithMeta[]> {
  return prisma.forumThread.findMany({
    where: { gameId },
    include: threadInclude,
    orderBy: { lastReplyAt: "desc" },
    take: limit,
  });
}
