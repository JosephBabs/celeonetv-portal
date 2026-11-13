import { useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import type { AppNotification, NotificationCategory } from '@/data/types';
import { actions, appStore, useApp } from '@/store/app';
import { toast } from '@/store/ui';

/**
 * Boîte de réception réelle (GET /v1/push/inbox) : la même que l'app mobile.
 * Gardée en mémoire seulement (pas de localStorage) et rafraîchie toutes les minutes.
 * Les comptes de démonstration continuent d'utiliser les notifications fictives du store.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
const parse = (v: unknown): Raw => {
  if (isObj(v)) return v;
  if (typeof v === 'string' && v.trim().startsWith('{')) {
    try {
      const o = JSON.parse(v);
      return isObj(o) ? o : {};
    } catch {
      return {};
    }
  }
  return {};
};

function dateOf(x: Raw) {
  const v = x.createdAtMs ?? x.createdAt ?? x.created_at ?? x.timestamp ?? x.sentAt;
  if (typeof v === 'number' && v > 0) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  if (isObj(v) && typeof v.iso === 'string') return new Date(v.iso).toISOString();
  if (isObj(v) && typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  return new Date().toISOString();
}

/** Type de notification (like, comment, friend_request, message…) → catégorie et lien de la page web. */
function route(type: string, data: Raw): { category: NotificationCategory; action: AppNotification['action'] } {
  const t = type.toLowerCase();
  const postId = str(data.postId, data.post_id, isObj(data.post) ? data.post.id : '', /post/.test(t) ? data.sourceId : '');
  const link = str(data.url, data.link, data.route, data.path);
  if (/call|appel/.test(t)) return { category: 'messages', action: { label: 'Ouvrir les discussions', to: '/discussions' } };
  if (/message|chat|discussion|conversation/.test(t)) return { category: 'messages', action: { label: 'Ouvrir les discussions', to: '/discussions' } };
  if (/friend|ami|follow|abonn/.test(t)) return { category: 'social', action: { label: 'Voir les demandes', to: '/social/amis' } };
  if (/like|react|comment|post|mention|share|tag|publication|page/.test(t) || postId) {
    const official = /page|official|admin|news|annonce/.test(t);
    return {
      category: 'publications',
      action: postId ? { label: 'Voir la publication', to: `${official ? '/accueil' : '/social'}?publication=api-${encodeURIComponent(postId)}` } : { label: 'Voir le fil', to: official ? '/accueil' : '/social' },
    };
  }
  if (/theme|thème/.test(t)) return { category: 'evenements', action: { label: 'Lire le thème', to: '/menu/calendrier/theme-semaine' } };
  if (/event|agenda|culte|live|direct|rappel|reminder/.test(t)) return { category: 'evenements', action: { label: "Ouvrir l'agenda", to: '/agenda' } };
  return { category: 'systeme', action: link.startsWith('/') ? { label: 'Voir', to: link } : { label: 'Voir les notifications', to: '/notifications' } };
}

/** Textes système envoyés en anglais par le serveur. */
const EN: [RegExp, string][] = [
  [/^incoming audio call$/i, 'Appel audio entrant'],
  [/^incoming video call$/i, 'Appel vidéo entrant'],
  [/^missed audio call$/i, 'Appel audio manqué'],
  [/^missed video call$/i, 'Appel vidéo manqué'],
  [/^missed call$/i, 'Appel manqué'],
];
const translate = (s: string) => EN.find(([re]) => re.test(s))?.[1] ?? s;

export function toNotification(input: unknown): AppNotification | null {
  if (!isObj(input)) return null;
  const x: Raw = { ...parse(input.legacy_data), ...parse(input.data), ...input };
  const id = str(x.id, x.public_id, x.notificationId) || (typeof x.id === 'number' ? String(x.id) : '');
  if (!id) return null;
  const data = parse(input.data);
  const title = str(x.title, x.heading, x.subject);
  const body = translate(str(x.description, x.body, x.message, x.text));
  if (!title && !body) return null;
  const { category, action } = route(str(x.type, x.kind, x.category), data);
  const read = x.read === true || x.isRead === true || !!x.read_at || !!x.readAt || /^read$/i.test(str(x.status));
  return { id, category, title: title || 'Cèlè One', body, createdAt: dateOf(x), read, action, remote: true };
}

interface InboxState {
  items: AppNotification[];
  loaded: boolean;
  error?: string;
}
export const inboxStore = createStore<InboxState>(() => ({ items: [], loaded: false }));
const setItems = (fn: (items: AppNotification[]) => AppNotification[]) => inboxStore.set((s) => ({ items: fn(s.items) }));

/** Notifications à supprimer sur le serveur une fois le délai « Annuler » écoulé. */
const pendingDelete = new Map<string, ReturnType<typeof setTimeout>>();

export async function loadInbox() {
  try {
    const res = await api.get<unknown>('/v1/push/inbox');
    const list = Array.isArray(res) ? res : isObj(res) && Array.isArray(res.items) ? res.items : [];
    const items = list
      .map(toNotification)
      .filter((n): n is AppNotification => !!n && !pendingDelete.has(n.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    inboxStore.set({ items, loaded: true, error: undefined });
  } catch (e) {
    inboxStore.set({ loaded: true, error: e instanceof ApiError ? e.message : 'Notifications indisponibles.' });
  }
}

const isRemote = () => !!appStore.get().account?.remote;

/** Liste affichée : boîte réelle pour un compte connecté à l'API, démo sinon. */
export function useNotifications() {
  const remote = useApp((s) => !!s.account?.remote);
  const demo = useApp((s) => s.notifications);
  const inbox = inboxStore.use((s) => s);
  return remote ? { items: inbox.items, loaded: inbox.loaded, error: inbox.error, remote } : { items: demo, loaded: true, error: undefined, remote };
}

export const notifications = {
  markRead(n: AppNotification) {
    if (!n.remote) return actions.markNotificationRead(n.id);
    if (n.read) return;
    setItems((items) => items.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    api.post('/v1/push/inbox/read', { ids: [n.id] }).catch(() => setItems((items) => items.map((i) => (i.id === n.id ? { ...i, read: false } : i))));
  },
  async markAllRead() {
    if (!isRemote()) return actions.markAllNotificationsRead();
    const before = inboxStore.get().items;
    setItems((items) => items.map((i) => ({ ...i, read: true })));
    try {
      await api.post('/v1/push/inbox/read-all');
    } catch {
      inboxStore.set({ items: before });
      toast('Impossible de tout marquer comme lu pour le moment.', { tone: 'danger' });
    }
  },
  /** Suppression avec « Annuler » : le serveur n'est appelé qu'après 5 s. */
  remove(n: AppNotification) {
    if (!n.remote) {
      const removed = actions.deleteNotification(n.id);
      toast('Notification supprimée', { action: removed ? { label: 'Annuler', onClick: () => actions.restoreNotification(removed) } : undefined });
      return;
    }
    setItems((items) => items.filter((i) => i.id !== n.id));
    const timer = setTimeout(() => {
      pendingDelete.delete(n.id);
      api.post('/v1/push/inbox/delete', { ids: [n.id] }).catch(() => {
        setItems((items) => [...items, n].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        toast('Suppression impossible pour le moment.', { tone: 'danger' });
      });
    }, 5000);
    pendingDelete.set(n.id, timer);
    toast('Notification supprimée', {
      duration: 5000,
      action: {
        label: 'Annuler',
        onClick: () => {
          clearTimeout(timer);
          pendingDelete.delete(n.id);
          setItems((items) => [...items, n].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        },
      },
    });
  },
  async clear() {
    if (!isRemote()) return actions.clearNotifications();
    const before = inboxStore.get().items;
    inboxStore.set({ items: [] });
    try {
      await api.post('/v1/push/inbox/delete-all');
    } catch {
      inboxStore.set({ items: before });
      throw new Error('Suppression impossible pour le moment.');
    }
  },
};

/** À monter une fois (AppShell) : charge la boîte et la rafraîchit chaque minute quand l'onglet est visible. */
export function useInboxSync() {
  const remoteId = useApp((s) => (s.account?.remote ? s.account.id : null));
  useEffect(() => {
    if (!remoteId) {
      inboxStore.set({ items: [], loaded: false, error: undefined });
      return;
    }
    void loadInbox();
    const tick = () => document.visibilityState === 'visible' && void loadInbox();
    const timer = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [remoteId]);
}
