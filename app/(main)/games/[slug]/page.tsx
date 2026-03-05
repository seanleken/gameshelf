import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameBySlug, persistRawgGame, type GameWithRelations } from "@/lib/services/game";
import { getRawgGameBySlug } from "@/lib/rawg";
import { getUserLibraryEntry } from "@/lib/services/library";
import { getGameReviews } from "@/lib/services/review";
import { getGameThreads } from "@/lib/services/forum";
import { StarRating } from "@/components/game/star-rating";
import { AddToShelfButton } from "@/components/game/add-to-shelf-button";
import { InlineRating } from "@/components/game/inline-rating";
import { GameTabs } from "@/components/game/game-tabs";
import { formatDate } from "@/lib/utils";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // ISR: revalidate game pages every hour

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game Not Found — GameShelf" };
  const description = game.description?.slice(0, 160) ?? `Track ${game.title} in your GameShelf library.`;
  return {
    title: `${game.title} — GameShelf`,
    description,
    openGraph: {
      title: game.title,
      description,
      images: game.coverUrl ? [{ url: game.coverUrl, width: 600, height: 800, alt: game.title }] : [],
      type: "website",
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;

  // 1. Try local DB first
  let game: GameWithRelations | null = await getGameBySlug(slug);

  // 2. If not found, fetch from RAWG and persist
  if (!game) {
    const rawgGame = await getRawgGameBySlug(slug).catch(() => null);
    if (rawgGame) {
      await persistRawgGame(rawgGame).catch(console.error);
      game = await getGameBySlug(rawgGame.slug ?? slug);
    }
  }

  if (!game) notFound();

  // 3. Fetch session-dependent data in parallel
  const session = await getServerSession(authOptions);
  const [libraryEntry, reviews, gameThreads] = await Promise.all([
    session?.user?.id ? getUserLibraryEntry(session.user.id, game.id) : null,
    getGameReviews(game.id),
    getGameThreads(game.id),
  ]);

  const genres = game.genres.map((gg) => gg.genre);
  const platforms = game.platforms.map((gp) => gp.platform);

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-8 mb-10">
        {/* Cover */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-[3/4] max-w-[280px] mx-auto lg:mx-0 rounded-card overflow-hidden bg-bg-elevated border border-subtle">
            {game.coverUrl ? (
              <Image
                src={game.coverUrl}
                alt={game.title}
                fill
                className="object-cover"
                sizes="280px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <span className="text-text-tertiary text-sm text-center">{game.title}</span>
              </div>
            )}
          </div>

          {/* Add to Shelf */}
          <div className="hidden lg:flex lg:flex-col gap-3">
            {session ? (
              <>
                <AddToShelfButton
                  gameId={game.id}
                  initialEntry={
                    libraryEntry
                      ? { id: libraryEntry.id, status: libraryEntry.status, rating: libraryEntry.rating }
                      : null
                  }
                />
                {libraryEntry && (
                  <InlineRating
                    gameId={game.id}
                    status={libraryEntry.status}
                    initialRating={libraryEntry.rating}
                  />
                )}
              </>
            ) : (
              <a
                href="/login"
                className="w-full text-center bg-accent/10 text-accent border border-accent/30 rounded-lg py-2.5 text-sm font-semibold hover:bg-accent/20 transition-colors"
              >
                Sign in to track
              </a>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">{game.title}</h1>
            {(game.developer || game.publisher) && (
              <p className="text-text-secondary text-sm mt-1">
                {game.developer && <span>{game.developer}</span>}
                {game.developer && game.publisher && game.developer !== game.publisher && (
                  <span className="text-text-tertiary"> · {game.publisher}</span>
                )}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            {game.avgRating > 0 ? (
              <>
                <StarRating rating={game.avgRating} size="lg" showValue />
                <span className="text-text-tertiary text-sm">
                  ({game.totalRatings} rating{game.totalRatings !== 1 ? "s" : ""})
                </span>
              </>
            ) : (
              <span className="text-text-tertiary text-sm">No ratings yet</span>
            )}
          </div>

          {/* Quick meta */}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {game.releaseDate && (
              <div>
                <dt className="text-text-tertiary text-xs font-mono uppercase tracking-wide">Released</dt>
                <dd className="text-text-primary text-sm mt-0.5">
                  {new Date(game.releaseDate).getFullYear()}
                </dd>
              </div>
            )}
            {game.developer && (
              <div>
                <dt className="text-text-tertiary text-xs font-mono uppercase tracking-wide">Developer</dt>
                <dd className="text-text-primary text-sm mt-0.5 truncate">{game.developer}</dd>
              </div>
            )}
            {game.publisher && game.publisher !== game.developer && (
              <div>
                <dt className="text-text-tertiary text-xs font-mono uppercase tracking-wide">Publisher</dt>
                <dd className="text-text-primary text-sm mt-0.5 truncate">{game.publisher}</dd>
              </div>
            )}
          </dl>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span
                  key={g.id}
                  className="text-xs bg-accent-muted text-accent px-2.5 py-1 rounded-full border border-accent/20"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span
                  key={p.id}
                  className="text-xs bg-bg-elevated text-text-secondary px-2.5 py-1 rounded-full border border-subtle"
                >
                  {p.abbreviation ?? p.name}
                </span>
              ))}
            </div>
          )}

          {/* Description excerpt (mobile only — full shown in About tab) */}
          {game.description && (
            <p className="text-text-secondary text-sm leading-relaxed line-clamp-4 lg:hidden">
              {game.description}
            </p>
          )}
        </div>
      </div>

      <GameTabs
        gameId={game.id}
        reviews={reviews}
        gameThreads={gameThreads}
        currentUserId={session?.user?.id}
        about={
          game.description ? (
            <div className="space-y-6">
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                {game.description}
              </p>
              <div className="border-t border-subtle pt-6">
                <h2 className="text-text-primary font-semibold mb-4">Details</h2>
                <dl className="grid grid-cols-2 gap-y-3">
                  {game.releaseDate && (
                    <>
                      <dt className="text-text-tertiary text-sm">Release Date</dt>
                      <dd className="text-text-primary text-sm">{formatDate(game.releaseDate)}</dd>
                    </>
                  )}
                  {game.developer && (
                    <>
                      <dt className="text-text-tertiary text-sm">Developer</dt>
                      <dd className="text-text-primary text-sm">{game.developer}</dd>
                    </>
                  )}
                  {game.publisher && (
                    <>
                      <dt className="text-text-tertiary text-sm">Publisher</dt>
                      <dd className="text-text-primary text-sm">{game.publisher}</dd>
                    </>
                  )}
                  {genres.length > 0 && (
                    <>
                      <dt className="text-text-tertiary text-sm">Genres</dt>
                      <dd className="text-text-primary text-sm">{genres.map((g) => g.name).join(", ")}</dd>
                    </>
                  )}
                  {platforms.length > 0 && (
                    <>
                      <dt className="text-text-tertiary text-sm">Platforms</dt>
                      <dd className="text-text-primary text-sm">{platforms.map((p) => p.name).join(", ")}</dd>
                    </>
                  )}
                  {game.isUserSubmitted && (
                    <>
                      <dt className="text-text-tertiary text-sm">Source</dt>
                      <dd className="text-text-secondary text-sm">Community submission</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          ) : (
            <p className="text-text-tertiary text-sm">No description available.</p>
          )
        }
      />
    </main>
  );
}
