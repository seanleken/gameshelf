import { prisma } from "@/lib/prisma";
import type { ActivityEventType, Prisma } from "@prisma/client";

export async function recordActivity({
  userId,
  type,
  targetId,
  targetType,
  metadata,
}: {
  userId: string;
  type: ActivityEventType;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.activityEvent.create({
      data: { userId, type, targetId, targetType, metadata: (metadata ?? {}) as Prisma.InputJsonValue },
    });
  } catch {
    // Activity recording must never block the main action
  }
}
