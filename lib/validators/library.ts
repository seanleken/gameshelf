import { z } from "zod";
import { LibraryStatus } from "@prisma/client";

export const libraryStatusValues = [
  LibraryStatus.PLAYING,
  LibraryStatus.COMPLETED,
  LibraryStatus.BACKLOG,
  LibraryStatus.DROPPED,
  LibraryStatus.WISHLIST,
] as const;

export const upsertLibraryEntrySchema = z.object({
  gameId: z.string().min(1),
  status: z.nativeEnum(LibraryStatus),
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .multipleOf(0.5)
    .nullable()
    .optional(),
});

export const deleteLibraryEntrySchema = z.object({
  gameId: z.string().min(1),
});

export type UpsertLibraryEntryInput = z.infer<typeof upsertLibraryEntrySchema>;
