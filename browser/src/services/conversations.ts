import { useEffect } from 'react';
import { api, ApiError, getToken } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { appStore, useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { isGenericName, knownProfile, resolveProfiles } from './profiles';
import { absolute } from './streaming';

/**
 * Discussions réelles : GET /v1/conversations, GET|POST /v1/conversations/{id}/messages,
 * POST /v1/conversations/{id}/read, POST /v1/conversations/direct.
 * Pas de temps réel pour l'instant : la discussion ouverte est relue toutes les 5 s, la liste toutes les 30 s.
 * Rien n'est enregistré dans le navigateur (messages privés).
 */

/**
 * Messagerie réelle désactivée pour l'instant (GET /v1/conversations répond en erreur 500 côté serveur) :
 * l'application affiche la messagerie de démonstration. Passer à true pour la réactiver.
 */
export const REAL_DISCUSSIONS = true;

const CHAT_SOCKET_URL = (import.meta.env.VITE_CHAT_SOCKET_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://socket.celeonetv.com';
let chatSocketPromise: Promise<import('socket.io-client').Socket> | null = null;

async function getChatSocket() {
  if (!getToken()) throw new ApiError(401, 'Votre session a expiré. Reconnectez-vous.');
  if (!chatSocketPromise) {
    chatSocketPromise = (async () => {
      const socketModule = await import('socket.io-client');
      const tokenResponse = await api.post<{ token?: string; access_token?: string }>('/socket/token');
      const socketToken = tokenResponse?.token || tokenResponse?.access_token;
      if (!socketToken) throw new Error('Jeton de messagerie indisponible.');
      const socket = socketModule.io(CHAT_SOCKET_URL, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        auth: { token: socketToken },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        timeout: 15000,
      });
      const onManagerReconnect = async () => {
        try {
          const refreshed = await api.post<{ token?: string; access_token?: string }>('/socket/token');
          const nextToken = refreshed?.token || refreshed?.access_token;
          if (nextToken) socket.auth = { token: nextToken };
        } catch { /* Existing socket session can still recover with its current token. */ }
      };
      socket.io.on('reconnect_attempt', onManagerReconnect);
      await new Promise<void>((resolve, reject) => {
        if (socket.connected) return resolve();
        const timeout = window.setTimeout(() => finish(new Error('Connexion au service de messagerie expirée.')), 15000);
        const onConnect = () => finish();
        const onError = () => finish(new Error('Impossible de joindre le service de messagerie.'));
        const finish = (error?: Error) => {
          window.clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
          if (error) reject(error); else resolve();
        };
        socket.once('connect', onConnect);
        socket.once('connect_error', onError);
      });
      return socket;
    })().catch((error) => {
      chatSocketPromise = null;
      throw error;
    });
  }
  const socket = await chatSocketPromise;
  if (!socket.connected) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => finish(new Error('Connexion au service de messagerie expirée.')), 15000);
      const onConnect = () => finish();
      const onError = () => finish(new Error('Impossible de joindre le service de messagerie.'));
      const finish = (error?: Error) => {
        window.clearTimeout(timeout);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        if (error) reject(error); else resolve();
      };
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      socket.connect();
    });
  }
  return socket;
}

