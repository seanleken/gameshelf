// Phase 2: Game detail page
export default function GameDetailPage({ params }: { params: { slug: string } }) {
  return (
    <p className="text-text-secondary">
      Game detail for &quot;{params.slug}&quot; — coming in Phase 2
    </p>
  );
}
