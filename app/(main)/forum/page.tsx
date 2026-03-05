import { getForumCategories } from "@/lib/services/forum";
import { ForumCategoryCard } from "@/components/forum/forum-category-card";

export const metadata = {
  title: "Community Forums — GameShelf",
  description: "Join the GameShelf community — discuss games, get help, and connect with other gamers.",
};

export default async function ForumPage() {
  const categories = await getForumCategories();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Community Forums</h1>
        <p className="text-text-secondary mt-2">
          Discuss games, share tips, and connect with other gamers.
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <ForumCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
