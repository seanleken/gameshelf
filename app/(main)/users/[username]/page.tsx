import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { EditProfileModal } from "./edit-profile-modal";
import { getPublicLibraryPreview } from "@/lib/services/library";
import { StarRating } from "@/components/game/star-rating";
import type { Metadata } from "next";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.username };
}

export default async function UserProfilePage({ params }: Props) {
  const [user, session] = await Promise.all([
    prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;
  const libraryPreview = await getPublicLibraryPreview(user.id);

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-5">
        <Avatar src={user.avatarUrl} name={user.displayName ?? user.username} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary truncate">
              {user.displayName ?? user.username}
            </h1>
            {isOwner && <EditProfileModal user={user} />}
          </div>
          <p className="text-text-secondary mt-0.5">@{user.username}</p>
          {user.bio && (
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {user.bio}
            </p>
          )}
          <p className="mt-3 text-xs text-text-tertiary font-mono">
            Joined {formatDate(user.createdAt, { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Library preview */}
      <div className="mt-10 border-t border-subtle pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold">
            {isOwner ? "My Shelf" : `${user.displayName ?? user.username}'s Shelf`}
          </h2>
          {isOwner && (
            <Link href="/library" className="text-sm text-accent hover:text-accent-hover transition-colors">
              View all →
            </Link>
          )}
        </div>

        {libraryPreview.length === 0 ? (
          <p className="text-text-tertiary text-sm">
            {isOwner ? "Your shelf is empty. Browse games to start tracking!" : "No games on shelf yet."}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {libraryPreview.map((entry) => (
              <Link
                key={entry.id}
                href={`/games/${entry.game.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-bg-elevated border border-subtle group-hover:border-accent/30 transition-colors">
                  {entry.game.coverUrl ? (
                    <Image
                      src={entry.game.coverUrl}
                      alt={entry.game.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <span className="text-text-tertiary text-[10px] text-center">{entry.game.title}</span>
                    </div>
                  )}
                </div>
                {entry.rating && (
                  <div className="mt-1.5">
                    <StarRating rating={entry.rating} size="sm" showValue={false} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