async function sendOverChatSocket(convId: string, clientId: string, payload: Record<string, unknown>) {
  const socket = await getChatSocket();
  return new Promise<unknown>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Le serveur n’a pas confirmé l’envoi.')), 20000);
    socket.emit('msg:send', { chatId: convId, clientId, requestId: clientId, payload }, (ack: unknown) => {
      window.clearTimeout(timer);
      if (isObj(ack) && (ack.ok === false || ack.status === 'failed')) {
        reject(new Error(str(ack.error, ack.message) || 'Message refusé par le serveur.'));
        return;
      }
      resolve(ack);
    });
  });
}

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
};
const dateOf = (...vals: unknown[]) => {
  for (const v of vals) {
    if (typeof v === 'number' && v > 0) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
    if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
    if (isObj(v) && typeof v.iso === 'string') return new Date(v.iso).toISOString();
    if (isObj(v) && typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  }
  return '';
};
const FALLBACK = 'Membre CélèOne';

export interface ChatMember {
  uid: string;
  userId?: string;
  name: string;
  avatar?: string;
}

export interface RemoteConversation {
  id: string;
  title: string;
  avatar?: string;
  isGroup: boolean;
  members: ChatMember[];
  /** Interlocuteur d'une discussion à deux. */
  other?: ChatMember;
  lastText: string;
  lastAt: string;
  lastMine: boolean;
  unread: number;
}

export interface RemoteMessage {
  id: string;
  clientId?: string;
  authorUid: string;
  mine: boolean;
  text: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'read' | 'failed';
  image?: string;
  kind: string;
  replyText?: string;
}

/* ───────────── Lecture tolérante ───────────── */

function me() {
  const a = appStore.get().account;
  return { uid: a?.uid ?? '', id: a?.id ?? '' };
}

function toMember(v: unknown): ChatMember | null {
  if (typeof v === 'string' || typeof v === 'number') {
    const uid = String(v);
    const k = knownProfile(uid);
    return { uid, name: k?.name ?? FALLBACK, avatar: k?.avatar };
  }
  if (!isObj(v)) return null;
  const u = isObj(v.user) ? { ...v.user, ...v } : v;
  const uid = str(u.firebase_uid, u.uid, u.user_uid, u.userUid, u.public_id, u.id, u.user_id);
  if (!uid) return null;
  const full = [str(u.firstName, u.first_name), str(u.lastName, u.last_name)].filter(Boolean).join(' ');
  const name = [u.displayName, u.display_name, u.name, full, u.username].map((n) => str(n)).find((n) => n && !isGenericName(n)) || knownProfile(uid)?.name || FALLBACK;
  return {
    uid,
    userId: str(u.user_id, typeof u.id === 'number' ? u.id : undefined) || undefined,
    name,
    avatar: absolute(str(u.avatar, u.avatar_url, u.avatarUrl, u.photoURL, u.photoUrl, u.profileImage, u.profile_image)) || knownProfile(uid)?.avatar || undefined,
  };
}

const isMe = (m: { uid?: string; userId?: string }) => {
  const { uid, id } = me();
  return (!!uid && m.uid === uid) || (!!id && (m.userId === id || m.uid === id));
};

export function toConversation(input: unknown): RemoteConversation | null {
  if (!isObj(input)) return null;
  const x: Raw = isObj(input.conversation) ? { ...input.conversation, ...input } : input;
  const id = str(x.id, x.public_id, x.conversation_id, x.uuid, x.chatId);
  if (!id) return null;
  const rawMembers = [x.members, x.participants, x.users, x.profiles, x.memberProfiles, x.participantIds, x.memberIds].find((v) => Array.isArray(v) && v.length) as unknown[] | undefined;
  const members = (rawMembers ?? []).map(toMember).filter((m): m is ChatMember => !!m);
  const roomIsGroup = x.is_group === true || x.isGroup === true || str(x.type, x.kind).toLowerCase() === 'group';
  const memberIds = [...new Set([...(Array.isArray(x.members) ? x.members : []), ...(Array.isArray(x.participants) ? x.participants : []), ...(Array.isArray(x.memberIds) ? x.memberIds : []), ...(Array.isArray(x.participantIds) ? x.participantIds : [])].map((v) => typeof v === 'object' && v ? str((v as Raw).uid, (v as Raw).user_uid, (v as Raw).firebase_uid, (v as Raw).id, (v as Raw).user_id) : str(v)).filter(Boolean))];
  const roomId = str(x.id, x.public_id, x.conversation_id, x.uuid, x.chatId);
  const currentUid = me().uid || me().id;
  const peerUid = memberIds.find((uid) => uid !== currentUid) || (() => {
    if (!roomId.startsWith('dm_')) return '';
    const pair = roomId.slice(3).split('_');
    return pair.length === 2 ? pair.find((uid) => uid !== currentUid) ?? '' : '';
  })();
  if (peerUid && !members.some((m) => m.uid === peerUid)) {
    const peer = toMember(peerUid);
    if (peer) members.push(peer);
  }
  const others = members.filter((m) => !isMe(m));
  const isGroup = roomIsGroup || (others.length > 1 && memberIds.length !== 2);
  const other = !isGroup ? others[0] ?? (isObj(x.other) ? toMember(x.other) ?? undefined : isObj(x.peer) ? toMember(x.peer) ?? undefined : undefined) : undefined;
  const last = [x.last_message, x.lastMessage, x.latest_message, x.latestMessage].find(isObj) ?? {};
  const lastSender = str(last.sender_uid, last.senderId, last.sender_id, last.user_id, last.authorId, isObj(last.sender) ? str(last.sender.uid, last.sender.id) : '');
  const rawTitle = str(x.title, x.name, x.group_name, x.groupName);
  const validTitle = rawTitle && !/^(direct message|discussion|chat room|user)$/i.test(rawTitle) && !/^dm_/i.test(rawTitle);
  const title = (validTitle ? rawTitle : '') || other?.name || others.map((m) => m.name.split(' ')[0]).join(', ') || 'Discussion';
  return {
    id,
    title,
    avatar: absolute(str(x.avatar, x.avatar_url, x.photoURL, x.image)) || other?.avatar || undefined,
    isGroup,
    members,
    other,
    lastText: str(last.text, last.body, last.content, last.message, x.lastMessagePreview, x.last_message_text, x.lastMessageText, typeof x.last_message === 'string' ? x.last_message : '') || (str(last.type) && !/text/i.test(str(last.type)) ? 'Pièce jointe' : ''),
    lastAt: dateOf(last.created_at, last.createdAt, x.lastMessageAtMs, x.last_message_at, x.lastMessageAt, x.updatedAtMs, x.updated_at, x.updatedAt, x.createdAtMs, x.created_at),
    lastMine: (() => { const s = lastSender || str(x.lastMessageSenderId, x.lastSenderId); return !!s && isMe({ uid: s, userId: s }); })(),
    unread: Number(isObj(x.unreadBy) ? x.unreadBy[me().uid] : (x.unread_count ?? x.unreadCount ?? x.unread ?? 0)) || 0,
  };
}

export function toMessage(input: unknown): RemoteMessage | null {
  if (!isObj(input)) return null;
  const x: Raw = isObj(input.message) ? { ...input.message, ...input } : input;
  const id = str(x.id, x.public_id, x.message_id, x.client_id);
  if (!id) return null;
  const sender = isObj(x.sender) ? x.sender : isObj(x.user) ? x.user : isObj(x.author) ? x.author : {};
  const authorUid = str(x.sender_uid, x.senderUid, x.sender_firebase_uid, sender.firebase_uid, sender.uid, x.senderId, x.authorId, x.from, sender.id, x.sender_id, x.user_id);
  const userId = str(x.sender_id, x.user_id, typeof sender.id === 'number' ? sender.id : undefined);
  const meta = isObj(x.metadata) ? x.metadata : typeof x.metadata === 'string' && x.metadata.trim().startsWith('{') ? (() => { try { return JSON.parse(x.metadata as string) as Raw; } catch { return {}; } })() : {};
  const attachments = Array.isArray(x.attachments) ? x.attachments : Array.isArray(x.media) ? x.media : [];
  const image = absolute(str(x.image, x.image_url, x.imageUrl, meta.imageUrl, meta.image, meta.url, ...attachments.map((a) => (isObj(a) && /image/i.test(str(a.type, a.mime)) ? str(a.url) : ''))));
  const reply = isObj(x.reply_to) ? x.reply_to : isObj(x.replyTo) ? x.replyTo : {};
  const read = x.read === true || !!x.read_at || !!x.readAt || /read|seen|lu/i.test(str(x.status)) || (Array.isArray(x.readBy) && x.readBy.some((u) => String(u) !== authorUid));
  return {
    id,
    clientId: str(x.client_id, x.clientId) || undefined,
    authorUid,
    mine: isMe({ uid: authorUid, userId }),
    text: x.deleted === true || x.deletedForAll === true ? 'Ce message a été supprimé' : str(x.text, x.body, x.content, x.message, x.caption),
    createdAt: dateOf(x.created_at, x.createdAtMs, x.createdAt, x.sent_at, x.sentAt, x.timestamp) || new Date().toISOString(),
    status: read ? 'read' : 'sent',
    image: image || undefined,
    kind: str(x.type, x.kind) || 'text',
    replyText: str(reply.text, reply.body) || undefined,
  };
}

const listOf = (res: unknown): unknown[] => (Array.isArray(res) ? res : isObj(res) ? ((['items', 'data', 'conversations', 'messages'].map((k) => res[k]).find(Array.isArray) as unknown[] | undefined) ?? []) : []);

/* ───────────── Store ───────────── */

interface ConvState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** « api » : /v1/conversations ; « legacy » : collection Firebase « chats » (accès générique /v1/resources). */
  source: 'api' | 'legacy';
  list: RemoteConversation[];
  messages: Record<string, { items: RemoteMessage[]; status: 'loading' | 'ready' | 'error' }>;
}
export const convStore = createStore<ConvState>(() => ({ status: 'idle', source: 'api', list: [], messages: {} }));
const set = convStore.set;
export const useConversations = convStore.use;

