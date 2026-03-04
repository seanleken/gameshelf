import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllGenres, getAllPlatforms } from "@/lib/services/game";
import { SubmitGameForm } from "@/components/game/submit-game-form";

export const metadata = {
  title: "Submit a Game — GameShelf",
};

export default async function SubmitGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const [genres, platforms] = await Promise.all([getAllGenres(), getAllPlatforms()]);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Submit a Game</h1>
        <p className="text-text-secondary text-sm mt-1">
          Can&apos;t find a game in our library? Add it manually.
        </p>
      </div>
      <div className="bg-bg-surface border border-subtle rounded-card p-6">
        <SubmitGameForm genres={genres} platforms={platforms} />
      </div>
    </main>
  );
}
