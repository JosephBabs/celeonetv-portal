import { useEffect } from 'react';
import { api, API_URL } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { albums as demoAlbums, channels as demoChannels, videos as demoVideos, type Album, type Channel, type MediaKind, type Video } from '@/data/streaming';
import type { SceneVariant } from '@/data/types';
import { useApp } from '@/store/app';
import { dateOf, expandRow, isObj, str, stripHtml, type Raw } from './weeklyTheme';

/**
 * Streaming réel : chaînes (/v1/channels), vidéos (/v1/videos), directs (/v1/live/sessions), musique (/v1/songs).
 * Comptes de démonstration : contenus fictifs (lecture simulée).
 */

const SCENES: SceneVariant[] = ['choir', 'candles', 'drums', 'sunrise', 'youth', 'prayer', 'beach'];
const sceneOf = (key: string) => SCENES[[...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % SCENES.length];
const num = (...vals: unknown[]) => {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v.trim())) return Number(v);
    if (Array.isArray(v)) return v.length;
  }
  return 0;
};
/**
 * Le serveur donne parfois un chemin court (« uploads/… », « /storage/… ») que l'app mobile complète
 * avec l'adresse du serveur : on fait de même.
 */
const ORIGIN = API_URL.replace(/\/api\/?$/, '');
/** Stockage Firebase de l'app mobile (visible dans les liens d'images des publications). */
const FIREBASE_BUCKET = 'celeone-e5843.firebasestorage.app';
const firebaseUrl = (bucket: string, path: string) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;

export function absolute(u: string) {
  return candidatesFor(u)[0] ?? '';
}

/**
 * Toutes les adresses possibles pour une valeur : lien complet, « gs://… » (Firebase),
 * chemin du serveur (« uploads/… ») ou chemin nu, essayé sur le serveur puis sur Firebase.
 */
