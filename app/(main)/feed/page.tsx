import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFollowerFeed } from "@/lib/services/social";
import { ActivityFeedItem } from "@/components/social/activity-feed-item";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed — GameShelf" };

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const events = await getFollowerFeed(session.user.id);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-8">Your Feed</h1>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary text-sm mb-4">
            Nothing here yet. Follow some gamers to see what they&apos;re playing.
          </p>
          <Link
            href="/games"
            className="text-sm text-accent hover:text-accent-hover underline underline-offset-2"
          >
            Browse Games
          </Link>
        </div>
      ) : (
        <div className="bg-bg-surface border border-subtle rounded-card px-4">
          {events.map((event) => (
            <ActivityFeedItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
