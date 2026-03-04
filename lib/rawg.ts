/**
 * RAWG API service module.
 * Authentication: simple API key as query parameter.
 * Docs: https://rawg.io/apidocs
 * Free tier: 20,000 requests/month.
 */

const RAWG_BASE = "https://api.rawg.io/api";

function apiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY must be set");
  return key;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawgGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RawgPlatformEntry {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RawgDeveloper {
  id: number;
  name: string;
  slug: string;
}

export interface RawgPublisher {
  id: number;
  name: string;
  slug: string;
}

/** Shape returned by the list/search endpoint */
export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  released: string | null;          // "YYYY-MM-DD"
  background_image: string | null;  // direct cover URL
  rating: number;
  ratings_count: number;
  genres: RawgGenre[];
  platforms: RawgPlatformEntry[] | null;
}

/** Shape returned by the detail endpoint — superset of RawgGame */
export interface RawgGameDetail extends RawgGame {
  description_raw: string | null;
  developers: RawgDeveloper[];
  publishers: RawgPublisher[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface RawgListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function rawgGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${RAWG_BASE}${path}`);
  url.searchParams.set("key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // cache for 1 hour in Next.js
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`RAWG request failed: ${res.status} ${url.pathname}`);
    return null;
  }

  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search RAWG for games matching a query string.
 * Returns up to 10 results from the list endpoint.
 */
export async function searchRawg(query: string): Promise<RawgGame[]> {
  const data = await rawgGet<RawgListResponse<RawgGame>>("/games", {
    search: query,
    page_size: "10",
    search_precise: "true",
  });
  return data?.results ?? [];
}

/**
 * Fetch full game details by RAWG slug.
 * The detail endpoint includes description_raw, developers, publishers.
 */
export async function getRawgGameBySlug(slug: string): Promise<RawgGameDetail | null> {
  return rawgGet<RawgGameDetail>(`/games/${encodeURIComponent(slug)}`);
}
