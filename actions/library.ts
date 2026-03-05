"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertLibraryEntrySchema,
  deleteLibraryEntrySchema,
} from "@/lib/validators/library";
import { recordActivity } from "@/lib/services/activity";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

/** Recalculates and persists avgRating / totalRatings for a game inside a transaction. */
async function recalcGameRating(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], gameId: string) {
  const agg = await tx.libraryEntry.aggregate({
    where: { gameId, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await tx.game.update({
    where: { id: gameId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      totalRatings: agg._count.rating,
    },
  });
}

export async function upsertLibraryEntry(raw: unknown) {
  const userId = await requireSession();
  const input = upsertLibraryEntrySchema.parse(raw);

  const [existing, game] = await Promise.all([
    prisma.libraryEntry.findUnique({
      where: { userId_gameId: { userId, gameId: input.gameId } },
      select: { status: true },
    }),
    prisma.game.findUnique({
      where: { id: input.gameId },
      select: { title: true, slug: true, coverUrl: true },
    }),
  ]);

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.libraryEntry.upsert({
      where: { userId_gameId: { userId, gameId: input.gameId } },
      create: {
        userId,
        gameId: input.gameId,
        status: input.status,
        rating: input.rating ?? null,
      },
      update: {
        status: input.status,
        ...(input.rating !== undefined && { rating: input.rating }),
      },
    });

    await recalcGameRating(tx, input.gameId);
    return entry;
  });

  if (game) {
    const gameMeta = {
      gameId: input.gameId,
      gameTitle: game.title,
      gameSlug: game.slug,
      gameCoverUrl: game.coverUrl,
    };
    if (!existing) {
      await recordActivity({ userId, type: "ADDED_GAME", targetId: input.gameId, targetType: "game", metadata: gameMeta });
    } else if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
      await recordActivity({ userId, type: "COMPLETED", targetId: input.gameId, targetType: "game", metadata: gameMeta });
    } else if (input.status === "PLAYING" && existing.status !== "PLAYING") {
      await recordActivity({ userId, type: "STARTED_PLAYING", targetId: input.gameId, targetType: "game", metadata: gameMeta });
    }
  }

  revalidatePath(`/library`);
  revalidatePath(`/games`);
  return { success: true, entry: result };
}

export async function updateLibraryRating(raw: unknown) {
  const userId = await requireSession();
  const input = upsertLibraryEntrySchema.parse(raw);

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.libraryEntry.update({
      where: { userId_gameId: { userId, gameId: input.gameId } },
      data: { rating: input.rating ?? null },
    });

    await recalcGameRating(tx, input.gameId);
    return entry;
  });

  revalidatePath(`/library`);
  revalidatePath(`/games`);
  return { success: true, entry: result };
}

export async function deleteLibraryEntry(raw: unknown) {
  const userId = await requireSession();
  const input = deleteLibraryEntrySchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    await tx.libraryEntry.delete({
      where: { userId_gameId: { userId, gameId: input.gameId } },
    });

    await recalcGameRating(tx, input.gameId);
  });

  revalidatePath(`/library`);
  revalidatePath(`/games`);
  return { success: true };
}