/** Noms et photos manquants (nom générique) : lus dans la fiche publique des membres. */
function enrichMembers() {
  const need = convStore.get().list.flatMap((c) => c.members).filter((m) => m.name === FALLBACK || !m.avatar).map((m) => m.uid);
  if (!need.length) return;
  void resolveProfiles(need, (uid, prof) => {
    const fix = (m: ChatMember): ChatMember => (m.uid === uid ? { ...m, name: m.name === FALLBACK && prof.name ? prof.name : m.name, avatar: m.avatar ?? prof.avatar } : m);
    set((s) => ({
      list: s.list.map((c) => {
        const members = c.members.map(fix);
        const other = c.other ? fix(c.other) : undefined;
        const generic = !c.isGroup && (c.title === FALLBACK || c.title === 'Discussion');
        return { ...c, members, other, title: generic && other ? other.name : c.title, avatar: c.avatar ?? other?.avatar };
      }),
    }));
  });
}

/* ───────────── Secours : collection Firebase « chats » ───────────── */

/** Documents { id, data } de l'accès générique → objets plats. */
const docsOf = (res: unknown): Raw[] =>
  listOf(res)
    .filter(isObj)
    .map((d) => (isObj(d.data) ? { ...d.data, id: d.id ?? d.data.id } : d));

