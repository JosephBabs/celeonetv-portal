import { useEffect } from 'react';
import { createStore } from '@/lib/createStore';
import type { Vibe } from '@/data/types';
import { appStore } from '@/store/app';

type Raw = Record<string, unknown>;
const isObj = (value: unknown): value is Raw => !!value && typeof value === 'object' && !Array.isArray(value);
const str = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && !!value.trim())?.trim() ?? '';
const num = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};
interface VibeState { status: 'idle' | 'loading' | 'ready' | 'error'; items: Vibe[] }
const vibeStore = createStore<VibeState>(() => ({ status: 'idle', items: [] }));
let request: Promise<void> | null = null;

function toVibe(raw: Raw): Vibe | null {
  const id = str(raw.id, raw.postId, raw.reelId);
  const media = Array.isArray(raw.media) ? raw.media.filter(isObj) : [];
  const video = str(raw.videoUrl, raw.video_url, media.find((item) => /video/i.test(str(item.type, item.mime)) || /\.(mp4|m3u8|webm)(\?|$)/i.test(str(item.url)))?.url);
  if (!id || !video) return null;
  const author = isObj(raw.author) ? raw.author : {};
  const metrics = isObj(raw.metrics) ? raw.metrics : {};
  const time = raw.createdAt ?? raw.created_at ?? raw.createdAtMs;
  const createdAt = isObj(time) ? str(time.iso) : str(time);
  return {
    id,
    authorId: str(raw.authorId, raw.actorId, author.id, raw.userId) || id,
    authorName: str(raw.authorName, raw.posterName, author.displayName, author.name) || 'Membre Cèlè One',
    authorAvatar: str(raw.authorAvatar, author.photoURL, author.avatar_url) || undefined,
    caption: str(raw.caption, raw.text, raw.content),
    scene: 'choir',
    videoUrl: video,
    thumbnailUrl: str(raw.thumbnailUrl, raw.videoShareImage, media[0]?.thumbnailUrl) || undefined,
    views: num(raw.views, raw.viewCount, metrics.views),
    likes: num(raw.likes, raw.reactions_count, raw.reactionCount, metrics.reactions),
    shares: num(raw.shares, raw.shares_count, metrics.shares),
    comments: [],
    createdAt: createdAt || new Date().toISOString(),
  };
}

async function json(path: string) {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Content request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export async function loadPublicVibes(force = false) {
  if (request && !force) return request;
  request = (async () => {
    vibeStore.set((state) => ({ ...state, status: 'loading' }));
    try {
      const payload = await json('/api/public/posts?limit=50');
      const records = Array.isArray(payload) ? payload : isObj(payload) && Array.isArray(payload.data) ? payload.data : [];
      const items = records.filter(isObj).map(toVibe).filter((item): item is Vibe => !!item).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      vibeStore.set({ status: 'ready', items });
      appStore.set({ vibes: items });
    } catch {
      vibeStore.set((state) => ({ status: 'error', items: state.items }));
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
  return { ...state, reload: () => loadPublicVibes(true) };
}