export function candidatesFor(u: string): string[] {
  const v = u.trim();
  if (!v || /\s/.test(v)) return [];
  if (/^https?:\/\//i.test(v)) return [v];
  if (v.startsWith('//')) return [`https:${v}`];
  const gs = v.match(/^gs:\/\/([^/]+)\/(.+)$/i);
  if (gs) return [firebaseUrl(gs[1], gs[2])];
  const path = v.replace(/^\/+/, '');
  if (/^(storage|uploads)\//i.test(path)) return [`${ORIGIN}/${/^uploads\//i.test(path) ? `storage/${path}` : path}`];
  // Chemin nu avec extension (« profiles/uid/photo.jpg ») : stockage Firebase de l'app mobile, puis serveur.
  if (/^[\w.-]+(\/[\w.%-]+)+\.\w{2,5}(\?.*)?$/.test(path)) return [firebaseUrl(FIREBASE_BUCKET, decodeURIComponent(path.replace(/\?.*$/, ''))), `${ORIGIN}/storage/${path}`];
  return [];
}
const pick = (v: unknown) => absolute(isObj(v) ? str(v.url, v.src, v.downloadURL, v.secure_url, v.storagePath, v.path) : str(v));
const urlOf = (...vals: unknown[]) => vals.map(pick).find(Boolean) || undefined;
const rowOf = (input: Raw) => expandRow(isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input);
const hidden = (x: Raw) => !!x.deleted_at || /draft|archiv|brouillon|deleted|rejected|private|pending/i.test(str(x.status, x.visibility)) || x.isPublished === false;
/**
 * Sous-fiches héritées de Firebase mélangées aux vraies lignes : « videos/<id>/view_accounts/… »,
 * « …/subscriber_accounts/… », « songs/<id>/stream_accounts/… ». Ce ne sont pas des contenus.
 */
const isSubRecord = (x: Raw) => /^[^/]+\/[^/]+\/.+/.test(str(x.legacy_path));
const idOf = (x: Raw) => str(x.public_id, x.legacy_id, x.slug, x.firebase_id) || (x.id !== undefined ? String(x.id) : '');

/** « 01:02:03 », « 12:30 » ou secondes / millisecondes → secondes. */
function durationOf(x: Raw) {
  const v = x.durationSec ?? x.duration_sec ?? x.duration ?? x.length ?? x.durationMs ?? x.duration_ms;
  if (typeof v === 'string' && v.includes(':')) return v.split(':').map(Number).reduce((s, n) => s * 60 + (n || 0), 0);
  const n = num(v);
  return (x.durationMs ?? x.duration_ms) !== undefined || n > 60 * 60 * 24 ? Math.round(n / 1000) : Math.round(n);
}

function kindOf(x: Raw, url?: string): MediaKind {
  const t = str(x.kind, x.type, x.mediaType, x.media_type, x.contentType, x.category).toLowerCase();
  if (/podcast|audio/.test(t) || /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url ?? '')) return 'podcast';
  if (/film|movie/.test(t)) return 'film';
  if (/clip|music|musique|song/.test(t)) return 'clip';
  return 'video';
}

const isLive = (x: Raw) => x.isLive === true || x.live === true || /^(live|en_direct|on_air|streaming|active)$/i.test(str(x.status, x.state, x.liveStatus));

export interface RemoteChannel extends Channel {
  avatar?: string;
  streamUrl?: string;
  remote: true;
}

export function toChannel(input: unknown): RemoteChannel | null {
  if (!isObj(input)) return null;
  const x = rowOf(input);
  if (hidden(x) || isSubRecord(x)) return null;
  const id = idOf(x);
  const name = str(x.name, x.title, x.channelName, x.displayName);
  if (!id || !name) return null;
  return {
    id: `api-${id}`,
    name,
    description: stripHtml(str(x.description, x.bio, x.about, x.body)),
    subscribers: num(x.subscribersCount, x.subscribers_count, x.subscriberCount, x.followersCount, x.subscribers, x.followers),
    live: isLive(x),
    scene: sceneOf(id),
    avatar: urlOf(x.avatar, x.avatarUrl, x.logo, x.logoUrl, x.photoURL, x.image, x.imageUrl, x.thumbnail),
    streamUrl: urlOf(x.liveUrl, x.live_url, x.streamUrl, x.stream_url, x.hlsUrl, x.hls_url, x.playbackUrl, x.playback_url, x.url, x.youtubeUrl, x.embedUrl),
    remote: true,
  };
}

export interface RemoteVideo extends Video {
  src?: string;
  /** Tous les liens de lecture trouvés, du plus probable au moins probable : le lecteur les essaie dans l'ordre. */
  sources: string[];
  thumbnail?: string;
  channelName?: string;
  remote: true;
}

const IMAGE = /\.(jpe?g|png|webp|gif|avif|bmp)(\?|#|$)/i;
const SOURCE_KEYS = [
  'hlsUrl', 'hls_url', 'playbackUrl', 'playback_url', 'streamUrl', 'stream_url', 'liveUrl', 'live_url', 'videoUrl', 'video_url', 'video', 'videoFile',
  'downloadUrl', 'download_url', 'downloadURL', 'mediaUrl', 'media_url', 'fileUrl', 'file_url', 'file', 'youtubeUrl', 'youtube_url', 'youtubeId', 'youtube_id',
  'embedUrl', 'embed_url', 'audioUrl', 'audio_url', 'src', 'source', 'url', 'link', 'storageUrl', 'storagePath', 'storage_path', 'videoPath', 'video_path', 'path',
];

/** Liens de lecture candidats (hors images), sans doublons. */
function sourcesOf(x: Raw): string[] {
  const out: string[] = [];
  const add = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(add);
    for (const u of candidatesFor(isObj(v) ? str(v.hls, v.mp4, v.url, v.src, v.downloadURL, v.secure_url, v.storagePath, v.path) : str(v))) {
      if (!IMAGE.test(u) && !out.includes(u)) out.push(u);
    }
  };
  for (const k of SOURCE_KEYS) {
    const v = x[k];
    // Identifiant YouTube seul (11 caractères).
    if ((k === 'youtubeId' || k === 'youtube_id') && typeof v === 'string' && /^[\w-]{11}$/.test(v)) add(`https://www.youtube.com/watch?v=${v}`);
    else add(v);
  }
  add(x.media);
  add(x.sources);
  add(x.files);
  return out;
}

/** Image de couverture : champ d'image, image d'un média, ou miniature YouTube. */
function thumbnailOf(x: Raw, sources: string[]) {
  const media = Array.isArray(x.media) ? x.media : [x.media];
  const direct = urlOf(
    x.thumbnailUrl, x.thumbnail_url, x.thumbnail, x.thumb, x.posterUrl, x.poster, x.posterImage, x.coverUrl, x.cover, x.coverImage, x.imageUrl, x.image, x.previewImage, x.artwork,
    ...media.map((m) => (isObj(m) ? m.thumbnailUrl ?? m.posterUrl ?? m.thumbnail : undefined)),
    ...media.filter((m) => isObj(m) && IMAGE.test(str(m.url))),
  );
  if (direct) return direct;
  for (const s of sources) {
    const yt = s.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|live|shorts)\/)([\w-]{11})/);
    if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
  }
  return undefined;
}

