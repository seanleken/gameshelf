import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getThreadBySlug, getThreadReplies } from "@/lib/services/forum";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { ReplyTree } from "@/components/forum/reply-tree";
import { ThreadViewCounter } from "@/components/forum/thread-view-counter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const thread = await getThreadBySlug(slug);
  return {
    title: thread ? `${thread.title} — GameShelf Forums` : "Thread — GameShelf",
  };
}

export default async function ThreadDetailPage({ params }: Props) {
  const { slug } = await params;

  const [thread, session] = await Promise.all([
    getThreadBySlug(slug),
    getServerSession(authOptions),
  ]);

  if (!thread) notFound();

  const replies = await getThreadReplies(thread.id);

  const displayName = thread.author.displayName ?? thread.author.username;
  const isThreadAuthor = session?.user?.id === thread.author.id;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Fire-and-forget view counter */}
      <ThreadViewCounter threadId={thread.id} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-6 font-mono">
        <Link href="/forum" className="hover:text-text-secondary transition-colors">
          Forums
        </Link>
        <span>/</span>
        <Link
          href={`/forum/${thread.category.slug}`}
          className="hover:text-text-secondary transition-colors"
          style={{ color: thread.category.color }}
        >
          {thread.category.name}
        </Link>
        <span>/</span>
        <span className="text-text-secondary truncate max-w-[200px]">{thread.title}</span>
      </nav>

      {/* Thread header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-text-primary leading-snug">{thread.title}</h1>

        {thread.game && (
          <Link
            href={`/games/${thread.game.slug}`}
            className="inline-flex items-center gap-2 mt-2 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            <span className="text-text-tertiary">related to</span>
            {thread.game.title}
          </Link>
        )}
      </div>

      {/* Original post */}
      <article className="bg-bg-surface border border-subtle rounded-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/users/${thread.author.username}`}>
            <Avatar src={thread.author.avatarUrl} name={displayName} size="md" />
          </Link>
          <div>
            <Link
              href={`/users/${thread.author.username}`}
              className="text-sm font-medium text-text-primary hover:text-accent transition-colors"
            >
              {displayName}
            </Link>
            <p className="text-xs text-text-tertiary font-mono">
              {formatDate(thread.createdAt)} · {thread.viewCount} views
              {thread.updatedAt > thread.createdAt && " · edited"}
            </p>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:text-accent [&_code]:bg-bg-primary [&_code]:px-1 [&_code]:rounded [&_pre]:bg-bg-primary [&_pre]:rounded-lg [&_pre]:p-4 [&_h1]:text-text-primary [&_h2]:text-text-primary [&_h3]:text-text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.body}</ReactMarkdown>
        </div>
      </article>

      {/* Replies */}
      <ReplyTree
        initialReplies={replies}
        threadId={thread.id}
        currentUserId={session?.user?.id}
        isThreadAuthor={isThreadAuthor}
      />
    </div>
  );
}
