import Link from "next/link";
import Image from "next/image";
import { getTrendingGames, getTopRatedGames } from "@/lib/services/game";
import { getGlobalActivity } from "@/lib/services/social";
import { ActivityFeedItem } from "@/components/social/activity-feed-item";
import { StarRating } from "@/components/game/star-rating";
import type { GameSearchResult } from "@/lib/services/game";

function GameRow({ game }: { game: GameSearchResult }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex-shrink-0 w-28 sm:w-32"
    >
      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-bg-elevated border border-subtle group-hover:border-accent/30 transition-colors">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-150"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2">
            <span className="text-text-tertiary text-[10px] text-center leading-tight">{game.title}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-text-secondary font-medium line-clamp-1 group-hover:text-accent transition-colors">
        {game.title}
      </p>
    </Link>
  );
}

export default async function HomePage() {
  const [trending, topRated, recentActivity] = await Promise.all([
    getTrendingGames(10),
    getTopRatedGames(10),
    getGlobalActivity(10),
  ]);

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="mb-4 text-4xl font-bold text-text-primary">
          Welcome to GameShelf
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Track your games, share reviews, and connect with other gamers.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/games"
            className="bg-accent text-bg-primary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Browse Games
          </Link>
          <Link
            href="/forum"
            className="bg-bg-surface border border-subtle text-text-secondary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-bg-surface-hover transition-colors"
          >
            Community Forums
          </Link>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Trending</h2>
            <Link href="/games" className="text-sm text-accent hover:text-accent-hover transition-colors">
              Browse all →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {trending.map((game) => (
              <GameRow key={game.slug} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Top Rated</h2>
            <Link href="/games?sort=rating" className="text-sm text-accent hover:text-accent-hover transition-colors">
              See more →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {topRated.map((game) => (
              <div key={game.slug} className="flex-shrink-0 w-28 sm:w-32">
                <Link href={`/games/${game.slug}`} className="group block">
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-bg-elevated border border-subtle group-hover:border-accent/30 transition-colors">
                    {game.coverUrl ? (
                      <Image
                        src={game.coverUrl}
                        alt={game.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-150"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <span className="text-text-tertiary text-[10px] text-center leading-tight">{game.title}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary font-medium line-clamp-1 group-hover:text-accent transition-colors">
                    {game.title}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community Activity */}
      {recentActivity.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Community Activity</h2>
            <Link href="/feed" className="text-sm text-accent hover:text-accent-hover transition-colors">
              Your feed →
            </Link>
          </div>
          <div className="bg-bg-surface border border-subtle rounded-card px-4">
            {recentActivity.map((event) => (
              <ActivityFeedItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
