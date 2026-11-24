import { api, ApiError } from '@/lib/api';
import type { Post } from '@/data/types';
import { appStore, accountName } from '@/store/app';
import { feedEditsStore, remoteFeedStore, toPost } from './feed';
import { apiContentId } from '@/lib/utils';

/**
 * Publier sur le vrai fil Social :
 *  1. chaque fichier : POST /v1/uploads/presign → envoi du fichier à l'adresse donnée → POST /v1/uploads/{id}/complete ;
 *  2. POST /v1/posts { text, type, audience, media: [{ url, type }] }.
 * Modifier : PUT /v1/posts/{id} { text_content, audience } · Supprimer : DELETE /v1/posts/{id}.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};

export type RemoteAudience = 'public' | 'friends' | 'private';

/** En-têtes renvoyés par le serveur : objet, ou chaîne JSON. */
function headersOf(v: unknown): Record<string, string> {
  const o = isObj(v) ? v : typeof v === 'string' && v.trim().startsWith('{') ? (() => { try { return JSON.parse(v) as Raw; } catch { return {}; } })() : {};
  return Object.fromEntries(Object.entries(o).filter(([, x]) => typeof x === 'string' || typeof x === 'number').map(([k, x]) => [k, String(x)]));
}

/** Envoie un fichier au stockage du serveur et renvoie son adresse publique. */
export async function uploadFile(file: Blob, name: string): Promise<string> {
  const mime = file.type || 'application/octet-stream';
  const presign = await api.post<Raw>('/v1/uploads/presign', { file_name: name, filename: name, mime_type: mime, content_type: mime, size_bytes: file.size, size: String(file.size) });
  const up = isObj(presign.upload) ? presign.upload : {};
  const url = str(presign.upload_url, up.url);
  const id = str(presign.upload_id, presign.id);
  const path = str(presign.path);
  if (!url) throw new Error('Envoi du fichier impossible pour le moment.');
  const res = await fetch(url, { method: str(up.method, presign.method) || 'PUT', headers: { 'Content-Type': mime, ...headersOf(presign.headers), ...headersOf(up.headers) }, body: file });
  if (!res.ok) throw new Error('Envoi du fichier interrompu. Vérifiez votre connexion puis réessayez.');
  let finalUrl = str(presign.public_url);
  if (id) {
    const done = await api.post<Raw>(`/v1/uploads/${encodeURIComponent(id)}/complete`, { path });
    finalUrl = str(done?.url, isObj(done?.asset) ? done.asset.url : '') || finalUrl;
  }
  if (!finalUrl) throw new Error('Le fichier a été envoyé mais son adresse est inconnue.');
  return finalUrl;
}

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

export interface PublishInput {
  text: string;
  audience: RemoteAudience;
  /** Images déjà compressées (data URL) ; vidéo : fichier d'origine. */
  images?: string[];
  video?: File;
  onProgress?: (label: string) => void;
}

/** Publie et place la publication en tête du fil Social. */
export async function publishPost({ text, audience, images = [], video, onProgress }: PublishInput): Promise<Post> {
  const media: { url: string; type: string }[] = [];
  for (let i = 0; i < images.length; i++) {
    onProgress?.(images.length > 1 ? `Envoi des photos ${i + 1}/${images.length}…` : 'Envoi de la photo…');
    media.push({ url: await uploadFile(await dataUrlToBlob(images[i]), `photo-${Date.now()}-${i + 1}.jpg`), type: 'image' });
  }
  if (video) {
    onProgress?.('Envoi de la vidéo…');
    media.push({ url: await uploadFile(video, video.name || `video-${Date.now()}.mp4`), type: 'video' });
  }
  onProgress?.('Publication…');
  const type = video ? 'video' : media.length ? 'image' : 'text';
  const res = await api.post<unknown>('/v1/posts', { text, type, audience, media });
  const raw = isObj(res) && isObj(res.post) ? res.post : res;
  const account = appStore.get().account;
  // Si la réponse est incomplète, on complète avec ce qui vient d'être envoyé.
  const base: Raw = { text, type, audience, media, createdAt: new Date().toISOString(), actorType: 'user', actorId: account?.uid, authorId: account?.uid, authorName: account ? accountName(account) : undefined, authorAvatar: account?.avatar, likedBy: [] };
  const post = toPost(isObj(raw) ? { ...base, ...raw, media: Array.isArray(raw.media) && raw.media.length ? raw.media : media } : base, 'communaute');
  if (!post) throw new Error('Publication envoyée, mais elle ne peut pas être affichée.');
  remoteFeedStore.set((s) => ({ posts: { ...s.posts, [post.id]: post } }));
  feedEditsStore.set((s) => ({ created: [post.id, ...s.created] }));
  return post;
}

