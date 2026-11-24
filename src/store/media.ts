import { createStore } from '@/lib/createStore';

interface MediaState {
  subscriptions: string[];
  liked: string[];
  favorites: string[];
  myList: string[];
  downloads: string[];
  history: string[];
  creatorRequest: null | { name: string; kind: string; status: 'en attente' | 'approuvée'; date: string };
  quality: 'auto' | '1080p' | '720p' | '480p';
  autoplay: boolean;
  radioStation: string;
  radioVolume: number;
}

export const mediaStore = createStore<MediaState>(
  () => ({
    subscriptions: ['c1'],
    liked: [],
    favorites: [],
    myList: ['v-chorale'],
    downloads: [],
    history: ['v-moisson'],
    creatorRequest: null,
    quality: 'auto',
    autoplay: true,
    radioStation: 'alleluia',
    radioVolume: 70,
  }),
  { key: 'celeone-web-media', version: 1 },
);
export const useMedia = mediaStore.use;
const set = mediaStore.set;
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);

export const media = {
  toggle(field: 'subscriptions' | 'liked' | 'favorites' | 'myList' | 'downloads', id: string) {
    const on = !mediaStore.get()[field].includes(id);
    set((s) => ({ [field]: toggle(s[field], id) }) as Partial<MediaState>);
    return on;
  },
  watch(id: string) {
    set((s) => ({ history: [id, ...s.history.filter((h) => h !== id)].slice(0, 20) }));
  },
  clearHistory() {
    set({ history: [] });
  },
  requestCreator(name: string, kind: string) {
    set({ creatorRequest: { name, kind, status: 'en attente', date: new Date().toISOString() } });
  },
  set(patch: Partial<Pick<MediaState, 'quality' | 'autoplay' | 'radioStation' | 'radioVolume'>>) {
    set(patch);
  },
};
