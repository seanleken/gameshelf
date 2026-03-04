// Phase 5: Forum category thread list
export default function ForumCategoryPage({ params }: { params: { category: string } }) {
  return (
    <p className="text-text-secondary">
      Forum category &quot;{params.category}&quot; — coming in Phase 5
    </p>
  );
}
