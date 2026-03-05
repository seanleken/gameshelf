import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getForumCategories } from "@/lib/services/forum";
import { prisma } from "@/lib/prisma";
import { ThreadForm } from "@/components/forum/thread-form";

export const metadata = {
  title: "New Thread — GameShelf Forums",
};

interface Props {
  searchParams: Promise<{ category?: string; gameId?: string }>;
}

export default async function NewThreadPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { category: categorySlug, gameId } = await searchParams;

  const [categories, game] = await Promise.all([
    getForumCategories(),
    gameId
      ? prisma.game.findUnique({ where: { id: gameId }, select: { id: true, title: true } })
      : Promise.resolve(null),
  ]);

  const categoryList = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-6 font-mono">
        <Link href="/forum" className="hover:text-text-secondary transition-colors">
          Forums
        </Link>
        {categorySlug && (
          <>
            <span>/</span>
            <Link
              href={`/forum/${categorySlug}`}
              className="hover:text-text-secondary transition-colors"
            >
              {categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-text-secondary">New Thread</span>
      </nav>

      <h1 className="text-2xl font-bold text-text-primary mb-8">Start a New Thread</h1>

      <ThreadForm
        categories={categoryList}
        defaultCategorySlug={categorySlug}
        defaultGameId={game?.id}
        defaultGameTitle={game?.title}
      />
    </div>
  );
}
