import { createStore } from '@/lib/createStore';
import { uid } from '@/lib/utils';
import type { PrimarySection } from '@/data/types';

export type ToastTone = 'default' | 'success' | 'danger';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

export interface ShareTarget {
  title: string;
  url: string;
  onShared?: () => void;
}

interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  resolve: (ok: boolean) => void;
}

interface UiState {
  section: PrimarySection;
  toasts: Toast[];
  share: ShareTarget | null;
  confirm: ConfirmRequest | null;
  menuOpen: boolean;
  railOpen: boolean;
  searchOpen: boolean;
  loader: string | null;
}

const SECTION_KEY = 'celeone-section';
const sections: PrimarySection[] = ['accueil', 'social', 'documents', 'cantiques', 'jeunesse'];

/** Section d'origine mémorisée pour la session : le header contextuel survit au rechargement. */
function initialSection(): PrimarySection {
  try {
    const saved = sessionStorage.getItem(SECTION_KEY) as PrimarySection | null;
    if (saved && sections.includes(saved)) return saved;
  } catch {
    /* stockage indisponible */
  }
  return 'accueil';
}

export const uiStore = createStore<UiState>(() => ({
  section: initialSection(),
  toasts: [],
  share: null,
  confirm: null,
  menuOpen: false,
  railOpen: false,
  searchOpen: false,
  loader: null,
}));

export const useUi = uiStore.use;

export function toast(message: string, opts: { tone?: ToastTone; action?: Toast['action']; duration?: number } = {}) {
  const id = uid('t');
  uiStore.set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone: opts.tone ?? 'default', action: opts.action }] }));
  window.setTimeout(() => dismissToast(id), opts.duration ?? 4200);
  return id;
}

export function dismissToast(id: string) {
  uiStore.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

/** Affiche le loader CélèOne plein écran pendant une transition (connexion, déconnexion…). */
export async function withLoader(label: string, ms: number, then: () => void) {
  uiStore.set({ loader: label });
  await new Promise((r) => window.setTimeout(r, ms));
  then();
  window.setTimeout(() => uiStore.set({ loader: null }), 150);
}

export function openShare(target: ShareTarget) {
  uiStore.set({ share: target });
}

export function confirmDialog(req: Omit<ConfirmRequest, 'resolve'>) {
  return new Promise<boolean>((resolve) => uiStore.set({ confirm: { ...req, resolve } }));
}

export const ui = {
  setSection: (section: PrimarySection) => {
    if (uiStore.get().section === section) return;
    uiStore.set({ section });
    try {
      sessionStorage.setItem(SECTION_KEY, section);
    } catch {
      /* stockage indisponible */
    }
  },
  setMenuOpen: (menuOpen: boolean) => uiStore.set({ menuOpen }),
  setRailOpen: (railOpen: boolean) => uiStore.set({ railOpen }),
  setSearchOpen: (searchOpen: boolean) => uiStore.set({ searchOpen }),
};
