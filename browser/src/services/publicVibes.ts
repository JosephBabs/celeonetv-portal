import { useEffect } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import type { Vibe } from '@/data/types';
import { appStore } from '@/store/app';

type Raw = Record<string, unknown>;
interface VibeState { status: 'idle' | 'loading' | 'ready' | 'error'; items: Vibe[] }
const vibeStore = createStore<VibeState>(() => ({ status: 'idle', items: [] }));
let request: Promise<void> | null = null;
let nextCursor: string | null = null;
let hasMore = false;

const isObj = (value: unknown): value is Raw => !!value && typeof value === 'object' && !Array.isArray(value);
const str = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && !!value.trim())?.trim() ?? '';
const num = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

function records(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isObj(value)) return [];
  for (const key of ['items', 'reels', 'data', 'posts', 'results']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (isObj(nested)) {
      const result = records(nested);
      if (result.length) return result;
    }
  }
  return [];
}

function pagination(value: unknown) {
  const root = isObj(value) ? value : {};
  const data = isObj(root.data) ? root.data : {};
  const meta = isObj(root.meta) ? root.meta : {};
  const page = isObj(meta.page) ? meta.page : {};
  const cursor = str(root.nextCursor, root.next_cursor, data.nextCursor, data.next_cursor, page.next_cursor, page.nextCursor) || null;
  const more = root.hasMore === true || root.has_more === true || data.hasMore === true || data.has_more === true || page.has_more === true || page.hasMore === true;
  return { cursor: more ? cursor : null, hasMore: more && !!cursor };
}

function iso(value: unknown) {
  if (typeof value === 'number' && value > 0) return new Date(value < 1e12 ? value * 1000 : value).toISOString();
  if (isObj(value)) {
    const ms = num(value._seconds, value.seconds);
    if (ms) return new Date(ms * 1000).toISOString();
    value = value.iso;
  }
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString();
}

function toVibe(raw: Raw, fromReelDiscovery = false): Vibe | null {
  const type = str(raw.type, raw.postType, raw.post_type, raw.kind).toLowerCase();
  if (!fromReelDiscovery && type !== 'reel' && type !== 'reels' && !raw.reelId && !raw.reel_id) return null;

  const id = str(raw.reelId, raw.reel_id, raw.id, raw.postId, raw.post_id);
  const media = Array.isArray(raw.media) ? raw.media.filter(isObj) : isObj(raw.media) ? [raw.media] : [];
  const mediaVideo = media.find((item) => {
    const mime = str(item.mime, item.mimeType, item.type).toLowerCase();
    const url = str(item.playbackUrl, item.url, item.src);
    return mime.includes('video') || /\.(mp4|m3u8|webm|mov)(\?|$)/i.test(url);
  });
  const video = str(raw.playbackUrl, raw.videoUrl, raw.video_url, raw.video, mediaVideo?.playbackUrl, mediaVideo?.url, mediaVideo?.src);
  if (!id || !video) return null;

  const author = isObj(raw.author) ? raw.author : isObj(raw.user) ? raw.user : {};
  const metrics = isObj(raw.metrics) ? raw.metrics : {};
  return {
    id,
    authorId: str(raw.authorId, raw.author_id, raw.actorId, raw.userId, raw.user_id, author.id) || id,
    authorName: str(raw.authorName, raw.posterName, author.displayName, author.name) || 'Membre Cèlè One',
    authorAvatar: str(raw.authorAvatar, author.photoURL, author.photoUrl, author.avatar_url) || undefined,
    caption: str(raw.caption, raw.text, raw.text_content, raw.content),
    scene: 'choir',
    videoUrl: video,
    thumbnailUrl: str(raw.thumbnailUrl, raw.thumbnail_url, raw.videoShareImage, raw.posterUrl, mediaVideo?.thumbnailUrl, mediaVideo?.thumbnail) || undefined,
    views: num(raw.views, raw.viewCount, raw.view_count, metrics.views),
    likes: num(raw.likes, raw.reactions_count, raw.reactionCount, metrics.reactions),
    shares: num(raw.shares, raw.shares_count, metrics.shares),
    comments: [],
    createdAt: iso(raw.createdAt ?? raw.created_at ?? raw.createdAtMs ?? raw.created_at_ms),
  };
}

async function fetchVibes(cursor?: string | null) {
  const account = appStore.get().account;
  if (account?.remote) {
    try {
      const response = await api.get<unknown>('/v1/reels/discover', { limit: 30, cursor: cursor ?? undefined });
      return { payload: response, fromReelDiscovery: true, page: pagination(response) };
    } catch {
      // Public reels remain readable if discovery needs a member session.
    }
  }
  const response = await fetch(`/api/public/posts?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Public reels unavailable (${response.status})`);
  const payload = await response.json() as unknown;
  return { payload, fromReelDiscovery: false, page: pagination(payload) };
}

export async function loadPublicVibes(force = false) {
  if (request && !force) return request;
  if (force) { nextCursor = null; hasMore = false; }
  request = (async () => {
    vibeStore.set((state) => ({ ...state, status: state.items.length ? state.status : 'loading' }));
    try {
      const result = await fetchVibes(nextCursor);
      const items = records(result.payload).filter(isObj).map((item) => toVibe(item, result.fromReelDiscovery)).filter((item): item is Vibe => !!item);
      const merged = force || !nextCursor
        ? items
        : [...vibeStore.get().items, ...items.filter((item) => !vibeStore.get().items.some((current) => current.id === item.id))];
      nextCursor = result.page.cursor;
      hasMore = result.page.hasMore;
      if (!result.fromReelDiscovery) merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      vibeStore.set({ status: 'ready', items: merged });
      appStore.set({ vibes: merged });
    } catch {
      vibeStore.set((state) => ({ status: state.items.length ? state.status : 'error', items: state.items }));
    } finally {
      request = null;
    }
  })();
  return request;
}

export async function loadMorePublicVibes() {
  if (!hasMore || !nextCursor || request) return;
  request = (async () => {
    try {
      const result = await fetchVibes(nextCursor);
      const existing = vibeStore.get().items;
      const additions = records(result.payload).filter(isObj).map((item) => toVibe(item, result.fromReelDiscovery)).filter((item): item is Vibe => !!item && !existing.some((current) => current.id === item.id));
      nextCursor = result.page.cursor;
      hasMore = result.page.hasMore;
      const merged = [...existing, ...additions];
      vibeStore.set({ status: 'ready', items: merged });
      appStore.set({ vibes: merged });
    } catch {
      // Keep the already loaded clips available if pagination briefly fails.
    } finally {
      request = null;
    }
  })();
  return request;
}

export function usePublicVibes() {
  const state = vibeStore.use((value) => value);
  useEffect(() => {
    void loadPublicVibes();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void loadPublicVibes(true); }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return { ...state, hasMore, reload: () => loadPublicVibes(true), loadMore: loadMorePublicVibes };
}
