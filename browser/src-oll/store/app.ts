import { createStore } from '@/lib/createStore';
import { uid } from '@/lib/utils';
import { seedOfficialPosts } from '@/data/home';
import { seedNotifications } from '@/data/notifications';
import { seedSocialPosts, seedStatuses, seedVibes } from '@/data/social';
import type { AppNotification, Comment, Post, Status, StatusItem, Vibe } from '@/data/types';
import { getToken, setToken, setUnauthorizedHandler } from '@/lib/api';
import { authService } from '@/services/auth';

export interface Account {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string;
  parish: string;
  phone: string;
  hue: number;
  avatar?: string;
  cover?: string;
  bio?: string;
  email?: string;
  hidePhone?: boolean;
  hideEmail?: boolean;
  /** Compte connecté à la vraie API (sinon : compte de démonstration). */
  remote?: boolean;
  /** uid Firebase historique (utilisé par l'API dans likedBy, authorId…). */
  uid?: string;
}

interface AppState {
  account: Account | null;
  rememberedAccounts: Account[];
  language: string;
  officialPosts: Post[];
  socialPosts: Post[];
  liked: Record<string, boolean>;
  saved: Record<string, boolean>;
  hiddenPosts: string[];
  notifications: AppNotification[];
  friendRequests: string[];
  sentRequests: string[];
  friends: string[];
  blocked: string[];
  dismissedSuggestions: string[];
  following: string[];
  statuses: Status[];
  myStatus: StatusItem[];
  seenStatuses: string[];
  vibes: Vibe[];
  recentSearches: string[];
  onboarding: Record<string, boolean>;
  accountMode: 'personnel' | 'page';
}

const initialState = (): AppState => ({
  account: null,
  rememberedAccounts: [],
  language: 'fr',
  officialPosts: seedOfficialPosts(),
  socialPosts: seedSocialPosts(),
  liked: {},
  saved: {},
  hiddenPosts: [],
  notifications: seedNotifications(),
  friendRequests: ['fiacre', 'mireille', 'daniel'],
  sentRequests: ['pascal'],
  friends: ['grace', 'joel', 'rachel', 'benedicte', 'ruth', 'samuel'],
  blocked: [],
  dismissedSuggestions: [],
  following: ['celeone-officiel', 'chorale', 'rachel'],
  statuses: seedStatuses(),
  myStatus: [],
  seenStatuses: [],
  vibes: seedVibes(),
  recentSearches: [],
  onboarding: {},
  accountMode: 'personnel',
});

export const appStore = createStore(initialState, { key: 'celeone-web-demo', version: 3 });
export const useApp = appStore.use;

const set = appStore.set;

/** Applique une transformation à une publication, qu'elle soit officielle ou communautaire. */
function mapPost(id: string, fn: (p: Post) => Post) {
  set((s) => ({
    officialPosts: s.officialPosts.map((p) => (p.id === id ? fn(p) : p)),
    socialPosts: s.socialPosts.map((p) => (p.id === id ? fn(p) : p)),
  }));
}

export function findPost(id: string): Post | undefined {
  const s = appStore.get();
  return s.officialPosts.find((p) => p.id === id) ?? s.socialPosts.find((p) => p.id === id);
}

