import Link from "next/link";
import { getGlobalActivity } from "@/lib/services/social";
import { ActivityFeedItem } from "@/components/social/activity-feed-item";

export default async function HomePage() {
  const recentActivity = await getGlobalActivity(10);

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
        <div className="flex items-center justify-center gap-4">
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

      {/* Community Activity */}
      {recentActivity.length > 0 && (
        <div className="max-w-2xl mx-auto">
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
        </div>
      )}
    </div>
  );
}