export function toVideo(input: unknown, opts: { live?: boolean } = {}): RemoteVideo | null {
  if (!isObj(input)) return null;
  const x = rowOf(input);
  if ((hidden(x) && !opts.live) || isSubRecord(x)) return null;
  const id = idOf(x);
  const tr = isObj(x.titleTranslations) ? x.titleTranslations : {};
  const title = str(x.title, x.name, x.titre, tr.fr, tr.en, x.caption);
  if (!id || !title) return null;
  const sources = sourcesOf(x);
  const src = sources[0];
  const ch = isObj(x.channel) ? x.channel : {};
  const channelKey = str(x.channelId, x.channel_id, ch.id, ch.public_id, x.pageId, x.ownerId, x.hostId);
  const live = opts.live ? isLive(x) || !str(x.status) : isLive(x);
  const published = dateOf(x.publishedAt ?? x.published_at ?? x.startedAt ?? x.started_at ?? x.createdAt ?? x.created_at);
  return {
    id: `api-${opts.live ? 'live-' : ''}${id}`,
    channelId: channelKey ? `api-${channelKey}` : 'api-celeone',
    channelName: str(x.channelName, x.channel_name, ch.name, ch.title, x.hostName, x.authorName, typeof x.author === 'string' ? x.author : '') || undefined,
    title,
    kind: kindOf(x, src),
    category: str(x.category, x.categorie, x.genre) || (live ? 'Direct' : 'Vidéos'),
    scene: sceneOf(id),
    views: num(x.views_count, x.viewCount, x.views, x.viewersCount, x.viewers, isObj(x.metrics) ? x.metrics.views : undefined),
    durationSec: durationOf(x),
    live,
    publishedAt: (published ?? new Date()).toISOString(),
    description: stripHtml(str(x.description, x.body, x.content, x.summary, x.text)),
    src,
    sources,
    thumbnail: thumbnailOf(x, sources),
    remote: true,
  };
}

export interface RemoteAlbum extends Album {
  cover?: string;
  srcs: Record<string, string>;
}

/** Titres musicaux (/v1/songs) regroupés par album ; seuls ceux qui ont un fichier audio sont gardés. */
function toAlbums(rows: Raw[]): RemoteAlbum[] {
  const map = new Map<string, RemoteAlbum>();
  for (const input of rows) {
    const x = rowOf(input);
    if (hidden(x) || isSubRecord(x)) continue;
    const id = idOf(x);
    const title = str(x.title, x.name, x.songTitle);
    const src = urlOf(x.audioUrl, x.audio_url, x.audio, x.fileUrl, x.file_url, x.url, x.streamUrl, x.mp3);
    if (!id || !title || !src) continue;
    const albumName = str(x.album, x.albumTitle, x.album_title) || 'Titres';
    const key = str(x.albumKey, x.album_key) || albumName.toLowerCase();
    let album = map.get(key);
    if (!album) {
      album = { id: `api-album-${key}`, title: albumName, artist: str(x.artist, x.artistName, x.artist_name, x.authorName) || 'Cèlè One', scene: sceneOf(key), tracks: [], cover: urlOf(x.coverUrl, x.cover, x.artwork, x.artworkUrl, x.imageUrl, x.image), srcs: {} };
      map.set(key, album);
    }
    const trackId = `api-song-${id}`;
    album.tracks.push({ id: trackId, title, durationSec: durationOf(x) || 180 });
    album.srcs[trackId] = src;
  }
  return [...map.values()];
}

/* ───────────── Chargement ───────────── */

interface StreamState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  channels: RemoteChannel[];
  videos: RemoteVideo[];
  albums: RemoteAlbum[];
}
export const streamStore = createStore<StreamState>(() => ({ status: 'idle', channels: [], videos: [], albums: [] }));

