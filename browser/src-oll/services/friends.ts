import { useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { appStore, useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { isGenericName, knownProfile, resolveProfiles, type PublicProfile } from './profiles';
import { absolute } from './streaming';

/**
 * Amis réels : GET /v1/friends, GET /v1/friend-requests (incoming / outgoing), GET /v1/friends/discover.
 * Actions : envoyer, accepter, refuser, annuler une demande ; retirer un ami. Mises à jour optimistes.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
const FALLBACK_NAME = 'Membre CélèOne';

export interface Person {
  uid: string;
  name: string;
  avatar?: string;
  place?: string;
  mutual?: number;
}

export interface FriendRequest {
  id: string;
  person: Person;
}

const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
export const personHue = (p: Person) => hueOf(p.uid || p.name);

export function toPerson(input: unknown, fallbackUid = ''): Person | null {
  if (!isObj(input)) return fallbackUid ? { uid: fallbackUid, name: knownProfile(fallbackUid)?.name ?? FALLBACK_NAME, avatar: knownProfile(fallbackUid)?.avatar } : null;
  const uid = str(input.uid, input.firebase_uid, input.userId, input.user_id, input.id) || (typeof input.id === 'number' ? String(input.id) : '') || fallbackUid;
  if (!uid) return null;
  const full = [str(input.firstName, input.first_name), str(input.lastName, input.last_name)].filter(Boolean).join(' ');
  const seen = knownProfile(uid);
  const name = [input.displayName, input.name, input.fullName, full, input.username].map((n) => str(n)).find((n) => n && !isGenericName(n)) || seen?.name || FALLBACK_NAME;
  const mutual = Number(input.mutualCount ?? input.mutual_count ?? input.mutualFriends ?? NaN);
  return {
    uid,
    name,
    avatar: absolute(str(input.avatar, input.profileImage, input.photoURL, input.photoUrl, input.avatar_url, input.avatarUrl, input.profilePicture, input.userProfileImage)) || seen?.avatar || undefined,
    place: [str(input.city, input.ville), str(input.region), str(input.country, input.pays)].filter(Boolean).slice(0, 2).join(', ') || undefined,
    mutual: Number.isFinite(mutual) ? mutual : undefined,
  };
}

const myUid = () => appStore.get().account?.uid ?? '';

/** Amitié { users: [a, b], profiles: [...] } → l'autre personne. */
function friendOf(row: unknown): Person | null {
  if (!isObj(row)) return null;
  const me = myUid();
  const profiles = Array.isArray(row.profiles) ? row.profiles.filter(isObj) : [];
  const other = profiles.find((p) => str(p.uid, p.id) !== me) ?? (isObj(row.friend) ? row.friend : isObj(row.user) ? row.user : undefined);
  const otherUid = (Array.isArray(row.users) ? row.users.map(String) : []).find((u) => u !== me) ?? str(row.friendId, row.friend_id);
  return other ? toPerson(other, otherUid) : toPerson(row.uid ? row : null, otherUid);
}

/** Demande d'ami : l'autre personne est l'expéditeur (reçue) ou le destinataire (envoyée). */
function requestOf(row: unknown, incoming: boolean): FriendRequest | null {
  if (!isObj(row)) return null;
  const id = str(row.id, row.requestId, row.public_id) || (typeof row.id === 'number' ? String(row.id) : '');
  const side = incoming ? ['sender', 'from', 'requester', 'senderProfile', 'fromUser'] : ['receiver', 'to', 'recipient', 'receiverProfile', 'toUser'];
  const prefix = incoming ? 'sender' : 'receiver';
  const nested = side.map((k) => row[k]).find(isObj);
  const uid = str(row[`${prefix}Id`], row[`${prefix}_id`], row[`${prefix}Uid`], incoming ? row.fromUid : row.toUid);
  const flat = { uid, name: row[`${prefix}Name`] ?? row[`${prefix}_name`], avatar: row[`${prefix}Avatar`] ?? row[`${prefix}PhotoURL`] ?? row[`${prefix}_avatar`] };
  const person = toPerson(nested ?? (uid || flat.name ? flat : null), uid);
  if (!person) return null;
  return { id: id || person.uid, person };
}

const listOf = (res: unknown, key?: string): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObj(res)) {
    if (key && Array.isArray(res[key])) return res[key] as unknown[];
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
  }
  return [];
};

/* ───────────── Store ───────────── */

