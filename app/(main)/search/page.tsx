import Link from "next/link";
import Image from "next/image";
import { searchLocalGames } from "@/lib/services/game";
import { searchUsers } from "@/lib/services/user";
import { searchThreads } from "@/lib/services/forum";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/game/star-rating";
import { formatRelativeDate } from "@/lib/utils";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — Search — GameShelf` : "Search — GameShelf" };
}

const TABS = ["games", "users", "threads"] as const;
type SearchTab = (typeof TABS)[number];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", tab: tabParam } = await searchParams;
  const activeTab: SearchTab = TABS.includes(tabParam as SearchTab)
    ? (tabParam as SearchTab)
    : "games";
  const query = q.trim();

  const [games, users, threads] = await Promise.all([
    query ? searchLocalGames(query, 12) : Promise.resolve([]),
    query ? searchUsers(query, 12) : Promise.resolve([]),
    query ? searchThreads(query, 12) : Promise.resolve([]),
  ]);

  function tabUrl(tab: SearchTab) {
    return `/search?${new URLSearchParams({ q, tab }).toString()}`;
  }

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Search</h1>

      <form action="/search" className="mb-8">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search games, users, forums…"
          autoFocus
          className="w-full max-w-xl bg-bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-colors"
        />
      </form>

      {query ? (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-subtle mb-6">
            {TABS.map((tab) => {
              const count =
                tab === "games" ? games.length : tab === "users" ? users.length : threads.length;
              return (
                <Link
                  key={tab}
                  href={tabUrl(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? "border-accent text-accent"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 text-xs font-mono ${activeTab === tab ? "text-accent/70" : "text-text-tertiary"}`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Games */}
          {activeTab === "games" && (
            <div>
              {games.length === 0 ? (
                <p className="text-text-tertiary text-sm">No games found for &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {games.map((game) => (
                    <Link
                      key={game.slug}
                      href={`/games/${game.slug}`}
                      className="group block bg-bg-surface rounded-card border border-subtle hover:bg-bg-surface-hover hover:border-accent/30 transition-all"
                    >
                      <div className="relative aspect-[3/4] w-full rounded-t-card overflow-hidden bg-bg-elevated">
                        {game.coverUrl ? (
                          <Image
                            src={game.coverUrl}
                            alt={game.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-150"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <span className="text-text-tertiary text-xs text-center leading-tight">
                              {game.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-text-primary text-xs font-medium leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                          {game.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div>
              {users.length === 0 ? (
                <p className="text-text-tertiary text-sm">No users found for &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.username}`}
                      className="flex items-center gap-4 p-4 bg-bg-surface border border-subtle rounded-card hover:bg-bg-surface-hover hover:border-accent/30 transition-all"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        name={user.displayName ?? user.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium text-sm">
                          {user.displayName ?? user.username}
                        </p>
                        <p className="text-text-tertiary text-xs font-mono">@{user.username}</p>
                        {user.bio && (
                          <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Threads */}
          {activeTab === "threads" && (
            <div>
              {threads.length === 0 ? (
                <p className="text-text-tertiary text-sm">
                  No threads found for &ldquo;{query}&rdquo;.
                </p>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/forum/threads/${thread.slug}`}
                      className="block p-4 bg-bg-surface border border-subtle rounded-card hover:bg-bg-surface-hover hover:border-accent/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-text-primary font-medium text-sm leading-snug line-clamp-2">
                            {thread.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className="text-xs font-medium"
                              style={{ color: thread.category.color }}
                            >
                              {thread.category.name}
                            </span>
                            <span className="text-text-tertiary text-xs">·</span>
                            <span className="text-text-tertiary text-xs font-mono">
                              {thread._count.replies} replies
                            </span>
                            <span className="text-text-tertiary text-xs">·</span>
                            <span className="text-text-tertiary text-xs font-mono">
                              {formatRelativeDate(thread.lastReplyAt)}
                            </span>
                          </div>
                        </div>
                        {thread.game?.coverUrl && (
                          <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden bg-bg-elevated">
                            <Image
                              src={thread.game.coverUrl}
                              alt={thread.game.title}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-text-tertiary text-sm">Enter a search term above to get started.</p>
      )}
    </main>
  );
}
