import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { EditProfileModal } from "./edit-profile-modal";
import { ProfileTabs } from "./profile-tabs";
import { getPublicLibraryPreview } from "@/lib/services/library";
import { getUserReviews } from "@/lib/services/review";
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

  const [libraryPreview, reviews] = await Promise.all([
    getPublicLibraryPreview(user.id),
    getUserReviews(user.id),
  ]);

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

      <ProfileTabs
        isOwner={isOwner}
        username={user.username}
        displayName={user.displayName ?? user.username}
        libraryPreview={libraryPreview}
        reviews={reviews}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