const PARTICIPANT_FIELDS = ['participants', 'participantIds', 'members', 'memberIds', 'users', 'userIds'];
let legacyField: string | null = null;
/** Collection de l'app mobile (Messages/index.tsx) : « chatrooms », filtrée sur members OU participants. */
const ROOMS = 'chatrooms';
let msgCollection: 'chatrooms' | 'chats' = 'chatrooms';

async function roomsBy(collection: string, field: string, uid: string): Promise<Raw[]> {
  const res = await api.get<unknown>(`/v1/resources/${collection}`, { 'filter[]': JSON.stringify({ field, operator: 'array-contains', value: uid }), per_page: 120 });
  return docsOf(res);
}

/** Discussions de l'app mobile : chatrooms où je suis dans members ou participants (même requête que fetchChatRooms de l'app). */
async function legacyConversations(): Promise<unknown[]> {
  const uid = me().uid;
  if (!uid) throw new Error('uid inconnu');
  const settled = await Promise.allSettled([roomsBy(ROOMS, 'members', uid), roomsBy(ROOMS, 'participants', uid)]);
  const ok = settled.filter((r): r is PromiseFulfilledResult<Raw[]> => r.status === 'fulfilled');
  if (ok.length) {
    const byId = new Map<string, Raw>();
    ok.flatMap((r) => r.value).forEach((d) => {
      const id = str(d.id);
      if (!id) return;
      const prev = byId.get(id);
      byId.set(id, prev ? { ...prev, ...d } : d);
    });
    // Membres : union members + participants (comme l'app), sans doublon.
    const rooms = [...byId.values()].map((d) => ({ ...d, members: [...new Set([...(Array.isArray(d.members) ? d.members : []), ...(Array.isArray(d.participants) ? d.participants : [])].map(String))] }));
    if (rooms.length) {
      msgCollection = 'chatrooms';
      return rooms;
    }
  }
  // Dernier recours : ancienne collection « chats » (modèle compatible du modèle de chat).
  for (const field of legacyField ? [legacyField] : PARTICIPANT_FIELDS) {
    try {
      const docs = await roomsBy('chats', field, uid);
      if (docs.length || legacyField) {
        legacyField = field;
        msgCollection = 'chats';
        return docs;
      }
    } catch {
      /* champ suivant */
    }
  }
  return [];
}