async function list(path: string) {
  const rows: Raw[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await api.getRaw<Raw>(path, { limit: 100, cursor });
    const data = Array.isArray(res.data) ? res.data : isObj(res.data) && Array.isArray(res.data.items) ? res.data.items : [];
    rows.push(...data.filter(isObj));
    const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
    const next = typeof page.next_cursor === 'string' ? page.next_cursor : null;
    if (!next || page.has_more === false || data.length === 0) break;
    cursor = next;
  }
  return rows;
}

let loading: Promise<void> | null = null;

async function loadStreaming() {
  streamStore.set({ status: 'loading' });
  const [ch, vids, lives, songs] = await Promise.allSettled([list('/v1/channels'), list('/v1/videos'), list('/v1/live/sessions'), list('/v1/songs')]);
  if ([ch, vids, lives].every((r) => r.status === 'rejected')) {
    streamStore.set({ status: 'error' });
    loading = null;
    return;
  }
  const rows = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value : []);
  const channels = rows(ch).map(toChannel).filter((c): c is RemoteChannel => !!c);
  const liveVideos = rows(lives).map((l) => toVideo(l, { live: true })).filter((v): v is RemoteVideo => !!v && !!v.live);
  const videos = [...liveVideos, ...rows(vids).map((v) => toVideo(v)).filter((v): v is RemoteVideo => !!v)];

  // Chaîne en direct avec un lien de flux : elle devient une vidéo « EN DIRECT ».
  for (const c of channels) if (c.live && c.streamUrl && !videos.some((v) => v.live && v.channelId === c.id)) {
    videos.unshift({ id: `${c.id}-live`, channelId: c.id, title: `${c.name} — en direct`, kind: 'video', category: 'Direct', scene: c.scene, views: 0, durationSec: 0, live: true, publishedAt: new Date().toISOString(), description: c.description, src: c.streamUrl, sources: [c.streamUrl], thumbnail: c.avatar, remote: true });
  }
  // Vidéos sans chaîne connue : une chaîne est créée à partir de leur auteur.
  for (const v of videos) if (!channels.some((c) => c.id === v.channelId)) {
    channels.push({ id: v.channelId, name: v.channelName ?? 'Cèlè One', description: '', subscribers: 0, live: false, scene: v.scene, remote: true });
  }
  for (const c of channels) c.live = c.live || videos.some((v) => v.live && v.channelId === c.id);
  const unique = [...new Map(videos.map((v) => [v.id, v])).values()];
  unique.sort((a, b) => Number(!!b.live) - Number(!!a.live) || b.publishedAt.localeCompare(a.publishedAt));
  streamStore.set({ status: 'ready', channels, videos: unique, albums: toAlbums(rows(songs)) });
}

export function ensureStreaming() {
  if (!loading) loading = loadStreaming();
  return loading;
}

/** Contenus à afficher (réels ou démo). */
export function useStreaming() {
  const accountRemote = useApp((s) => !!s.account?.remote);
  const remote = accountRemote || (import.meta.env.VITE_DATA_MODE ?? 'api') !== 'demo';
  const state = streamStore.use((s) => s);
  useEffect(() => {
    if (remote) void ensureStreaming();
  }, [remote]);
  const channels: Channel[] = remote ? state.channels : demoChannels;
  const videos: Video[] = remote ? state.videos : demoVideos;
  const albums: Album[] = remote ? state.albums : demoAlbums;
  return {
    remote,
    status: remote ? state.status : ('ready' as const),
    channels,
    videos,
    albums,
    getVideo: (id: string) => videos.find((v) => v.id === id),
    getChannel: (id: string) => channels.find((c) => c.id === id),
  };
}

export const isRemoteVideo = (v: Video): v is RemoteVideo => 'remote' in v && (v as RemoteVideo).remote === true;
export const isRemoteChannel = (c: Channel): c is RemoteChannel => 'remote' in c && (c as RemoteChannel).remote === true;
export const albumSrc = (a: Album, trackId: string) => ('srcs' in a ? (a as RemoteAlbum).srcs[trackId] : undefined);

/** Chaîne officielle (page Live) : celle dont le nom évoque Cèlè One, sinon une chaîne en direct, sinon la première. */
export function officialChannel(channels: Channel[]) {
  return channels.find((c) => /c[eèé]l[eèé]\s*one/i.test(c.name) && c.live) ?? channels.find((c) => /c[eèé]l[eèé]\s*one/i.test(c.name)) ?? channels.find((c) => c.live) ?? channels[0];
}
