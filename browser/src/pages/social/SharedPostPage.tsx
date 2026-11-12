import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PostActions, PostBody, PostHeader, CommentsSection } from '@/components/feed/PostCard';
import { CeleLoader } from '@/components/CeleLoader';
import { toPost } from '@/services/feed';
import type { Post } from '@/data/types';
import { useApp } from '@/store/app';

function getEmbeddedPost(id: string, kind: 'posts' | 'reels') {
  let raw: unknown = null;
  try {
    const payload = JSON.parse(document.getElementById('celeone-post-data')?.textContent || 'null');
    if (payload?.requestedId === id && (payload.kind || 'posts') === kind) raw = payload.post;
  } catch {
    raw = null;
  }
  return raw ? toPost(raw, 'communaute') : null;
}

export function SharedPostPage() {
  const { postId, contentId, reelId } = useParams();
  const location = useLocation();
  const account = useApp((s) => s.account);
  const requestedId = postId ?? contentId ?? reelId ?? '';
  const kind = reelId || location.pathname.startsWith('/reels/') ? 'reels' : 'posts';
  const embedded = useMemo(() => getEmbeddedPost(requestedId, kind), [requestedId, kind]);
  const [post, setPost] = useState<Post | null>(embedded);
  const [loading, setLoading] = useState(!embedded);
  const [error, setError] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setPost(embedded);
    setError(false);
    setLoading(!embedded);
    if (embedded || !requestedId) return;

    const controller = new AbortController();
    void fetch(`/api/public/${kind}/${encodeURIComponent(requestedId)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Post unavailable');
        return response.json();
      })
      .then((payload) => {
        const raw = payload?.data?.post ?? payload?.data ?? payload?.post ?? null;
        const mapped = raw && typeof raw === 'object' ? toPost({ ...raw, id: raw.id ?? requestedId }, 'communaute') : null;
        setPost(mapped);
        setError(!mapped);
      })
      .catch((reason: unknown) => {
        if ((reason as Error).name !== 'AbortError') setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [embedded, kind, requestedId]);

  if (loading) return <div className="py-10"><CeleLoader /></div>;
  if (!post || error) {
    return <div className="card mx-auto max-w-[680px] p-6 text-center"><h1 className="font-display text-xl font-extrabold">Publication introuvable</h1><p className="mt-2 text-sm text-ink-muted">Cette publication n’est plus disponible.</p><Link to="/social" className="mt-4 inline-flex rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white">Ouvrir le fil Social</Link></div>;
  }

  return (
    <div className="mx-auto max-w-[680px] space-y-4">
      <article className="card space-y-4 rounded-2xl p-4 sm:p-5">
        <PostHeader post={post} />
        <PostBody post={post} />
        <PostActions post={post} onComment={() => setShowComments((value) => !value)} />
        {showComments && <div className="border-t border-line/70 pt-3"><CommentsSection post={post} /></div>}
      </article>
      {!account && (
        <aside className="card space-y-3 rounded-2xl border border-brand-200 p-4 text-center sm:p-5">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink">Lecture publique</h2>
            <p className="mt-1 text-sm text-ink-muted">Connectez-vous pour aimer ou commenter, ou créez un compte pour rejoindre la communauté.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/connexion" state={{ from: location.pathname + location.search }} className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">Se connecter</Link>
            <Link to="/inscription" state={{ from: location.pathname + location.search }} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface-sunken">Créer un compte</Link>
          </div>
        </aside>
      )}
    </div>
  );
}
