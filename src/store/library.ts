import { createStore } from '@/lib/createStore';
import type { BibleLang } from '@/data/bible';
import type { YouthCategory } from '@/data/youth';

export interface Registration {
  id: string;
  year: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'F' | 'M';
  parish: string;
  category: YouthCategory;
  guardian?: string;
  phone: string;
  createdAt: string;
}

interface LibraryState {
  docFavorites: string[];
  docRecent: string[];
  docFontSize: number;
  hymnFavorites: string[];
  hymnRecent: string[];
  hymnFontSize: number;
  bibleLang: BibleLang;
  bibleBookmarks: string[];
  bibleRecent: string | null;
  youthYear: number;
  registrations: Registration[];
  quizBest: number;
  quizPlays: number;
}

export const libraryStore = createStore<LibraryState>(
  () => ({
    docFavorites: [],
    docRecent: [],
    docFontSize: 18,
    hymnFavorites: [],
    hymnRecent: [],
    hymnFontSize: 19,
    bibleLang: 'fr',
    bibleBookmarks: [],
    bibleRecent: null,
    youthYear: 2026,
    registrations: [],
    quizBest: 0,
    quizPlays: 0,
  }),
  { key: 'celeone-web-library', version: 1 },
);
export const useLibrary = libraryStore.use;
const set = libraryStore.set;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);
const pushRecent = (list: string[], id: string, max = 8) => [id, ...list.filter((x) => x !== id)].slice(0, max);

export const library = {
  toggleDocFavorite(id: string) {
    const on = !libraryStore.get().docFavorites.includes(id);
    set((s) => ({ docFavorites: toggleIn(s.docFavorites, id) }));
    return on;
  },
  openDoc(id: string) {
    set((s) => ({ docRecent: pushRecent(s.docRecent, id) }));
  },
  setDocFontSize(docFontSize: number) {
    set({ docFontSize: Math.min(26, Math.max(14, docFontSize)) });
  },
  toggleHymnFavorite(id: string) {
    const on = !libraryStore.get().hymnFavorites.includes(id);
    set((s) => ({ hymnFavorites: toggleIn(s.hymnFavorites, id) }));
    return on;
  },
  openHymn(id: string) {
    set((s) => ({ hymnRecent: pushRecent(s.hymnRecent, id) }));
  },
  setHymnFontSize(hymnFontSize: number) {
    set({ hymnFontSize: Math.min(28, Math.max(14, hymnFontSize)) });
  },
  setBibleLang(bibleLang: BibleLang) {
    set({ bibleLang });
  },
  toggleBookmark(ref: string) {
    const on = !libraryStore.get().bibleBookmarks.includes(ref);
    set((s) => ({ bibleBookmarks: toggleIn(s.bibleBookmarks, ref) }));
    return on;
  },
  setBibleRecent(ref: string) {
    set({ bibleRecent: ref });
  },
  setYouthYear(youthYear: number) {
    set({ youthYear });
  },
  register(r: Omit<Registration, 'id' | 'createdAt'>) {
    const count = libraryStore.get().registrations.filter((x) => x.year === r.year).length;
    const reg: Registration = { ...r, id: `EAJ-${r.year}-${String(500 + count + 1).padStart(3, '0')}`, createdAt: new Date().toISOString() };
    set((s) => ({ registrations: [reg, ...s.registrations] }));
    return reg;
  },
  cancelRegistration(id: string) {
    set((s) => ({ registrations: s.registrations.filter((r) => r.id !== id) }));
  },
  recordQuiz(score: number) {
    set((s) => ({ quizBest: Math.max(s.quizBest, score), quizPlays: s.quizPlays + 1 }));
  },
};

/* ───────── Lecteur audio persistant (mini-lecteur) ───────── */

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  duration: number;
  /** Fichier audio réel (cantiques de l'API). Sans `src`, la lecture est simulée (démo). */
  src?: string;
}

export const playerStore = createStore<{ track: Track | null; playing: boolean; position: number }>(() => ({ track: null, playing: false, position: 0 }));
export const usePlayer = playerStore.use;

let ticker: number | undefined;
function tick() {
  window.clearInterval(ticker);
  if (playerStore.get().track?.src) return;
  ticker = window.setInterval(() => {
    const { track, playing, position } = playerStore.get();
    if (!track || !playing) return;
    if (position + 1 >= track.duration) playerStore.set({ position: 0, playing: false });
    else playerStore.set({ position: position + 1 });
  }, 1000);
}

let audio: HTMLAudioElement | null = null;
function audioEl() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'metadata';
  audio.addEventListener('timeupdate', () => playerStore.set({ position: Math.floor(audio!.currentTime) }));
  audio.addEventListener('loadedmetadata', () => {
    const t = playerStore.get().track;
    if (t && Number.isFinite(audio!.duration)) playerStore.set({ track: { ...t, duration: Math.max(1, Math.round(audio!.duration)) } });
  });
  audio.addEventListener('ended', () => playerStore.set({ playing: false, position: 0 }));
  audio.addEventListener('error', () => playerStore.set({ playing: false }));
  return audio;
}

export const player = {
  play(track: Track) {
    const current = playerStore.get().track;
    const same = current?.id === track.id;
    playerStore.set({ track, playing: true, position: same ? playerStore.get().position : 0 });
    if (track.src) {
      const a = audioEl();
      if (!same || a.src !== track.src) a.src = track.src;
      void a.play().catch(() => playerStore.set({ playing: false }));
    } else audio?.pause();
    tick();
  },
  toggle() {
    const { track, playing } = playerStore.get();
    playerStore.set({ playing: !playing });
    if (track?.src && audio) {
      if (playing) audio.pause();
      else void audio.play().catch(() => playerStore.set({ playing: false }));
    }
    tick();
  },
  seek(position: number) {
    playerStore.set({ position });
    if (playerStore.get().track?.src && audio) audio.currentTime = position;
  },
  close() {
    window.clearInterval(ticker);
    audio?.pause();
    playerStore.set({ track: null, playing: false, position: 0 });
  },
};
