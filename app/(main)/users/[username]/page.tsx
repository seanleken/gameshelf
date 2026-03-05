import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByUsername } from "@/lib/services/user";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { EditProfileModal } from "./edit-profile-modal";
import { ProfileTabs } from "./profile-tabs";
import { getPublicLibraryPreview } from "@/lib/services/library";
import { getUserReviews } from "@/lib/services/review";
import { isFollowing, getFollowCounts, getUserActivity } from "@/lib/services/social";
import { FollowButton } from "@/components/social/follow-button";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const [user, session] = await Promise.all([
    getUserByUsername(username),
    getServerSession(authOptions),
  ]);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;

  const [libraryPreview, reviews, followCounts, activity, following] = await Promise.all([
    getPublicLibraryPreview(user.id),
    getUserReviews(user.id),
    getFollowCounts(user.id),
    getUserActivity(user.id),
    session?.user?.id && !isOwner ? isFollowing(session.user.id, user.id) : Promise.resolve(false),
  ]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-5">
        <Avatar src={user.avatarUrl} name={user.displayName ?? user.username} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary truncate">
              {user.displayName ?? user.username}
            </h1>
            {isOwner && <EditProfileModal user={user} />}
            {!isOwner && session?.user && (
              <FollowButton followingId={user.id} initialFollowing={following} />
            )}
          </div>
          <p className="text-text-secondary mt-0.5">@{user.username}</p>
          {user.bio && (
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {user.bio}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary font-mono">
            <span>
              <span className="text-text-secondary font-medium">{followCounts.followers}</span>{" "}
              followers
            </span>
            <span>
              <span className="text-text-secondary font-medium">{followCounts.following}</span>{" "}
              following
            </span>
            <span>Joined {formatDate(user.createdAt, { month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      <ProfileTabs
        isOwner={isOwner}
        displayName={user.displayName ?? user.username}
        libraryPreview={libraryPreview}
        reviews={reviews}
        activity={activity}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
