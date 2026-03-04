import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./star-rating";

interface GameCardProps {
  game: {
    title: string;
    slug: string;
    coverUrl: string | null;
    avgRating: number;
    genres: { genre: { name: string } }[];
  };
}

export function GameCard({ game }: GameCardProps) {
  const visibleGenres = game.genres.slice(0, 2);
  const extraGenres = game.genres.length - 2;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block bg-bg-surface rounded-card border border-subtle overflow-hidden transition-all duration-150 hover:bg-bg-surface-hover hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] bg-bg-elevated w-full overflow-hidden">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-150 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-text-tertiary text-sm text-center px-2">{game.title}</span>
          </div>
        )}
        {/* Rating badge */}
        {game.avgRating > 0 && (
          <div className="absolute top-2 right-2 bg-bg-primary/90 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-accent" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-text-primary font-mono text-xs font-medium">
              {game.avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-text-primary font-semibold text-sm leading-tight line-clamp-2 mb-2">
          {game.title}
        </h3>
        {visibleGenres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleGenres.map((gg) => (
              <span
                key={gg.genre.name}
                className="text-xs bg-accent-muted text-accent px-1.5 py-0.5 rounded"
              >
                {gg.genre.name}
              </span>
            ))}
            {extraGenres > 0 && (
              <span className="text-xs text-text-tertiary px-1 py-0.5">+{extraGenres}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
