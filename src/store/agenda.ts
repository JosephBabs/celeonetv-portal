import { createStore } from '@/lib/createStore';
import { uid } from '@/lib/utils';

export type AlertType = 'service' | 'circuit' | 'fete' | 'personnel';
export type Repeat = 'aucune' | 'quotidienne' | 'hebdomadaire' | 'mensuelle' | 'annuelle';

export interface AgendaAlert {
  id: string;
  type: AlertType;
  title: string;
  date: string;
  time: string;
  repeat: Repeat;
  parishId?: string;
  place?: string;
  notes?: string;
  notify: boolean;
  createdAt: string;
}

export const alertTypes: { id: AlertType; label: string; hint: string }[] = [
  { id: 'service', label: "Service d'Église", hint: 'Culte, veillée, réunion' },
  { id: 'circuit', label: 'Circuit / voyage', hint: 'Déplacement, pèlerinage' },
  { id: 'fete', label: 'Visite de fête', hint: 'Fête d’une paroisse' },
  { id: 'personnel', label: 'Rappel personnel', hint: 'Prière, lecture, jeûne' },
];

export const repeatLabels: Record<Repeat, string> = {
  aucune: 'Une seule fois',
  quotidienne: 'Tous les jours',
  hebdomadaire: 'Chaque semaine',
  mensuelle: 'Chaque mois',
  annuelle: 'Chaque année',
};

const today = new Date();
const iso = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

export const agendaStore = createStore<{ alerts: AgendaAlert[]; participating: string[] }>(
  () => ({
    alerts: [
      { id: 'a1', type: 'service', title: 'Culte dominical', date: iso((7 - today.getDay()) % 7 || 7), time: '10:00', repeat: 'hebdomadaire', parishId: 'alpha-omega-djegbe', notify: true, createdAt: new Date().toISOString() },
      { id: 'a2', type: 'personnel', title: 'Lecture du thème de la semaine', date: iso(1), time: '06:30', repeat: 'quotidienne', notify: true, createdAt: new Date().toISOString() },
    ],
    participating: ['e1'],
  }),
  { key: 'celeone-web-agenda', version: 1 },
);
export const useAgenda = agendaStore.use;
const set = agendaStore.set;

export const agenda = {
  add(a: Omit<AgendaAlert, 'id' | 'createdAt'>) {
    const alert: AgendaAlert = { ...a, id: uid('al'), createdAt: new Date().toISOString() };
    set((s) => ({ alerts: [...s.alerts, alert] }));
    return alert;
  },
  update(id: string, patch: Partial<AgendaAlert>) {
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  },
  remove(id: string) {
    const removed = agendaStore.get().alerts.find((a) => a.id === id);
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }));
    return removed;
  },
  restore(a: AgendaAlert) {
    set((s) => ({ alerts: [...s.alerts, a] }));
  },
  toggleParticipation(eventId: string) {
    const on = !agendaStore.get().participating.includes(eventId);
    set((s) => ({ participating: on ? [...s.participating, eventId] : s.participating.filter((e) => e !== eventId) }));
    return on;
  },
};

/** Prochaine occurrence (pour le tri et l'affichage) en tenant compte de la répétition. */
export function nextOccurrence(a: AgendaAlert): Date {
  const base = new Date(`${a.date}T${a.time || '00:00'}`);
  const now = new Date();
  if (a.repeat === 'aucune' || base >= now) return base;
  const d = new Date(base);
  const step = { quotidienne: () => d.setDate(d.getDate() + 1), hebdomadaire: () => d.setDate(d.getDate() + 7), mensuelle: () => d.setMonth(d.getMonth() + 1), annuelle: () => d.setFullYear(d.getFullYear() + 1) }[a.repeat];
  let guard = 0;
  while (d < now && guard++ < 1000) step();
  return d;
}
