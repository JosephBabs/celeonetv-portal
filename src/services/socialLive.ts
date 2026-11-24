import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { absolute } from './streaming';
import { expandRow, isObj, str, type Raw } from './weeklyTheme';

/**
 * Directs sociaux (mêmes sources que l'app mobile, cf. Social/social_pro/liveService.ts) :
 *  - découverte  : GET {LIVE_API}/api/social/live/active  (public, sans jeton, actualisé toutes les 5 s)
 *  - commentaires: collection social_live_sessions/{id}/comments, lue via /v1/resources (l'accès générique
 *                  que l'app mobile atteint par sa couche « firestoreCompat »).
 */
export const LIVE_API = ((import.meta.env.VITE_LIVE_API_URL as string | undefined) ?? 'https://live.celeonetv.com').replace(/\/$/, '');
const POLL_MS = 5000;

export interface LiveGoal { type: 'likes' | 'viewers' | 'gift'; target: number; giftId?: string }
export interface SocialLive {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  hostType: 'user' | 'page';
  topic?: string;
  aboutMe?: string;
  playbackUrl: string;
  viewerCount: number;
  likes: number;
  commentCount: number;
  hostPaused: boolean;
  startedAtMs: number;
  orientation: 'portrait' | 'landscape';
  goal?: LiveGoal;
  pinned?: { author: string; text: string };
  commentsEnabled: boolean;
}

const n = (v: unknown) => Math.max(0, Number(v) || 0);

function toLive(x: Raw): SocialLive | null {
  const id = str(x.id, x.sessionId);
  const playbackUrl = str(x.playbackUrl);
  if (!id || !playbackUrl || str(x.status).toLowerCase() !== 'live') return null;
  const goal = isObj(x.goal) && n(x.goal.target) > 0 ? ({ type: str(x.goal.type) as LiveGoal['type'], target: n(x.goal.target), giftId: str(x.goal.giftId) || undefined }) : undefined;
  const cs = isObj(x.commentSettings) ? x.commentSettings : {};
  return {
    id,
    title: str(x.title, x.hostName) || 'Cèlè One Live',
    hostName: str(x.hostName, x.title) || 'Cèlè One',
    hostAvatar: absolute(str(x.hostAvatar)) || undefined,
    hostType: str(x.hostType) === 'page' ? 'page' : 'user',
    topic: str(x.topic) || undefined,
    aboutMe: str(x.aboutMe) || undefined,
    playbackUrl,
    viewerCount: n(x.viewerCount),
    likes: n(x.likes),
    commentCount: n(x.commentCount),
    hostPaused: x.hostPaused === true,
    startedAtMs: n(x.startedAtMs),
    orientation: str(x.orientation) === 'landscape' ? 'landscape' : 'portrait',
    goal,
    pinned: str(x.pinnedCommentText) ? { author: str(x.pinnedCommentAuthor) || 'Cèlè One', text: str(x.pinnedCommentText) } : undefined,
    commentsEnabled: cs.enabled !== false,
  };
}

export async function fetchActiveLives(signal?: AbortSignal): Promise<SocialLive[]> {
  const res = await fetch(`${LIVE_API}/api/social/live/active?_=${Date.now()}`, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, signal });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(`LIVE_DISCOVERY_${res.status}`);
  const payload = isObj(json) && 'data' in json ? json.data : json;
  const raw = Array.isArray(payload) ? payload : isObj(payload) && Array.isArray(payload.items) ? payload.items : [];
  const seen = new Set<string>();
  return raw
    .map((r) => (isObj(r) ? toLive(r) : null))
    .filter((l): l is SocialLive => !!l && !seen.has(l.id) && !!seen.add(l.id))
    .sort((a, b) => b.viewerCount - a.viewerCount || b.startedAtMs - a.startedAtMs);
}

/** Liste des directs en cours, rafraîchie toutes les 5 s (en pause quand l'onglet est caché). Une erreur ponctuelle ne vide jamais la liste. */
export function useActiveLives() {
  const [lives, setLives] = useState<SocialLive[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let off = false;
    const ctrl = new AbortController();
    const tick = async () => {
      if (document.hidden) return;
      try {
        const next = await fetchActiveLives(ctrl.signal);
        if (!off) setLives(next);
      } catch {
        /* on garde la liste précédente */
      } finally {
        if (!off) setLoaded(true);
      }
    };
    void tick();
    const t = window.setInterval(tick, POLL_MS);
    const onVis = () => !document.hidden && void tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      off = true;
      ctrl.abort();
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return { lives, loaded };
}

export interface LiveComment { id: string; author: string; avatar?: string; text: string; at: number; authorId: string }

const listOf = (res: unknown): unknown[] => (Array.isArray(res) ? res : isObj(res) ? ((['items', 'data', 'comments'].map((k) => res[k]).find(Array.isArray) as unknown[] | undefined) ?? []) : []);

function toComment(x: unknown): LiveComment | null {
  if (!isObj(x)) return null;
  const r = expandRow(x);
  const text = str(r.text);
  const id = str(r.id, r.public_id, r.legacy_id);
  if (!text || !id) return null;
  return { id, text, author: str(r.actorName, r.userName) || 'Membre', avatar: absolute(str(r.actorAvatar, r.userAvatar)) || undefined, at: n(r.createdAtMs), authorId: str(r.actorId, r.userId) };
}

/** Derniers commentaires d'un direct (lecture toutes les 2,5 s). */
export function useLiveComments(sessionId: string, enabled = true) {
  const [items, setItems] = useState<LiveComment[]>([]);
  const busy = useRef(false);
  useEffect(() => {
    if (!enabled || !sessionId) return;
    let off = false;
    const load = async () => {
      if (busy.current || document.hidden) return;
      busy.current = true;
      try {
        const res = await api.get<unknown>(`/v1/resources/social_live_sessions/${encodeURIComponent(sessionId)}/comments`, { per_page: 40, sort: 'createdAtMs', direction: 'desc' });
        const rows = listOf(res).map(toComment).filter((c): c is LiveComment => !!c).sort((a, b) => a.at - b.at);
        if (!off) setItems(rows.slice(-40));
      } catch {
        /* commentaires momentanément indisponibles */
      } finally {
        busy.current = false;
      }
    };
    void load();
    const t = window.setInterval(load, 2500);
    return () => {
      off = true;
      window.clearInterval(t);
    };
  }, [sessionId, enabled]);
  return items;
}

/**
 * Envoi d'un commentaire. L'app mobile écrit dans social_live_sessions/{id}/comments avec ces champs.
 * À CONFIRMER côté serveur : que POST /v1/resources/<collection>/<id>/<sous-collection> accepte l'écriture.
 */
export async function postLiveComment(sessionId: string, text: string, actor: { uid: string; name: string; avatar?: string }) {
  await api.post(`/v1/resources/social_live_sessions/${encodeURIComponent(sessionId)}/comments`, {
    userId: actor.uid, actorId: actor.uid, actorType: 'user', actorName: actor.name, actorAvatar: actor.avatar ?? '',
    userName: actor.name, userAvatar: actor.avatar ?? '', text: text.trim().slice(0, 1000), createdAtMs: Date.now(),
  });
}
