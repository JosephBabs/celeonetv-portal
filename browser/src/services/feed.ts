import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import type { Post, PostKind } from '@/data/types';
import { appStore } from '@/store/app';

/**
 * Lecture du fil depuis l'API CélèOne (étape 1 : lecture seule).
 * Le format exact des publications n'est pas documenté : la conversion ci-dessous accepte
 * les variantes de noms de champs les plus probables (Laravel et ancienne base Firebase).
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
const num = (...vals: unknown[]) => {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
    if (Array.isArray(v)) return v.length;
  }
  return 0;
};

/** Accepte ISO, timestamp (s ou ms), { iso } et horodatage Firestore { _seconds }. */
function toIso(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === 'string' && v && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
    if (typeof v === 'number' && v > 0) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
    if (isObj(v)) {
      if (typeof v.iso === 'string' && !Number.isNaN(Date.parse(v.iso))) return new Date(v.iso).toISOString();
      const s = num(v._seconds, v.seconds);
      if (s) return new Date(s * 1000).toISOString();
    }
  }
  return new Date().toISOString();
}

/** Certains anciens contenus sont en HTML (<div>, <br>) : on garde le texte et les retours à la ligne. */
function stripHtml(v: unknown) {
  if (typeof v !== 'string') return '';
  if (!/<[a-z][\s\S]*>/i.test(v)) return v.trim();
  const doc = new DOMParser().parseFromString(v.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p)>/gi, '\n'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

interface Media {
  url: string;
  video: boolean;
  poster?: string;
}

function mediaList(...vals: unknown[]) {
  const out: Media[] = [];
  const push = (m: unknown, hintVideo = false, poster?: string) => {
    if (typeof m === 'string' && /^https?:\/\//.test(m)) {
      if (!out.some((o) => o.url === m)) out.push({ url: m, video: hintVideo || /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(m), poster });
    } else if (isObj(m)) {
      const url = str(m.url, m.uri, m.src, m.downloadUrl, m.download_url);
      const type = str(m.mime, m.type, m.mimeType, m.kind).toLowerCase();
      if (url) push(url, type.includes('video'), str(m.thumbnailUrl, m.thumbnail, m.poster) || undefined);
    }
  };
  for (const v of vals) (Array.isArray(v) ? v : [v]).forEach((m) => push(m));
  return out;
}

const isGeneric = (n: string) => /^(cele\s*one|célè\s*one|cèlè\s*one)?\s*(user|utilisateur|membre|member)\s*\d*$/i.test(n);
const officialActor = /admin|page|official|officiel/i;
const categoryLabels: Record<string, string> = { news: 'Actualité', actualite: 'Actualité', announcement: 'Annonce', annonce: 'Annonce', reform: 'Réforme', reforme: 'Réforme', agenda: 'Agenda', event: 'Agenda' };


export function toPost(input: unknown, kind: PostKind): Post | null {
  if (!isObj(input)) return null;
  const legacy = isObj(input.legacy_data) ? input.legacy_data : {};
  const x: Raw = { ...legacy, ...input };
  const id = str(x.id, x.firebase_id, x.uid, x.postId) || (typeof x.id === 'number' ? String(x.id) : '');
  if (!id) return null;

  const a = isObj(x.author) ? x.author : {};
  const u = isObj(x.user) ? x.user : {};
  const names = [x.authorName, x.posterName, a.displayName, a.name, typeof x.author === 'string' ? x.author : '', [str(x.authorFirstName), str(x.authorLastName)].filter(Boolean).join(' '), u.name];
  const name = names.map((n) => str(n)).find((n) => n && !isGeneric(n)) || 'Membre CélèOne';
  const actorType = str(x.actorType, a.type);
  const official = officialActor.test(actorType);
  const avatar = str(x.authorAvatar, a.photoURL, a.photoUrl, a.avatar_url, official ? '' : u.avatar_url) || undefined;
  const metrics = isObj(x.metrics) ? x.metrics : {};
  const media = mediaList(x.media, x.image, x.video);
  const audience = str(x.audience, x.visibility).toLowerCase();
  const category = str(x.category).toLowerCase();
  const likedBy = Array.isArray(x.likedBy) ? x.likedBy : [];
  // likedBy contient des uid Firebase : on compare avec celui du compte connecté.
  const myUid = appStore.get().account?.uid ?? '';

  return {
    id: `api-${id}`,
    authorId: `api-${str(a.id, x.actorId, x.authorId) || id}`,
    kind,
    tag: kind === 'communaute' ? (audience.includes('friend') ? 'Amis' : 'Public') : categoryLabels[category] ?? 'Actualité',
    title: str(x.title) || undefined,
    body: str(x.text, x.caption, x.text_content, x.body) || stripHtml(x.content),
    createdAt: toIso(x.createdAt, x.createdAtMs, x.created_at),
    images: media.filter((m) => !m.video).map((m) => m.url),
    videos: media.filter((m) => m.video).map((m) => m.url),
    videoPosters: media.filter((m) => m.video).map((m) => m.poster ?? str(x.thumbnailUrl)),
    audience: audience.includes('friend') ? 'amis' : 'public',
    likes: num(x.reactions_count, x.likes, metrics.reactions),
    shares: num(x.shares_count, x.shares, metrics.shares),
    comments: [],
    commentsCount: num(x.comments_count, x.commentCount, metrics.comments, x.comments),
    likedByMe: !!myUid && likedBy.includes(myUid),
    remote: true,
    author: {
      name, avatar, verified: official, official: official && !avatar,
      uid: official ? undefined : str(a.id, x.actorId, x.authorId) || undefined,
      // Publication d'une page (ex. « Mimo Events ») : sa page de profil.
      pageId: /page/i.test(actorType) ? str(x.pageId, x.page_id, a.id, x.actorId) || undefined : undefined,
    },
  };
}

/** Publications de l'API gardées en mémoire (pour la fenêtre de détail). */
export const remoteFeedStore = createStore<{ posts: Record<string, Post> }>(() => ({ posts: {} }));
export function findRemotePost(id: string) {
  return remoteFeedStore.get().posts[id];
}

export type FeedSource = 'accueil' | 'social';

interface Page {
  items: unknown[];
  next: string | null;
}

function pickItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload.flatMap((p) => (Array.isArray(p) ? p : [p]));
  if (isObj(payload)) {
    for (const k of ['items', 'data', 'posts', 'results']) if (Array.isArray(payload[k])) return pickItems(payload[k]);
    if (isObj(payload.data)) return pickItems(payload.data);
  }
  return [];
}

