import { createStore } from '@/lib/createStore';

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
}

interface SettingsState {
  notifications: Record<string, boolean>;
  videoQuality: 'auto' | 'haute' | 'moyenne' | 'basse';
  audioQuality: 'normale' | 'haute';
  subtitles: boolean;
  playbackSpeed: number;
  autoplay: boolean;
  dataSaver: boolean;
  wifiOnlyDownloads: boolean;
  cacheMb: number;
  twoFactor: boolean;
  sessions: Session[];
  plan: 'gratuit' | 'premium' | 'famille';
  paymentMethod: string | null;
  theme: 'clair' | 'sombre' | 'systeme';
  pushEnabled: boolean;
}

export const settingsStore = createStore<SettingsState>(
  () => ({
    notifications: { messages: true, social: true, publications: true, evenements: true, cultes: true, jeunesse: false, email: false },
    videoQuality: 'auto',
    audioQuality: 'normale',
    subtitles: false,
    playbackSpeed: 1,
    autoplay: true,
    dataSaver: false,
    wifiOnlyDownloads: true,
    cacheMb: 148,
    twoFactor: false,
    sessions: [
      { id: 's1', device: 'Ce navigateur (Windows)', location: 'Cotonou, Bénin', lastActive: new Date().toISOString(), current: true },
      { id: 's2', device: 'Téléphone Android — App Cèlè One', location: 'Lokossa, Bénin', lastActive: new Date(Date.now() - 3 * 3600_000).toISOString() },
      { id: 's3', device: 'Tablette — Navigateur', location: 'Porto-Novo, Bénin', lastActive: new Date(Date.now() - 6 * 86400_000).toISOString() },
    ],
    plan: 'gratuit',
    paymentMethod: null,
    theme: 'clair',
    pushEnabled: true,
  }),
  { key: 'celeone-web-settings', version: 1 },
);
export const useSettings = settingsStore.use;

export const settings = {
  set(patch: Partial<SettingsState>) {
    settingsStore.set(patch);
  },
  toggleNotification(key: string) {
    settingsStore.set((s) => ({ notifications: { ...s.notifications, [key]: !s.notifications[key] } }));
  },
  revokeSession(id: string) {
    settingsStore.set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
  },
  revokeOthers() {
    settingsStore.set((s) => ({ sessions: s.sessions.filter((x) => x.current) }));
  },
};
