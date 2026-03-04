// Phase 5: Thread detail
export default function ThreadDetailPage({ params }: { params: { slug: string } }) {
  return (
    <p className="text-text-secondary">
      Thread &quot;{params.slug}&quot; — coming in Phase 5
    </p>
  );
}