interface FriendsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  friends: Person[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  suggestions: Person[];
  suggestPage: number;
  suggestMore: boolean;
  suggestQuery: string;
  suggestLoading: boolean;
  dismissed: string[];
}
export const friendsStore = createStore<FriendsState>(() => ({
  status: 'idle', friends: [], incoming: [], outgoing: [], suggestions: [], suggestPage: 1, suggestMore: false, suggestQuery: '', suggestLoading: false, dismissed: [],
}));
const set = friendsStore.set;

async function fetchSuggestions(q: string, page: number) {
  const res = await api.getRaw<Raw>('/v1/friends/discover', { q: q || undefined, page, limit: 24 });
  const payload = isObj(res.data) ? res.data : res;
  const items = listOf(payload, 'items').map((p) => toPerson(p)).filter((p): p is Person => !!p && p.uid !== myUid());
  const more = payload.has_more === true || payload.hasMore === true;
  return { items, more };
}

/** Amis + demandes (+ suggestions au premier chargement ; le rafraîchissement ne touche pas à une recherche en cours). */
export async function loadFriends(withSuggestions = true) {
  if (friendsStore.get().status !== 'ready') set({ status: 'loading' });
  const [f, r, s] = await Promise.allSettled([api.get<unknown>('/v1/friends'), api.get<unknown>('/v1/friend-requests'), withSuggestions ? fetchSuggestions('', 1) : Promise.reject(new Error('skip'))]);
  if (f.status === 'rejected' && r.status === 'rejected') {
    if (friendsStore.get().status !== 'ready') set({ status: 'error' });
    return;
  }
  const friends = f.status === 'fulfilled' ? listOf(f.value).map(friendOf).filter((p): p is Person => !!p) : friendsStore.get().friends;
  const req = r.status === 'fulfilled' && isObj(r.value) ? r.value : {};
  const incoming = listOf(req.incoming).map((x) => requestOf(x, true)).filter((x): x is FriendRequest => !!x);
  const outgoing = listOf(req.outgoing).map((x) => requestOf(x, false)).filter((x): x is FriendRequest => !!x);
  set({
    status: 'ready',
    friends: [...new Map(friends.map((p) => [p.uid, p])).values()].sort((a, b) => a.name.localeCompare(b.name)),
    incoming,
    outgoing,
    ...(s.status === 'fulfilled' ? { suggestions: s.value.items.filter((p) => !friendsStore.get().dismissed.includes(p.uid)), suggestMore: s.value.more, suggestPage: 1, suggestQuery: '' } : {}),
  });  enrichProfiles();
}

/** Recherche (q) ou page suivante des suggestions. */
export async function searchSuggestions(q: string, more = false) {
  const st = friendsStore.get();
  const page = more ? st.suggestPage + 1 : 1;
  set({ suggestLoading: true, suggestQuery: q });
  try {
    const { items, more: hasMore } = await fetchSuggestions(q, page);
    if (friendsStore.get().suggestQuery !== q) return;
    set((s) => ({ suggestions: more ? [...s.suggestions, ...items.filter((p) => !s.suggestions.some((x) => x.uid === p.uid))] : items, suggestPage: page, suggestMore: hasMore, suggestLoading: false }));
    enrichProfiles();
  } catch {
    set({ suggestLoading: false });
    toast('Recherche impossible pour le moment.', { tone: 'danger' });
  }
}

/**
 * Les listes du serveur donnent souvent un nom générique (« CeleOne user ») et pas de photo :
 * on lit la fiche publique de ces membres pour afficher leur vrai nom et leur photo.
 */
function enrichProfiles() {
  const st = friendsStore.get();
  const all = [...st.friends, ...st.incoming.map((r) => r.person), ...st.outgoing.map((r) => r.person), ...st.suggestions];
  const need = all.filter((p) => p.name === FALLBACK_NAME || !p.avatar).map((p) => p.uid);
  if (!need.length) return;
  void resolveProfiles(need, (uid, prof: PublicProfile) => {
    const up = (p: Person): Person => (p.uid === uid ? { ...p, name: p.name === FALLBACK_NAME && prof.name ? prof.name : p.name, avatar: p.avatar ?? prof.avatar, place: p.place ?? prof.place } : p);
    set((s) => ({
      friends: s.friends.map(up).sort((a, b) => a.name.localeCompare(b.name)),
      incoming: s.incoming.map((r) => ({ ...r, person: up(r.person) })),
      outgoing: s.outgoing.map((r) => ({ ...r, person: up(r.person) })),
      suggestions: s.suggestions.map(up),
    }));
  });
}

