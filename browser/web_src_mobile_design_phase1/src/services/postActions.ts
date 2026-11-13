import { api, ApiError } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { accountName, appStore } from '@/store/app';
import { toast } from '@/store/ui';
import type { Comment, Post } from '@/data/types';
import { remoteFeedStore } from './feed';

/**
 * Actions réelles sur les publications de l'API (écrivent sur le serveur, visibles dans l'app mobile).
 * Mise à jour optimiste : la carte change tout de suite, puis on aligne sur la réponse ou on annule.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};

/** Identifiant de la publication côté API (on préfixe « api- » côté web). */
const apiId = (post: Post) => encodeURIComponent(post.id.replace(/^api-/, ''));

function patch(id: string, fn: (p: Post) => Partial<Post>) {
  remoteFeedStore.set((s) => (s.posts[id] ? { posts: { ...s.posts, [id]: { ...s.posts[id], ...fn(s.posts[id]) } } } : {}));
}

function actor() {
  const a = appStore.get().account;
  return a ? { actorType: 'user', actorId: a.uid ?? a.id, actorName: accountName(a), actorAvatar: a.avatar ?? null } : {};
}

const busy = new Set<string>();

export async function toggleRemoteLike(post: Post) {
  const key = `like-${post.id}`;
  if (busy.has(key)) return;
  busy.add(key);
  const was = !!post.likedByMe;
  patch(post.id, (p) => ({ likedByMe: !was, likes: Math.max(0, p.likes + (was ? -1 : 1)) }));
  try {
    const res = was
      ? await api.delete<Raw>(`/v1/posts/${apiId(post)}/reaction`)
      : await api.put<Raw>(`/v1/posts/${apiId(post)}/reaction`, { reaction: 'like', ...actor() });
    const count = typeof res?.reactions_count === 'number' ? res.reactions_count : typeof res?.likes === 'number' ? res.likes : null;
    patch(post.id, (p) => ({ likedByMe: typeof res?.reacted === 'boolean' ? res.reacted : p.likedByMe, likes: count ?? p.likes }));
  } catch (e) {
    patch(post.id, (p) => ({ likedByMe: was, likes: Math.max(0, p.likes + (was ? 1 : -1)) }));
    toast(e instanceof ApiError ? e.message : 'Réaction impossible pour le moment.', { tone: 'danger' });
  } finally {
    busy.delete(key);
  }
}

export async function toggleRemoteSave(post: Post) {
  const key = `save-${post.id}`;
  if (busy.has(key)) return;
  busy.add(key);
  const was = !!post.savedByMe;
  patch(post.id, () => ({ savedByMe: !was }));
  try {
    const res = was ? await api.delete<Raw>(`/v1/posts/${apiId(post)}/save`) : await api.post<Raw>(`/v1/posts/${apiId(post)}/save`);
    const saved = typeof res?.saved === 'boolean' ? res.saved : !was;
    patch(post.id, () => ({ savedByMe: saved }));
    toast(saved ? 'Publication enregistrée' : 'Retirée de vos enregistrements');
  } catch (e) {
    patch(post.id, () => ({ savedByMe: was }));
    toast(e instanceof ApiError ? e.message : 'Enregistrement impossible pour le moment.', { tone: 'danger' });
  } finally {
    busy.delete(key);
  }
}

/* ───────────── Commentaires ───────────── */

function toIso(v: unknown) {
  if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  if (typeof v === 'number' && v > 0) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  if (isObj(v) && typeof v.iso === 'string') return new Date(v.iso).toISOString();
  if (isObj(v) && typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  return new Date().toISOString();
}

const generic = /^(cele\s*one|célè\s*one|cèlè\s*one)?\s*(user|utilisateur|membre|member)\s*\d*$/i;

export function toComment(input: unknown): Comment | null {
  if (!isObj(input)) return null;
  const x: Raw = isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input;
  const id = str(x.id, x.firebase_id, x.commentId) || (typeof x.id === 'number' ? String(x.id) : '');
  const text = str(x.body, x.text, x.content, x.message, x.comment);
  if (!id || !text) return null;
  const a = isObj(x.author) ? x.author : isObj(x.actor) ? x.actor : {};
  const u = isObj(x.user) ? x.user : {};
  const name = [x.actorName, x.userName, x.authorName, a.displayName, a.name, u.name].map((n) => str(n)).find((n) => n && !generic.test(n)) || 'Membre CélèOne';
  return {
    id: `api-${id}`,
    authorId: `api-${str(x.actorId, x.userId, x.user_id, a.id) || id}`,
    text,
    createdAt: toIso(x.createdAt ?? x.created_at ?? x.createdAtMs),
    author: { name, avatar: str(x.actorAvatar, x.userProfileImage, x.authorAvatar, a.photoURL, a.avatar_url, u.avatar_url) || undefined, uid: str(x.actorId, x.userId, x.authorId, a.id) || undefined },
  };
}

/** Commentaires chargés par publication (non persistés). */
export const commentsStore = createStore<{ byPost: Record<string, { items: Comment[]; loading: boolean; error?: string }> }>(() => ({ byPost: {} }));

export async function loadRemoteComments(post: Post, force = false) {
  const current = commentsStore.get().byPost[post.id];
  if (current && !force && !current.error) return;
  commentsStore.set((s) => ({ byPost: { ...s.byPost, [post.id]: { items: current?.items ?? [], loading: true } } }));
  try {
    const res = await api.get<unknown>(`/v1/posts/${apiId(post)}/comments`, { limit: 50 });
    const list = Array.isArray(res) ? res : isObj(res) && Array.isArray(res.items) ? res.items : [];
    const items = list.map(toComment).filter((c): c is Comment => !!c).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    commentsStore.set((s) => ({ byPost: { ...s.byPost, [post.id]: { items, loading: false } } }));
  } catch (e) {
    commentsStore.set((s) => ({ byPost: { ...s.byPost, [post.id]: { items: current?.items ?? [], loading: false, error: e instanceof ApiError ? e.message : 'Chargement impossible.' } } }));
  }
}

export async function addRemoteComment(post: Post, text: string) {
  const account = appStore.get().account;
  const temp: Comment = { id: `tmp-${Date.now()}`, authorId: 'me', text, createdAt: new Date().toISOString(), pending: true, author: account ? { name: accountName(account), avatar: account.avatar } : undefined };
  const push = (fn: (items: Comment[]) => Comment[]) =>
    commentsStore.set((s) => ({ byPost: { ...s.byPost, [post.id]: { ...(s.byPost[post.id] ?? { loading: false }), items: fn(s.byPost[post.id]?.items ?? []) } } }));
  push((items) => [...items, temp]);
  patch(post.id, (p) => ({ commentsCount: (p.commentsCount ?? 0) + 1 }));
  try {
    const a = actor();
    const res = await api.post<unknown>(`/v1/posts/${apiId(post)}/comments`, { body: text, text, ...a, userName: a.actorName, userProfileImage: a.actorAvatar });
    const saved = toComment(res) ?? { ...temp, pending: false };
    push((items) => items.map((c) => (c.id === temp.id ? { ...saved, authorId: 'me', author: temp.author } : c)));
  } catch (e) {
    push((items) => items.filter((c) => c.id !== temp.id));
    patch(post.id, (p) => ({ commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1) }));
    toast(e instanceof ApiError ? e.message : 'Commentaire non envoyé.', { tone: 'danger' });
  }
}