async function fetchConversations(): Promise<{ rows: unknown[]; source: 'api' | 'legacy' }> {
  if (convStore.get().source === 'api') {
    try {
      return { rows: listOf(await api.get<unknown>('/v1/conversations', { limit: 50 })), source: 'api' };
    } catch {
      /* /v1/conversations en erreur côté serveur : on essaie la collection de l'app mobile */
    }
  }
  return { rows: await legacyConversations(), source: 'legacy' };
}

export async function loadConversations() {
  if (convStore.get().status !== 'ready') set({ status: 'loading' });
  try {
    const { rows, source } = await fetchConversations();
    if (source === 'legacy' && rows.length === 0 && convStore.get().source === 'api') throw new Error('aucune source');
    set({ source });
    const list = rows.map(toConversation).filter((c): c is RemoteConversation => !!c);
    list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    // Conserve les noms déjà complétés lors d'un rafraîchissement.
    const prev = new Map(convStore.get().list.map((c) => [c.id, c]));
    set({
      status: 'ready',
      list: list.map((c) => {
        const p = prev.get(c.id);
        if (!p) return c;
        const named = (m: ChatMember) => (m.name === FALLBACK ? p.members.find((x) => x.uid === m.uid) ?? m : m);
        return { ...c, members: c.members.map(named), other: c.other ? named(c.other) : p.other, title: c.title === FALLBACK || c.title === 'Discussion' ? p.title : c.title, avatar: c.avatar ?? p.avatar };
      }),
    });
    enrichMembers();
  } catch {
    if (convStore.get().status !== 'ready') set({ status: 'error' });
  }
}

