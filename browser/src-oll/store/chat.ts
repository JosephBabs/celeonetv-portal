import { useMemo } from 'react';
import { createStore } from '@/lib/createStore';
import { useApp } from '@/store/app';
import { REAL_DISCUSSIONS, useConversations } from '@/services/conversations';
import { uid } from '@/lib/utils';
import { autoReplies, seedCalls, seedConversations } from '@/data/chats';
import { getMember } from '@/data/members';
import type { CallLog, ChatMessage, Conversation } from '@/data/types';

export interface ChatSettings {
  enterToSend: boolean;
  readReceipts: boolean;
  notifications: boolean;
  previews: boolean;
  wallpaper: 'menthe' | 'blanc' | 'nuit' | 'motif';
  fontSize: 'petite' | 'normale' | 'grande';
}

interface ChatState {
  conversations: Conversation[];
  calls: CallLog[];
  settings: ChatSettings;
}

export const chatStore = createStore<ChatState>(
  () => ({
    conversations: seedConversations(),
    calls: seedCalls(),
    settings: { enterToSend: true, readReceipts: true, notifications: true, previews: true, wallpaper: 'motif', fontSize: 'normale' },
  }),
  { key: 'celeone-web-chat', version: 1 },
);
export const useChat = chatStore.use;

/** État éphémère (non persistant) : qui est en train d'écrire, appel en cours. */
export const liveStore = createStore<{ typing: Record<string, string | null>; call: { memberId: string; kind: 'audio' | 'video'; startedAt: number } | null }>(() => ({ typing: {}, call: null }));
export const useLive = liveStore.use;

const set = chatStore.set;

function mapConv(id: string, fn: (c: Conversation) => Conversation) {
  set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)) }));
}

function setMessageStatus(convId: string, msgId: string, status: ChatMessage['status']) {
  mapConv(convId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status } : m)) }));
}

function scheduleReply(conv: Conversation, lastMsgId: string) {
  const responder = conv.isGroup ? conv.memberIds[Math.floor(Math.random() * conv.memberIds.length)] : conv.memberIds[0];
  if (!getMember(responder).online && !conv.isGroup && Math.random() < 0.4) return;
  window.setTimeout(() => {
    if (chatStore.get().settings.readReceipts) setMessageStatus(conv.id, lastMsgId, 'read');
    liveStore.set((s) => ({ typing: { ...s.typing, [conv.id]: responder } }));
  }, 1800);
  window.setTimeout(() => {
    liveStore.set((s) => ({ typing: { ...s.typing, [conv.id]: null } }));
    const reply: ChatMessage = { id: uid('m'), authorId: responder, text: autoReplies[Math.floor(Math.random() * autoReplies.length)], createdAt: new Date().toISOString() };
    const isOpen = window.location.pathname === `/discussions/${conv.id}`;
    mapConv(conv.id, (c) => ({ ...c, messages: [...c.messages, reply], unread: isOpen ? 0 : c.unread + 1 }));
  }, 4200);
}

