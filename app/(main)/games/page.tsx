import { getBrowseGames, getAllGenres, getAllPlatforms } from "@/lib/services/game";
import { GameCard } from "@/components/game/game-card";
import Link from "next/link";

interface GamesPageProps {
  searchParams: Promise<{
    genre?: string;
    platform?: string;
    sort?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Browse Games — GameShelf",
  description: "Discover and explore games from our community library",
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 24;

  const [{ games, total }, genres, platforms] = await Promise.all([
    getBrowseGames({
      genreSlug: params.genre,
      platformSlug: params.platform,
      sort: params.sort,
      page: currentPage,
      perPage,
    }),
    getAllGenres(),
    getAllPlatforms(),
  ]);

  const totalPages = Math.ceil(total / perPage);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { genre: params.genre, platform: params.platform, sort: params.sort, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/games${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Browse Games</h1>
          <p className="text-text-secondary text-sm mt-1">{total} game{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/games/submit"
          className="text-sm bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Submit Game
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <select
          name="genre"
          defaultValue={params.genre ?? ""}
          className="bg-bg-surface border border-subtle text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          name="platform"
          defaultValue={params.platform ?? ""}
          className="bg-bg-surface border border-subtle text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">All Platforms</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          name="sort"
          defaultValue={params.sort ?? "newest"}
          className="bg-bg-surface border border-subtle text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="newest">Newest</option>
          <option value="rating">Top Rated</option>
          <option value="alpha">A–Z</option>
        </select>

        <button
          type="submit"
          className="bg-bg-surface border border-subtle text-text-secondary hover:text-text-primary text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Apply
        </button>

        {(params.genre || params.platform || params.sort) && (
          <Link
            href="/games"
            className="text-sm text-text-tertiary hover:text-text-secondary px-2 py-2 transition-colors"
          >
            Clear filters
          </Link>
        )}
      </form>

      {/* Game grid */}
      {games.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildUrl({ page: String(currentPage - 1) })}
                  className="px-4 py-2 text-sm bg-bg-surface border border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-text-tertiary text-sm font-mono">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: String(currentPage + 1) })}
                  className="px-4 py-2 text-sm bg-bg-surface border border-subtle rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-text-primary font-semibold text-lg mb-2">No games found</h2>
          <p className="text-text-secondary text-sm mb-6">
            {params.genre || params.platform
              ? "Try removing some filters, or add a new game."
              : "Be the first to add a game to GameShelf."}
          </p>
          <Link
            href="/games/submit"
            className="text-sm bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Submit a Game
          </Link>
        </div>
      )}
    </main>
  );
}
