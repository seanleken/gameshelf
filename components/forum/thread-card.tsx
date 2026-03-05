import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeDate } from "@/lib/utils";
import type { ThreadWithMeta } from "@/lib/services/forum";

interface ThreadCardProps {
  thread: ThreadWithMeta;
  showCategory?: boolean;
}

export function ThreadCard({ thread, showCategory = false }: ThreadCardProps) {
  const displayName = thread.author.displayName ?? thread.author.username;

  return (
    <article className="bg-bg-surface border border-subtle rounded-card p-5 hover:bg-bg-surface-hover transition-colors">
      <div className="flex items-start gap-4">
        <Link href={`/users/${thread.author.username}`} className="flex-shrink-0">
          <Avatar src={thread.author.avatarUrl} name={displayName} size="md" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {thread.isPinned && (
              <span className="text-xs font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="text-xs font-mono font-medium text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                locked
              </span>
            )}
            {showCategory && (
              <Link
                href={`/forum/${thread.category.slug}`}
                className="text-xs font-mono font-medium px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
                style={{
                  color: thread.category.color,
                  backgroundColor: `${thread.category.color}1a`,
                }}
              >
                {thread.category.name}
              </Link>
            )}
          </div>

          <Link href={`/forum/threads/${thread.slug}`}>
            <h3 className="text-text-primary font-semibold hover:text-accent transition-colors leading-snug">
              {thread.title}
            </h3>
          </Link>

          {thread.game && (
            <Link
              href={`/games/${thread.game.slug}`}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-1 inline-block"
            >
              re: {thread.game.title}
            </Link>
          )}

          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary font-mono">
            <Link
              href={`/users/${thread.author.username}`}
              className="hover:text-text-secondary transition-colors"
            >
              {displayName}
            </Link>
            <span>{formatRelativeDate(thread.createdAt)}</span>
            <span>{thread._count.replies} {thread._count.replies === 1 ? "reply" : "replies"}</span>
            <span>{thread.viewCount} views</span>
          </div>
        </div>
      </div>
    </article>
  );
}