const fail = (e: unknown, fallback: string) => toast(e instanceof ApiError ? e.message : fallback, { tone: 'danger' });

export const friendActions = {
  async accept(r: FriendRequest) {
    const before = friendsStore.get();
    set((s) => ({ incoming: s.incoming.filter((x) => x.id !== r.id), friends: [...s.friends, r.person].sort((a, b) => a.name.localeCompare(b.name)) }));
    toast(`Vous êtes maintenant ami avec ${r.person.name}`);
    try {
      await api.post(`/v1/friend-requests/${encodeURIComponent(r.id)}/accept`);
    } catch (e) {
      set({ incoming: before.incoming, friends: before.friends });
      fail(e, 'Impossible d’accepter la demande pour le moment.');
    }
  },
  async reject(r: FriendRequest) {
    const before = friendsStore.get().incoming;
    set((s) => ({ incoming: s.incoming.filter((x) => x.id !== r.id) }));
    toast('Demande supprimée');
    try {
      await api.post(`/v1/friend-requests/${encodeURIComponent(r.id)}/reject`);
    } catch (e) {
      set({ incoming: before });
      fail(e, 'Impossible de refuser la demande pour le moment.');
    }
  },
  async cancel(r: FriendRequest) {
    const before = friendsStore.get().outgoing;
    set((s) => ({ outgoing: s.outgoing.filter((x) => x.id !== r.id) }));
    toast('Demande annulée');
    try {
      await api.post(`/v1/friend-requests/${encodeURIComponent(r.id)}/cancel`);
    } catch (e) {
      set({ outgoing: before });
      fail(e, 'Impossible d’annuler la demande pour le moment.');
    }
  },
  async send(p: Person) {
    const temp: FriendRequest = { id: `tmp-${p.uid}`, person: p };
    set((s) => ({ outgoing: [temp, ...s.outgoing], suggestions: s.suggestions.filter((x) => x.uid !== p.uid) }));
    toast(`Demande envoyée à ${p.name}`);
    try {
      const res = await api.post<unknown>('/v1/friend-requests', { receiverId: p.uid });
      const id = isObj(res) ? str(res.id, res.requestId, isObj(res.request) ? res.request.id : '') || (typeof res.id === 'number' ? String(res.id) : '') : '';
      set((s) => ({ outgoing: s.outgoing.map((x) => (x.id === temp.id ? { ...x, id: id || temp.id } : x)) }));
      // Identifiant inconnu : on relit les demandes pour pouvoir annuler plus tard.
      if (!id) {
        const req = await api.get<unknown>('/v1/friend-requests').catch(() => null);
        if (isObj(req)) {
          set({ outgoing: listOf(req.outgoing).map((x) => requestOf(x, false)).filter((x): x is FriendRequest => !!x) });
          enrichProfiles();
        }
      }
    } catch (e) {
      set((s) => ({ outgoing: s.outgoing.filter((x) => x.id !== temp.id), suggestions: [p, ...s.suggestions] }));
      fail(e, 'Impossible d’envoyer la demande pour le moment.');
    }
  },
  async remove(p: Person) {
    const before = friendsStore.get().friends;
    set((s) => ({ friends: s.friends.filter((x) => x.uid !== p.uid) }));
    toast(`${p.name} a été retiré de vos amis`);
    try {
      await api.delete(`/v1/friends/${encodeURIComponent(p.uid)}`);
    } catch (e) {
      set({ friends: before });
      fail(e, 'Impossible de retirer cet ami pour le moment.');
    }
  },
  /** Suggestion masquée sur cet appareil (pas d'API dédiée). */
  dismiss(p: Person) {
    set((s) => ({ dismissed: [...s.dismissed, p.uid], suggestions: s.suggestions.filter((x) => x.uid !== p.uid) }));
    toast('Suggestion masquée');
  },
};

/** À monter une fois (AppShell) pour un compte réel : badge et widget des demandes à jour. */
export function useFriendsSync() {
  const remoteId = useApp((s) => (s.account?.remote ? s.account.id : null));
  useEffect(() => {
    if (!remoteId) {
      set({ status: 'idle', friends: [], incoming: [], outgoing: [], suggestions: [] });
      return;
    }
    void loadFriends();
    const t = window.setInterval(() => document.visibilityState === 'visible' && void loadFriends(false), 120_000);
    return () => window.clearInterval(t);
  }, [remoteId]);
}

export const useFriends = friendsStore.use;
