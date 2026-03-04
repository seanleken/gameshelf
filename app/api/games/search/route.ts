import { NextRequest, NextResponse } from "next/server";
import { gameSearchSchema } from "@/lib/validators/game";
import { searchLocalGames } from "@/lib/services/game";
import { searchRawg } from "@/lib/rawg";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const parsed = gameSearchSchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    // Query local DB and RAWG in parallel
    const [localResults, rawgResults] = await Promise.all([
      searchLocalGames(parsed.data.q, 5),
      searchRawg(parsed.data.q).catch(() => []),
    ]);

    // Build a set of rawgIds already in local results
    const localRawgIds = new Set(localResults.map((g) => g.rawgId).filter(Boolean));

    // Map RAWG results to the same shape, excluding ones already in local DB
    const rawgMapped = rawgResults
      .filter((g) => !localRawgIds.has(g.id))
      .slice(0, 12 - localResults.length)
      .map((g) => ({
        id: null,
        rawgId: g.id,
        title: g.name,
        slug: g.slug,
        coverUrl: g.background_image,
        releaseDate: g.released ? new Date(g.released) : null,
        genres: (g.genres ?? []).map((genre) => ({ name: genre.name })),
      }));

    const combined = [...localResults, ...rawgMapped].slice(0, 12);

    return NextResponse.json(combined);
  } catch (err) {
    console.error("Game search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