/**
 * /v1/posts ne dit pas si le compte connecté a aimé (pas de likedBy à jour) :
 * on lit sa réaction sur chaque publication via GET /v1/posts/{id}/reaction.
 */
function syncMyReactions(posts: Post[]) {
  for (const p of posts) {
    api
      .get<Raw>(`/v1/posts/${encodeURIComponent(p.id.replace(/^api-/, ''))}/reaction`)
      .then((r) => {
        if (typeof r?.reacted !== 'boolean') return;
        const reacted = r.reacted;
        const count = typeof r.reactions_count === 'number' ? r.reactions_count : null;
        remoteFeedStore.set((s) => (s.posts[p.id] ? { posts: { ...s.posts, [p.id]: { ...s.posts[p.id], likedByMe: reacted, likes: count ?? s.posts[p.id].likes } } } : {}));
      })
      .catch(() => {});
  }
}

async function fetchPage(source: FeedSource, cursor: string | null, signal?: AbortSignal): Promise<Page> {
  if (source === 'accueil') {
    // Publications officielles (administration, pages) : /v1/posts, pagination dans meta.page.
    const res = await api.getRaw<Raw>('/v1/posts', { limit: 12, cursor: cursor ?? undefined }, signal);
    const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
    const next = page.has_more === true && typeof page.next_cursor === 'string' ? page.next_cursor : null;
    return { items: pickItems(res.data), next };
  }
  // Fil communautaire personnalisé (amis, pages suivies) : /v1/feed.
  const res = await api.getRaw<Raw>('/v1/feed', { limit: 12, cursor: cursor ?? undefined }, signal);
  let items = pickItems(res.data);
  if (items.length && items.every((i) => typeof i === 'string' || typeof i === 'number')) {
    items = pickItems(await api.post<unknown>('/v1/feed/items', { ids: items }));
  }
  const more = res.hasMore === true || res.hasMore === 'true';
  return { items, next: more && typeof res.nextCursor === 'string' && res.nextCursor ? res.nextCursor : null };
}

/**
 * Publications que l'on vient de créer (affichées en tête du fil Social sans attendre le classement du serveur)
 * et publications supprimées (retirées partout tout de suite).
 */
export const feedEditsStore = createStore<{ created: string[]; removed: string[] }>(() => ({ created: [], removed: [] }));

export function useRemoteFeed(source: FeedSource, enabled: boolean) {
  const [ids, setIds] = useState<string[]>([]);
  // Les publications vivent dans remoteFeedStore : un « j'aime » ou un commentaire met à jour la carte partout.
  const store = remoteFeedStore.use((s) => s.posts);
  const created = feedEditsStore.use((s) => s.created);
  const removed = feedEditsStore.use((s) => s.removed);
  const posts = useMemo(() => {
    const head = source === 'social' ? created.filter((id) => !ids.includes(id)) : [];
    return [...head, ...ids].filter((id) => !removed.includes(id)).map((id) => store[id]).filter((p): p is Post => !!p);
  }, [ids, store, created, removed, source]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursor = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const ingest = (items: unknown[], append: boolean) => {
    const mapped = items.map((i) => toPost(i, source === 'social' ? 'communaute' : 'actualite')).filter((p): p is Post => !!p);
    remoteFeedStore.set((s) => ({ posts: { ...s.posts, ...Object.fromEntries(mapped.map((p) => [p.id, p])) } }));
    if (source === 'accueil') syncMyReactions(mapped);
    setIds((prev) => {
      const base = append ? prev : [];
      const seen = new Set(base);
      return [...base, ...mapped.map((p) => p.id).filter((id) => !seen.has(id))];
    });
  };

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const page = await fetchPage(source, null, signal);
        cursor.current = page.next;
        setHasMore(page.next !== null);
        ingest(page.items, false);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [enabled, load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || cursor.current === null) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(source, cursor.current);
      cursor.current = page.next;
      setHasMore(page.next !== null);
      ingest(page.items, true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, loadingMore]);

  return { posts, loading, loadingMore, error, hasMore, loadMore, reload: () => load() };
}

/** Charge une publication précise (ouverte depuis une notification ou un lien partagé). */
export async function fetchRemotePost(id: string, kind: PostKind) {
  const raw = await api.get<unknown>(`/v1/posts/${encodeURIComponent(id.replace(/^api-/, ''))}`);
  const post = toPost(isObj(raw) && isObj(raw.post) ? raw.post : raw, kind);
  if (!post) return null;
  remoteFeedStore.set((s) => ({ posts: { ...s.posts, [post.id]: post } }));
  return post;
}
