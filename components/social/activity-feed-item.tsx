import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeDate } from "@/lib/utils";
import { StarRating } from "@/components/game/star-rating";
import type { FeedEvent } from "@/lib/services/social";
import type {
  GameEventMetadata,
  ReviewEventMetadata,
  ThreadEventMetadata,
} from "@/types/activity";

interface ActivityFeedItemProps {
  event: FeedEvent;
}

function GameCover({ coverUrl, title, slug }: { coverUrl: string | null; title: string; slug: string }) {
  return (
    <Link href={`/games/${slug}`} className="flex-shrink-0">
      <div className="relative w-10 h-14 rounded overflow-hidden bg-bg-elevated border border-subtle">
        {coverUrl ? (
          <Image src={coverUrl} alt={title} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-text-tertiary text-[8px] text-center px-1 leading-tight">{title}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function ActivityFeedItem({ event }: ActivityFeedItemProps) {
  const { user, type, metadata, createdAt } = event;
  const displayName = user.displayName ?? user.username;

  if (!metadata) return null;

  if (
    type === "ADDED_GAME" ||
    type === "COMPLETED" ||
    type === "STARTED_PLAYING"
  ) {
    const m = metadata as GameEventMetadata;
    const verb =
      type === "COMPLETED"
        ? "completed"
        : type === "STARTED_PLAYING"
          ? "started playing"
          : "added to shelf";
    return (
      <div className="flex items-start gap-3 py-4 border-b border-subtle last:border-0">
        <Link href={`/users/${user.username}`}>
          <Avatar src={user.avatarUrl} name={displayName} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary">
            <Link href={`/users/${user.username}`} className="font-medium text-text-primary hover:text-accent transition-colors">
              {displayName}
            </Link>{" "}
            {verb}{" "}
            <Link href={`/games/${m.gameSlug}`} className="font-medium text-text-primary hover:text-accent transition-colors">
              {m.gameTitle}
            </Link>
          </p>
          <p className="text-xs text-text-tertiary font-mono mt-0.5">{formatRelativeDate(createdAt)}</p>
        </div>
        <GameCover coverUrl={m.gameCoverUrl} title={m.gameTitle} slug={m.gameSlug} />
      </div>
    );
  }

  if (type === "REVIEWED") {
    const m = metadata as ReviewEventMetadata;
    return (
      <div className="flex items-start gap-3 py-4 border-b border-subtle last:border-0">
        <Link href={`/users/${user.username}`}>
          <Avatar src={user.avatarUrl} name={displayName} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary">
            <Link href={`/users/${user.username}`} className="font-medium text-text-primary hover:text-accent transition-colors">
              {displayName}
            </Link>{" "}
            reviewed{" "}
            <Link href={`/games/${m.gameSlug}`} className="font-medium text-text-primary hover:text-accent transition-colors">
              {m.gameTitle}
            </Link>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={m.reviewRating} size="sm" />
            <span className="text-xs text-text-tertiary italic truncate">&ldquo;{m.reviewTitle}&rdquo;</span>
          </div>
          <p className="text-xs text-text-tertiary font-mono mt-0.5">{formatRelativeDate(createdAt)}</p>
        </div>
        <GameCover coverUrl={m.gameCoverUrl} title={m.gameTitle} slug={m.gameSlug} />
      </div>
    );
  }

  if (type === "THREAD_CREATED") {
    const m = metadata as ThreadEventMetadata;
    return (
      <div className="flex items-start gap-3 py-4 border-b border-subtle last:border-0">
        <Link href={`/users/${user.username}`}>
          <Avatar src={user.avatarUrl} name={displayName} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary">
            <Link href={`/users/${user.username}`} className="font-medium text-text-primary hover:text-accent transition-colors">
              {displayName}
            </Link>{" "}
            posted a thread in{" "}
            <Link href={`/forum/${m.categorySlug}`} className="font-medium hover:underline transition-colors" style={{ color: m.categoryColor }}>
              {m.categoryName}
            </Link>
          </p>
          <Link
            href={`/forum/threads/${m.threadSlug}`}
            className="text-sm font-medium text-text-primary hover:text-accent transition-colors mt-0.5 line-clamp-1 block"
          >
            {m.threadTitle}
          </Link>
          <p className="text-xs text-text-tertiary font-mono mt-0.5">{formatRelativeDate(createdAt)}</p>
        </div>
      </div>
    );
  }

  return null;
}