/** Publie un statut via le même endpoint PostgreSQL que l'application mobile. */
export async function publishStatus(input: { text: string; background?: string; images?: string[]; video?: File; music?: string; onProgress?: (label: string) => void }) {
  const account = appStore.get().account;
  if (!account?.remote || !account.uid) throw new Error('Connectez-vous pour publier un statut.');
  const createdAtMs = Date.now();
  const media: { url: string; type: 'image' | 'video' }[] = [];
  for (let i = 0; i < (input.images ?? []).length; i++) {
    input.onProgress?.('Envoi de la photo…');
    media.push({ url: await uploadFile(await dataUrlToBlob(input.images![i]), `status-${createdAtMs}-${i + 1}.jpg`), type: 'image' });
  }
  if (input.video) {
    input.onProgress?.('Envoi de la vidéo…');
    media.push({ url: await uploadFile(input.video, input.video.name || `status-${createdAtMs}.mp4`), type: 'video' });
  }
  const statusItems = media.length ? media.map((file, index) => ({
    id: `${account.uid}_${createdAtMs}_${index}`,
    type: file.type,
    text: index === 0 ? input.text : '',
    backgroundColor: input.background || '',
    imageUrl: file.type === 'image' ? file.url : '',
    videoUrl: file.type === 'video' ? file.url : '',
    createdAt: new Date(createdAtMs + index).toISOString(),
    createdAtMs: createdAtMs + index,
    expiresAtMs: createdAtMs + 24 * 60 * 60 * 1000,
    durationSec: file.type === 'video' ? 15 : 8,
    metrics: { views: 0, reactions: 0 },
  })) : [{
    id: `${account.uid}_${createdAtMs}`,
    type: input.background ? 'canvas' : 'text',
    text: input.text,
    backgroundColor: input.background || '',
    createdAt: new Date(createdAtMs).toISOString(),
    createdAtMs,
    expiresAtMs: createdAtMs + 24 * 60 * 60 * 1000,
    durationSec: 8,
    metrics: { views: 0, reactions: 0 },
  }];
  input.onProgress?.('Publication…');
  const result = await api.post<Raw>('/status/publish', {
    userId: account.uid,
    userName: accountName(account),
    userAvatar: account.avatar || '',
    updatedAtMs: createdAtMs,
    statusItems,
  });
  const group = isObj(result.data) ? result.data : result;
  const items = Array.isArray(group.statusItems) ? group.statusItems : statusItems;
  appStore.set((state) => ({ myStatus: [...state.myStatus, ...items.map((item) => {
    const row = isObj(item) ? item : {};
    return {
      id: str(row.id) || `${account.uid}-${createdAtMs}`,
      text: str(row.text) || undefined,
      background: str(row.backgroundColor) || undefined,
      image: str(row.imageUrl) || undefined,
      video: str(row.videoUrl) || undefined,
      music: input.music,
      createdAt: str(row.createdAt) || new Date(createdAtMs).toISOString(),
    };
  })] }));
}

const apiId = (post: Post) => encodeURIComponent(apiContentId(post.id));

export async function editRemotePost(post: Post, text: string, audience?: RemoteAudience) {
  const before = post;
  remoteFeedStore.set((s) => ({ posts: { ...s.posts, [post.id]: { ...post, body: text } } }));
  try {
    await api.put(`/v1/posts/${apiId(post)}`, { text_content: text, ...(audience ? { audience } : {}) });
  } catch (e) {
    remoteFeedStore.set((s) => ({ posts: { ...s.posts, [post.id]: before } }));
    throw e instanceof ApiError ? e : new Error('Modification impossible pour le moment.');
  }
}

export async function deleteRemotePost(post: Post) {
  feedEditsStore.set((s) => ({ removed: [...s.removed, post.id] }));
  try {
    await api.delete(`/v1/posts/${apiId(post)}`);
  } catch (e) {
    feedEditsStore.set((s) => ({ removed: s.removed.filter((id) => id !== post.id) }));
    throw e instanceof ApiError ? e : new Error('Suppression impossible pour le moment.');
  }
}

/** Publication de l'API écrite par le compte connecté. */
export const isMyRemotePost = (post: Post) => !!post.remote && !!post.author?.uid && post.author.uid === appStore.get().account?.uid;
