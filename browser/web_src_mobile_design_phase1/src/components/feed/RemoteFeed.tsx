import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { CloudOff, Newspaper, RefreshCw } from 'lucide-react';
import type { Post } from '@/data/types';
import { useRemoteFeed, type FeedSource } from '@/services/feed';
import { Button } from '@/components/ui/Button';
import { EmptyState, PostSkeleton } from '@/components/ui/Feedback';
import { PostCard } from './PostCard';

/** Fil réel (API CélèOne) avec chargement au défilement, erreurs et état vide. */
export function RemoteFeed({
  source,
  onOpen,
  filter,
  extra,
  emptyText,
}: {
  source: FeedSource;
  onOpen: (id: string) => void;
  filter?: (p: Post) => boolean;
  extra?: (index: number) => ReactNode;
  emptyText: string;
}) {
  const { posts, loading, loadingMore, error, hasMore, loadMore, reload } = useRemoteFeed(source, true);
  const sentinel = useRef<HTMLDivElement>(null);
  const visible = filter ? posts.filter(filter) : posts;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, posts.length]);

  if (loading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="card rounded-2xl">
        <EmptyState
          icon={CloudOff}
          title="Impossible de charger les publications"
          text="Vérifiez votre connexion internet puis réessayez."
          action={<Button icon={RefreshCw} onClick={() => void reload()}>Réessayer</Button>}
        />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="card rounded-2xl">
        <EmptyState
          icon={Newspaper}
          title={emptyText}
          action={hasMore ? <Button variant="ghost" loading={loadingMore} onClick={() => void loadMore()}>Voir plus de publications</Button> : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((p, i) => (
        <Fragment key={p.id}>
          <PostCard post={p} onOpen={() => onOpen(p.id)} />
          {extra?.(i)}
        </Fragment>
      ))}
      <div ref={sentinel} />
      {loadingMore && <PostSkeleton />}
      {error && <p className="text-center text-sm text-danger-700">Le chargement s’est interrompu. <button className="font-semibold underline" onClick={() => void loadMore()}>Réessayer</button></p>}
      {!hasMore && !loadingMore && <p className="py-6 text-center text-sm text-ink-faint">Vous êtes à jour ✨</p>}
    </div>
  );
}
