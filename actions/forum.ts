"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  createThreadSchema,
  updateThreadSchema,
  deleteThreadSchema,
  createReplySchema,
  updateReplySchema,
  deleteReplySchema,
  toggleReplyHelpfulSchema,
  markAcceptedSchema,
} from "@/lib/validators/forum";
import { getThreadReplies, type ReplyWithAuthor } from "@/lib/services/forum";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// Generate a unique slug from a title
async function generateThreadSlug(title: string): Promise<string> {
  const base = slugify(title);
  // Check if base slug exists
  const existing = await prisma.forumThread.findUnique({ where: { slug: base } });
  if (!existing) return base;
  // Append a short random suffix
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function createThread(raw: unknown) {
  const userId = await requireSession();
  const input = createThreadSchema.parse(raw);

  const slug = await generateThreadSlug(input.title);

  const thread = await prisma.forumThread.create({
    data: {
      title: input.title,
      slug,
      body: input.body,
      authorId: userId,
      categoryId: input.categoryId,
      gameId: input.gameId ?? null,
      tags: input.tags,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      game: { select: { id: true, title: true, slug: true, coverUrl: true } },
      _count: { select: { replies: true } },
    },
  });

  revalidatePath(`/forum/${thread.category.slug}`);
  return { success: true as const, thread };
}

export async function updateThread(raw: unknown) {
  const userId = await requireSession();
  const input = updateThreadSchema.parse(raw);

  const thread = await prisma.forumThread.findUnique({ where: { id: input.threadId } });
  if (!thread) throw new Error("Thread not found");

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } }))
        ?.isAdmin
    : false;

  if (thread.authorId !== userId && !isAdmin) throw new Error("Forbidden");

  const updated = await prisma.forumThread.update({
    where: { id: input.threadId },
    data: {
      title: input.title,
      body: input.body,
      tags: input.tags,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      game: { select: { id: true, title: true, slug: true, coverUrl: true } },
      _count: { select: { replies: true } },
    },
  });

  revalidatePath(`/forum/threads/${updated.slug}`);
  return { success: true as const, thread: updated };
}

export async function deleteThread(raw: unknown) {
  const userId = await requireSession();
  const input = deleteThreadSchema.parse(raw);

  const thread = await prisma.forumThread.findUnique({
    where: { id: input.threadId },
    include: { category: { select: { slug: true } } },
  });
  if (!thread) throw new Error("Thread not found");

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } }))
        ?.isAdmin
    : false;

  if (thread.authorId !== userId && !isAdmin) throw new Error("Forbidden");

  await prisma.forumThread.delete({ where: { id: input.threadId } });

  revalidatePath(`/forum/${thread.category.slug}`);
  return { success: true as const };
}

export async function createReply(raw: unknown): Promise<{ success: true; reply: ReplyWithAuthor }> {
  const userId = await requireSession();
  const input = createReplySchema.parse(raw);

  const thread = await prisma.forumThread.findUnique({ where: { id: input.threadId } });
  if (!thread) throw new Error("Thread not found");
  if (thread.isLocked) throw new Error("This thread is locked");

  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.forumReply.create({
      data: {
        body: input.body,
        authorId: userId,
        threadId: input.threadId,
        parentId: input.parentId ?? null,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        votes: { select: { userId: true } },
      },
    });

    await tx.forumThread.update({
      where: { id: input.threadId },
      data: { lastReplyAt: new Date() },
    });

    return created;
  });

  revalidatePath(`/forum/threads/${thread.slug}`);
  return { success: true as const, reply };
}

export async function updateReply(raw: unknown): Promise<{ success: true; reply: ReplyWithAuthor }> {
  const userId = await requireSession();
  const input = updateReplySchema.parse(raw);

  const reply = await prisma.forumReply.findUnique({ where: { id: input.replyId } });
  if (!reply) throw new Error("Reply not found");
  if (reply.authorId !== userId) throw new Error("Forbidden");

  const updated = await prisma.forumReply.update({
    where: { id: input.replyId },
    data: { body: input.body },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      votes: { select: { userId: true } },
    },
  });

  const thread = await prisma.forumThread.findUnique({ where: { id: reply.threadId } });
  if (thread) revalidatePath(`/forum/threads/${thread.slug}`);

  return { success: true as const, reply: updated };
}

export async function deleteReply(raw: unknown) {
  const userId = await requireSession();
  const input = deleteReplySchema.parse(raw);

  const reply = await prisma.forumReply.findUnique({
    where: { id: input.replyId },
    include: { thread: { select: { slug: true, authorId: true } } },
  });
  if (!reply) throw new Error("Reply not found");

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } }))
        ?.isAdmin
    : false;

  if (reply.authorId !== userId && !isAdmin) throw new Error("Forbidden");

  await prisma.forumReply.delete({ where: { id: input.replyId } });

  revalidatePath(`/forum/threads/${reply.thread.slug}`);
  return { success: true as const };
}

export async function toggleReplyHelpful(raw: unknown) {
  const userId = await requireSession();
  const input = toggleReplyHelpfulSchema.parse(raw);

  const reply = await prisma.forumReply.findUnique({ where: { id: input.replyId } });
  if (!reply) throw new Error("Reply not found");
  if (reply.authorId === userId) throw new Error("Cannot vote on your own reply");

  const existing = await prisma.replyVote.findUnique({
    where: { userId_replyId: { userId, replyId: input.replyId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.replyVote.delete({ where: { userId_replyId: { userId, replyId: input.replyId } } }),
      prisma.forumReply.update({
        where: { id: input.replyId },
        data: { helpfulCount: { decrement: 1 } },
      }),
    ]);
    return { success: true as const, voted: false };
  } else {
    await prisma.$transaction([
      prisma.replyVote.create({ data: { userId, replyId: input.replyId } }),
      prisma.forumReply.update({
        where: { id: input.replyId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);
    return { success: true as const, voted: true };
  }
}

export async function markAcceptedAnswer(raw: unknown) {
  const userId = await requireSession();
  const input = markAcceptedSchema.parse(raw);

  const thread = await prisma.forumThread.findUnique({ where: { id: input.threadId } });
  if (!thread) throw new Error("Thread not found");
  if (thread.authorId !== userId) throw new Error("Only the thread author can mark accepted answers");

  const reply = await prisma.forumReply.findUnique({ where: { id: input.replyId } });
  if (!reply || reply.threadId !== input.threadId) throw new Error("Reply not found");

  const isCurrentlyAccepted = reply.isAcceptedAnswer;

  await prisma.$transaction(async (tx) => {
    // Unmark any existing accepted answer in this thread
    await tx.forumReply.updateMany({
      where: { threadId: input.threadId, isAcceptedAnswer: true },
      data: { isAcceptedAnswer: false },
    });

    // Toggle: if it was accepted, it's now unaccepted; otherwise mark it accepted
    if (!isCurrentlyAccepted) {
      await tx.forumReply.update({
        where: { id: input.replyId },
        data: { isAcceptedAnswer: true },
      });
    }
  });

  revalidatePath(`/forum/threads/${thread.slug}`);
  return { success: true as const, accepted: !isCurrentlyAccepted };
}

export async function incrementThreadViews(threadId: string) {
  try {
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // Fire-and-forget, silently ignore errors
  }
}

export { getThreadReplies };
