import { createStore } from '@/lib/createStore';
import { uid } from '@/lib/utils';

export interface Donation { id: string; projectId: string; projectName: string; amount: number; method: string; date: string; anonymous: boolean }
export interface Prayer { id: string; author: string; text: string; urgent: boolean; date: string; count: number }
export interface Visit { id: string; parishId: string; date: string; note?: string }
export interface CounselRequest { id: string; topic: string; message: string; contact: string; date: string; status: 'envoyée' | 'en cours' | 'traitée' }
export interface Draft { id: string; title: string; body: string; updatedAt: string }
export interface Playlist { id: string; name: string; trackIds: string[] }

interface MenuState {
  donations: Donation[];
  prayers: Prayer[];
  prayedFor: string[];
  visits: Visit[];
  counsel: CounselRequest[];
  courseProgress: Record<string, number[]>;
  examScores: Record<string, number>;
  drafts: Draft[];
  playlists: Playlist[];
  integrations: Record<string, boolean>;
  tvCode: { code: string; expires: number } | null;
  tvPaired: string | null;
  verificationRequest: { kind: string; status: string; date: string } | null;
  rewardsClaimed: string[];
  contentRights: Record<string, string>;
  memberCardColor: string;
}

const d = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

export const menuStore = createStore<MenuState>(
  () => ({
    donations: [
      { id: 'don1', projectId: 'temple', projectName: 'Construction du temple de Djègbé', amount: 10000, method: 'MTN Mobile Money', date: d(40), anonymous: false },
      { id: 'don2', projectId: 'dime', projectName: 'Dîme mensuelle', amount: 5000, method: 'Moov Money', date: d(12), anonymous: false },
    ],
    prayers: [
      { id: 'pr1', author: 'Grâce Houénou', text: 'Prions pour les familles touchées par les inondations à Cotonou.', urgent: true, date: d(0.2), count: 48 },
      { id: 'pr2', author: 'Anonyme', text: 'Prière pour la guérison de ma mère hospitalisée.', urgent: true, date: d(1), count: 112 },
      { id: 'pr3', author: 'Joël Akpovi', text: 'Pour la réussite des jeunes aux examens de fin d’année.', urgent: false, date: d(3), count: 31 },
    ],
    prayedFor: [],
    visits: [{ id: 'vi1', parishId: 'sion-porto-novo', date: d(20), note: 'Fête paroissiale' }],
    counsel: [],
    courseProgress: { 'cours-bibliques:genese': [0, 1] },
    examScores: {},
    drafts: [{ id: 'dr1', title: 'Témoignage de la veillée', body: 'Ce soir-là, toute la paroisse était réunie…', updatedAt: d(2) }],
    playlists: [{ id: 'pl1', name: 'Mes louanges du matin', trackIds: ['a1-0', 'a2-0', 'a1-2'] }],
    integrations: { google: false, outlook: false, apple: false, 'login-google': true, 'login-apple': false },
    tvCode: null,
    tvPaired: null,
    verificationRequest: null,
    rewardsClaimed: [],
    contentRights: {},
    memberCardColor: 'teal',
  }),
  { key: 'celeone-web-menu', version: 1 },
);
export const useMenu = menuStore.use;
const set = menuStore.set;

export const menu = {
  donate(don: Omit<Donation, 'id' | 'date'>) {
    const item = { ...don, id: uid('don'), date: new Date().toISOString() };
    set((s) => ({ donations: [item, ...s.donations] }));
    return item;
  },
  addPrayer(p: Pick<Prayer, 'author' | 'text' | 'urgent'>) {
    set((s) => ({ prayers: [{ ...p, id: uid('pr'), date: new Date().toISOString(), count: 1 }, ...s.prayers], prayedFor: [...s.prayedFor] }));
  },
  pray(id: string) {
    if (menuStore.get().prayedFor.includes(id)) return false;
    set((s) => ({ prayedFor: [...s.prayedFor, id], prayers: s.prayers.map((p) => (p.id === id ? { ...p, count: p.count + 1 } : p)) }));
    return true;
  },
  addVisit(v: Omit<Visit, 'id'>) {
    set((s) => ({ visits: [{ ...v, id: uid('vi') }, ...s.visits] }));
  },
  removeVisit(id: string) {
    set((s) => ({ visits: s.visits.filter((v) => v.id !== id) }));
  },
  requestCounsel(r: Pick<CounselRequest, 'topic' | 'message' | 'contact'>) {
    set((s) => ({ counsel: [{ ...r, id: uid('co'), date: new Date().toISOString(), status: 'envoyée' }, ...s.counsel] }));
  },
  toggleLesson(courseKey: string, lesson: number) {
    set((s) => {
      const done = s.courseProgress[courseKey] ?? [];
      return { courseProgress: { ...s.courseProgress, [courseKey]: done.includes(lesson) ? done.filter((l) => l !== lesson) : [...done, lesson] } };
    });
  },
  recordExam(id: string, score: number) {
    set((s) => ({ examScores: { ...s.examScores, [id]: Math.max(score, s.examScores[id] ?? 0) } }));
  },
  saveDraft(draft: Partial<Draft> & Pick<Draft, 'title' | 'body'>) {
    const now = new Date().toISOString();
    set((s) => (draft.id && s.drafts.some((x) => x.id === draft.id)
      ? { drafts: s.drafts.map((x) => (x.id === draft.id ? { ...x, ...draft, updatedAt: now } : x)) }
      : { drafts: [{ id: uid('dr'), title: draft.title, body: draft.body, updatedAt: now }, ...s.drafts] }));
  },
  deleteDraft(id: string) {
    set((s) => ({ drafts: s.drafts.filter((x) => x.id !== id) }));
  },
  createPlaylist(name: string) {
    const pl = { id: uid('pl'), name, trackIds: [] };
    set((s) => ({ playlists: [...s.playlists, pl] }));
    return pl;
  },
  togglePlaylistTrack(playlistId: string, trackId: string) {
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === playlistId ? { ...p, trackIds: p.trackIds.includes(trackId) ? p.trackIds.filter((t) => t !== trackId) : [...p.trackIds, trackId] } : p)) }));
  },
  deletePlaylist(id: string) {
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  },
  toggleIntegration(key: string) {
    const on = !menuStore.get().integrations[key];
    set((s) => ({ integrations: { ...s.integrations, [key]: on } }));
    return on;
  },
  newTvCode() {
    const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
    set({ tvCode: { code, expires: Date.now() + 5 * 60_000 } });
  },
  pairTv(name: string | null) {
    set({ tvPaired: name, tvCode: null });
  },
  requestVerification(kind: string) {
    set({ verificationRequest: { kind, status: 'en cours d’examen', date: new Date().toISOString() } });
  },
  claimReward(id: string) {
    set((s) => ({ rewardsClaimed: [...s.rewardsClaimed, id] }));
  },
  setRight(contentId: string, license: string) {
    set((s) => ({ contentRights: { ...s.contentRights, [contentId]: license } }));
  },
  setCardColor(memberCardColor: string) {
    set({ memberCardColor });
  },
};