export async function loadMessages(convId: string) {
  const cur = convStore.get().messages[convId];
  if (!cur) set((s) => ({ messages: { ...s.messages, [convId]: { items: [], status: 'loading' } } }));
  try {
    const res =
      convStore.get().source === 'legacy'
        ? docsOf(
            await api
              .get<unknown>(`/v1/resources/${msgCollection}/${encodeURIComponent(convId)}/messages`, { per_page: 60, sort: msgCollection === 'chatrooms' ? 'createdAtMs' : 'createdAt', direction: 'desc' })
              .catch(() => api.get<unknown>(`/v1/resources/${msgCollection}/${encodeURIComponent(convId)}/messages`, { per_page: 200 })),
          )
        : await api.get<unknown>(`/v1/conversations/${encodeURIComponent(convId)}/messages`, { limit: 60 });
    const fresh = listOf(res).map(toMessage).filter((m): m is RemoteMessage => !!m).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    set((s) => {
      // Messages en cours d'envoi (pas encore relus du serveur) gardés à la fin.
      const pending = (s.messages[convId]?.items ?? []).filter((m) => (m.status === 'sending' || m.status === 'failed') && !fresh.some((f) => f.clientId && f.clientId === m.clientId));
      return { messages: { ...s.messages, [convId]: { items: [...fresh, ...pending], status: 'ready' } } };
    });
  } catch {
    if (!cur) set((s) => ({ messages: { ...s.messages, [convId]: { items: [], status: 'error' } } }));
  }
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export async function sendMessage(convId: string, text: string, retry?: RemoteMessage) {
  const clientId = retry?.clientId ?? uuid();
  const temp: RemoteMessage = retry ? { ...retry, status: 'sending' } : { id: `tmp-${clientId}`, clientId, authorUid: me().uid, mine: true, text, createdAt: new Date().toISOString(), status: 'sending', kind: 'text' };
  const put = (fn: (items: RemoteMessage[]) => RemoteMessage[]) => set((s) => ({ messages: { ...s.messages, [convId]: { status: 'ready', items: fn(s.messages[convId]?.items ?? []) } } }));
  put((items) => (retry ? items.map((m) => (m.id === retry.id ? temp : m)) : [...items, temp]));
  set((s) => ({ list: s.list.map((c) => (c.id === convId ? { ...c, lastText: text, lastAt: temp.createdAt, lastMine: true } : c)).sort((a, b) => b.lastAt.localeCompare(a.lastAt)) }));
  try {
    if (convStore.get().source === 'legacy') {
      const a = appStore.get().account;
      const now = Date.now();
      const ack = await sendOverChatSocket(convId, clientId, {
        text, type: 'text', createdAtMs: now,
        from: { uid: me().uid, name: `${a?.firstName ?? ''} ${a?.lastName ?? ''}`.trim(), avatar: a?.avatar ?? '' },
      });
      const response = isObj(ack) ? ack : {};
      const saved = toMessage(isObj(response.message) ? response.message : response);
      put((items) => items.map((m) => (m.id === temp.id ? { ...(saved ?? m), mine: true, status: 'sent', clientId } : m)));
      return;
    }
    const res = await api.post<unknown>(`/v1/conversations/${encodeURIComponent(convId)}/messages`, { client_id: clientId, type: 'text', text });
    const saved = toMessage(isObj(res) && isObj(res.message) ? res.message : res);
    put((items) => items.map((m) => (m.id === temp.id ? { ...(saved ?? temp), mine: true, status: 'sent', clientId } : m)));
  } catch (e) {
    put((items) => items.map((m) => (m.id === temp.id ? { ...m, status: 'failed' } : m)));
    toast(e instanceof ApiError ? e.message : 'Message non envoyé. Vérifiez votre connexion.', { tone: 'danger' });
  }
}

export function markConversationRead(convId: string) {
  const c = convStore.get().list.find((x) => x.id === convId);
  if (c?.unread) set((s) => ({ list: s.list.map((x) => (x.id === convId ? { ...x, unread: 0 } : x)) }));
  if (convStore.get().source === 'legacy') return; // les accusés de lecture de l'app passent par le socket (msg:receipt)
  void api.post(`/v1/conversations/${encodeURIComponent(convId)}/read`).catch(() => undefined);
}

/** Ouvre (ou crée) la discussion directe avec un membre ; renvoie son identifiant. */
export async function openDirect(uid: string): Promise<string | null> {
  const existing = convStore.get().list.find((c) => !c.isGroup && c.other?.uid === uid);
  if (existing) return existing.id;
  try {
    const res = await api.post<unknown>('/v1/conversations/direct', { user_uid: uid, firebase_uid: uid });
    const conv = toConversation(res);
    if (conv) {
      set((s) => ({ list: [conv, ...s.list.filter((c) => c.id !== conv.id)] }));
      enrichMembers();
      return conv.id;
    }
    const id = isObj(res) ? str(res.id, res.conversation_id, isObj(res.conversation) ? res.conversation.id : '') : '';
    if (id) void loadConversations();
    return id || null;
  } catch (e) {
    toast(e instanceof ApiError ? e.message : 'Impossible d’ouvrir la discussion pour le moment.', { tone: 'danger' });
    return null;
  }
}

/** À monter une fois (AppShell) : liste rafraîchie (badge des messages non lus). */
export function useConversationsSync() {
  const remoteId = useApp((s) => (REAL_DISCUSSIONS && s.account?.remote ? s.account.id : null));
  useEffect(() => {
    if (!remoteId) {
      set({ status: 'idle', source: 'api', list: [], messages: {} });
      return;
    }
    void loadConversations();
    const t = window.setInterval(() => document.visibilityState === 'visible' && void loadConversations(), 30_000);
    return () => window.clearInterval(t);
  }, [remoteId]);
}

/** Discussion ouverte : relue toutes les 5 s tant qu'elle est affichée. */
export function useLiveMessages(convId: string | undefined) {
  useEffect(() => {
    if (!convId) return;
    void loadMessages(convId);
    markConversationRead(convId);
    const t = window.setInterval(() => document.visibilityState === 'visible' && void loadMessages(convId), 5000);
    return () => window.clearInterval(t);
  }, [convId]);
}