export const actions = {
  login(account: Account) {
    set((s) => ({
      account,
      // Seuls les vrais comptes (connectés via l'API) sont mémorisés sur l'appareil.
      rememberedAccounts: account.remote ? [account, ...s.rememberedAccounts.filter((a) => a.id !== account.id)].slice(0, 4) : s.rememberedAccounts,
    }));
  },
  logout() {
    const account = appStore.get().account;
    set({ account: null });
    if (account?.remote) void authService.logout();
  },
  /** Recharge le profil depuis l'API en gardant les réglages locaux (bio, couverture…). */
  async refreshAccount() {
    const current = appStore.get().account;
    if (!current?.remote || !getToken()) return;
    try {
      const fresh = await authService.me();
      const keepLocalName = current.firstName && fresh.firstName === 'Membre';
      actions.updateAccount({ ...fresh, ...(keepLocalName ? { firstName: current.firstName, lastName: current.lastName } : {}), bio: current.bio, cover: current.cover, avatar: fresh.avatar ?? current.avatar });
    } catch {
      /* hors ligne ou session expirée (gérée par le client API) */
    }
  },
  forgetAccount(id: string) {
    set((s) => ({ rememberedAccounts: s.rememberedAccounts.filter((a) => a.id !== id) }));
  },
  updateAccount(patch: Partial<Account>) {
    set((s) => {
      if (!s.account) return {};
      const account = { ...s.account, ...patch };
      // Le profil mémorisé sur l'écran de connexion suit les modifications (nom, photo…).
      return { account, rememberedAccounts: s.rememberedAccounts.map((a) => (a.id === account.id ? account : a)) };
    });
  },
  setLanguage(language: string) {
    set({ language });
  },
  setAccountMode(accountMode: AppState['accountMode']) {
    set({ accountMode });
  },
  resetDemo() {
    const account = appStore.get().account;
    appStore.reset();
    if (account) set({ account });
  },

  /* ─── Publications ─── */
  toggleLike(postId: string) {
    set((s) => ({ liked: { ...s.liked, [postId]: !s.liked[postId] } }));
  },
  toggleSave(postId: string) {
    const saved = !appStore.get().saved[postId];
    set((s) => ({ saved: { ...s.saved, [postId]: saved } }));
    return saved;
  },
  hidePost(postId: string) {
    set((s) => ({ hiddenPosts: [...s.hiddenPosts, postId] }));
  },
  unhidePost(postId: string) {
    set((s) => ({ hiddenPosts: s.hiddenPosts.filter((id) => id !== postId) }));
  },
  addComment(postId: string, text: string) {
    const comment: Comment = { id: uid('c'), authorId: 'me', text, createdAt: new Date().toISOString() };
    mapPost(postId, (p) => ({ ...p, comments: [...p.comments, comment] }));
  },
  sharePost(postId: string) {
    mapPost(postId, (p) => ({ ...p, shares: p.shares + 1 }));
  },
  createPost(post: Omit<Post, 'id' | 'authorId' | 'kind' | 'tag' | 'createdAt' | 'likes' | 'shares' | 'comments'>) {
    const created: Post = {
      ...post,
      id: uid('s'),
      authorId: 'me',
      kind: 'communaute',
      tag: post.audience === 'amis' ? 'Amis' : 'Public',
      createdAt: new Date().toISOString(),
      likes: 0,
      shares: 0,
      comments: [],
    };
    set((s) => ({ socialPosts: [created, ...s.socialPosts] }));
    return created;
  },
  updatePost(postId: string, patch: Partial<Post>) {
    mapPost(postId, (p) => ({ ...p, ...patch }));
  },
  deletePost(postId: string) {
    set((s) => ({ socialPosts: s.socialPosts.filter((p) => p.id !== postId) }));
  },
  togglePin(postId: string) {
    mapPost(postId, (p) => ({ ...p, pinned: !p.pinned }));
  },
  toggleFollow(memberId: string) {
    const following = appStore.get().following.includes(memberId);
    set((s) => ({ following: following ? s.following.filter((f) => f !== memberId) : [...s.following, memberId] }));
    return !following;
  },

  /* ─── Statuts & Cele Vibes ─── */
  addStatus(item: Omit<StatusItem, 'id' | 'createdAt'>) {
    set((s) => ({ myStatus: [...s.myStatus, { ...item, id: uid('st'), createdAt: new Date().toISOString() }] }));
  },
  deleteStatus(id: string) {
    set((s) => ({ myStatus: s.myStatus.filter((i) => i.id !== id) }));
  },
  markStatusSeen(authorId: string) {
    set((s) => (s.seenStatuses.includes(authorId) ? {} : { seenStatuses: [...s.seenStatuses, authorId] }));
  },
  createVibe(vibe: Pick<Vibe, 'caption' | 'scene' | 'audience'>) {
    const created: Vibe = { ...vibe, id: uid('v'), authorId: 'me', views: 0, likes: 0, shares: 0, comments: [], createdAt: new Date().toISOString() };
    set((s) => ({ vibes: [created, ...s.vibes] }));
    return created;
  },
  commentVibe(vibeId: string, text: string) {
    const comment: Comment = { id: uid('c'), authorId: 'me', text, createdAt: new Date().toISOString() };
    set((s) => ({ vibes: s.vibes.map((v) => (v.id === vibeId ? { ...v, comments: [...v.comments, comment] } : v)) }));
  },
  viewVibe(vibeId: string) {
    set((s) => ({ vibes: s.vibes.map((v) => (v.id === vibeId ? { ...v, views: v.views + 1 } : v)) }));
  },
  shareVibe(vibeId: string) {
    set((s) => ({ vibes: s.vibes.map((v) => (v.id === vibeId ? { ...v, shares: v.shares + 1 } : v)) }));
  },
  deleteVibe(vibeId: string) {
    set((s) => ({ vibes: s.vibes.filter((v) => v.id !== vibeId) }));
  },

  /* ─── Notifications ─── */
  markNotificationRead(id: string) {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },
  markAllNotificationsRead() {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
  deleteNotification(id: string) {
    const removed = appStore.get().notifications.find((n) => n.id === id);
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    return removed;
  },
  restoreNotification(n: AppNotification) {
    set((s) => ({ notifications: [...s.notifications, n].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
  },
  clearNotifications() {
    set({ notifications: [] });
  },
  pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    set((s) => ({ notifications: [{ ...n, id: uid('n'), createdAt: new Date().toISOString(), read: false }, ...s.notifications] }));
  },

  /* ─── Amis ─── */
  acceptFriend(id: string) {
    set((s) => ({ friendRequests: s.friendRequests.filter((f) => f !== id), friends: [...s.friends, id] }));
  },
  declineFriend(id: string) {
    set((s) => ({ friendRequests: s.friendRequests.filter((f) => f !== id) }));
  },
  sendFriendRequest(id: string) {
    set((s) => ({ sentRequests: [...s.sentRequests, id] }));
  },
  cancelFriendRequest(id: string) {
    set((s) => ({ sentRequests: s.sentRequests.filter((f) => f !== id) }));
  },
  removeFriend(id: string) {
    set((s) => ({ friends: s.friends.filter((f) => f !== id) }));
  },
  blockMember(id: string) {
    set((s) => ({ friends: s.friends.filter((f) => f !== id), blocked: [...s.blocked, id], friendRequests: s.friendRequests.filter((f) => f !== id) }));
  },
  dismissSuggestion(id: string) {
    set((s) => ({ dismissedSuggestions: [...s.dismissedSuggestions, id] }));
  },
  unblockMember(id: string) {
    set((s) => ({ blocked: s.blocked.filter((b) => b !== id) }));
  },

  /* ─── Divers ─── */
  pushRecentSearch(q: string) {
    const query = q.trim();
    if (!query) return;
    set((s) => ({ recentSearches: [query, ...s.recentSearches.filter((r) => r !== query)].slice(0, 6) }));
  },
  clearRecentSearches() {
    set({ recentSearches: [] });
  },
  setOnboardingDone(key: string) {
    set((s) => ({ onboarding: { ...s.onboarding, [key]: true } }));
  },
};

export function accountName(a: Account) {
  return `${a.firstName} ${a.lastName}`.trim();
}

// Session expirée côté serveur : on déconnecte localement (l'écran de connexion s'affiche).
setUnauthorizedHandler(() => {
  if (appStore.get().account?.remote) {
    setToken(null);
    appStore.set({ account: null });
  }
});

// Nettoyage des anciens profils de démonstration mémorisés sur cet appareil.
if (appStore.get().rememberedAccounts.some((a) => !a.remote)) {
  appStore.set((s) => ({ rememberedAccounts: s.rememberedAccounts.filter((a) => a.remote) }));
}
