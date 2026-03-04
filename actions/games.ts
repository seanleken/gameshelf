"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { manualGameSubmitSchema } from "@/lib/validators/game";

export async function createManualGame(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "You must be logged in to submit a game." };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    coverUrl: (formData.get("coverUrl") as string) || undefined,
    developer: (formData.get("developer") as string) || undefined,
    publisher: (formData.get("publisher") as string) || undefined,
    releaseDate: (formData.get("releaseDate") as string) || undefined,
    genreIds: formData.getAll("genreIds") as string[],
    platformIds: formData.getAll("platformIds") as string[],
  };

  const parsed = manualGameSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Generate unique slug
  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.game.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const releaseDate = data.releaseDate ? new Date(data.releaseDate) : null;
  const coverUrl = data.coverUrl || null;

  await prisma.game.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      coverUrl,
      developer: data.developer ?? null,
      publisher: data.publisher ?? null,
      releaseDate,
      isUserSubmitted: true,
      genres: data.genreIds?.length
        ? { create: data.genreIds.map((id) => ({ genreId: id })) }
        : undefined,
      platforms: data.platformIds?.length
        ? { create: data.platformIds.map((id) => ({ platformId: id })) }
        : undefined,
    },
  });

  redirect(`/games/${slug}`);
}