export const chat = {
  send(convId: string, msg: Omit<ChatMessage, 'id' | 'authorId' | 'createdAt' | 'status'>) {
    const message: ChatMessage = { ...msg, id: uid('m'), authorId: 'me', createdAt: new Date().toISOString(), status: 'sending' };
    mapConv(convId, (c) => ({ ...c, messages: [...c.messages, message], draft: '', archived: false }));
    window.setTimeout(() => setMessageStatus(convId, message.id, 'sent'), 650);
    window.setTimeout(() => setMessageStatus(convId, message.id, 'delivered'), 1300);
    const conv = chatStore.get().conversations.find((c) => c.id === convId);
    if (conv && conv.memberIds.length) scheduleReply(conv, message.id);
  },
  setDraft(convId: string, draft: string) {
    mapConv(convId, (c) => (c.draft === draft ? c : { ...c, draft }));
  },
  markRead(convId: string) {
    const c = chatStore.get().conversations.find((x) => x.id === convId);
    if (c && c.unread) mapConv(convId, (x) => ({ ...x, unread: 0 }));
  },
  markUnread(convId: string) {
    mapConv(convId, (c) => ({ ...c, unread: Math.max(1, c.unread) }));
  },
  archiveAll(archived: boolean) {
    set((s) => ({ conversations: s.conversations.map((c) => ({ ...c, archived })) }));
  },
  markAllRead() {
    set((s) => ({ conversations: s.conversations.map((c) => ({ ...c, unread: 0 })) }));
  },
  togglePin(convId: string) {
    mapConv(convId, (c) => ({ ...c, pinned: !c.pinned }));
  },
  toggleArchive(convId: string) {
    mapConv(convId, (c) => ({ ...c, archived: !c.archived }));
  },
  toggleFavorite(convId: string) {
    mapConv(convId, (c) => ({ ...c, favorite: !c.favorite }));
  },
  toggleMute(convId: string) {
    mapConv(convId, (c) => ({ ...c, muted: !c.muted }));
  },
  clear(convId: string) {
    mapConv(convId, (c) => ({ ...c, messages: [] }));
  },
  remove(convId: string) {
    const removed = chatStore.get().conversations.find((c) => c.id === convId);
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== convId) }));
    return removed;
  },
  restore(conv: Conversation) {
    set((s) => ({ conversations: [conv, ...s.conversations] }));
  },
  deleteMessage(convId: string, msgId: string) {
    mapConv(convId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, deleted: true, text: undefined, image: undefined, file: undefined, voice: undefined } : m)) }));
  },
  react(convId: string, msgId: string, emoji: string) {
    mapConv(convId, (c) => ({
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions ?? {}) };
        const already = reactions[emoji]?.includes('me');
        Object.keys(reactions).forEach((k) => (reactions[k] = reactions[k].filter((u) => u !== 'me')));
        if (!already) reactions[emoji] = [...(reactions[emoji] ?? []), 'me'];
        Object.keys(reactions).forEach((k) => !reactions[k].length && delete reactions[k]);
        return { ...m, reactions };
      }),
    }));
  },
  /** Ouvre (ou crée) la conversation directe avec un membre et renvoie son id. */
  ensureDirect(memberId: string) {
    const existing = chatStore.get().conversations.find((c) => !c.isGroup && c.memberIds.length === 1 && c.memberIds[0] === memberId);
    if (existing) return existing.id;
    const conv: Conversation = { id: memberId, memberIds: [memberId], messages: [], unread: 0 };
    set((s) => ({ conversations: [conv, ...s.conversations] }));
    return conv.id;
  },
  createGroup(title: string, memberIds: string[]) {
    const conv: Conversation = {
      id: uid('grp'),
      title,
      memberIds,
      isGroup: true,
      unread: 0,
      messages: [{ id: uid('m'), authorId: 'system', text: `Vous avez créé le groupe « ${title} »`, createdAt: new Date().toISOString() }],
    };
    set((s) => ({ conversations: [conv, ...s.conversations] }));
    return conv.id;
  },
  updateSettings(patch: Partial<ChatSettings>) {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
  },
  startCall(memberId: string, kind: 'audio' | 'video') {
    liveStore.set({ call: { memberId, kind, startedAt: Date.now() } });
  },
  endCall() {
    const call = liveStore.get().call;
    if (!call) return;
    const durationSec = Math.round((Date.now() - call.startedAt) / 1000);
    liveStore.set({ call: null });
    set((s) => ({ calls: [{ id: uid('k'), memberId: call.memberId, kind: call.kind, direction: 'sortant', createdAt: new Date().toISOString(), durationSec }, ...s.calls] }));
    return durationSec;
  },
  deleteCall(id: string) {
    set((s) => ({ calls: s.calls.filter((c) => c.id !== id) }));
  },
};

/** Messages non lus : vraies conversations pour un compte connecté à l'API, démo sinon. */
export function useUnreadChats() {
  const remote = useApp((s) => !!s.account?.remote);
  const conversations = useChat((s) => s.conversations);
  const real = useConversations((s) => s.list.reduce((sum, c) => sum + c.unread, 0));
  const demo = useMemo(() => conversations.filter((c) => !c.archived).reduce((sum, c) => sum + c.unread, 0), [conversations]);
  return REAL_DISCUSSIONS && remote ? real : demo;
}

export function conversationTitle(c: Conversation) {
  return c.title ?? c.memberIds.map((id) => getMember(id).name).join(', ');
}
