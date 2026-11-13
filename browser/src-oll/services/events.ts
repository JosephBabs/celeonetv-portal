import { useEffect } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { churchEvents, type ChurchEvent } from '@/data/events';
import type { SceneVariant } from '@/data/types';
import { useApp } from '@/store/app';
import { normalize } from '@/lib/utils';
import { ensureParishes, parishStore } from './parishes';
import { dateOf, expandRow, isObj, str, stripHtml, type Raw } from './weeklyTheme';

/**
 * Événements de l'Église : GET /v1/agenda pour un compte connecté, événements de démonstration sinon.
 * La participation reste enregistrée sur l'appareil (pas d'API dédiée).
 */

const CATEGORIES: [RegExp, string, SceneVariant][] = [
  [/p[eè]lerin|pilgrim/i, 'Pèlerinage', 'beach'],
  [/f[eê]te|feast|celebration|célébration|anniversaire|noël|christmas|pâques|easter|moisson|harvest/i, 'Fête', 'sunrise'],
  [/jeun|youth|concours|quiz/i, 'Jeunesse', 'youth'],
  [/formation|training|séminaire|seminar|atelier|workshop|conférence|conference/i, 'Formation', 'drums'],
  [/veill[eé]e|prière|prayer|vigil/i, 'Prière', 'candles'],
  [/culte|service|messe|worship/i, 'Culte', 'choir'],
];

function classify(...texts: string[]): { category: string; scene: SceneVariant } {
  const t = texts.join(' ');
  for (const [re, category, scene] of CATEGORIES) if (re.test(t)) return { category, scene };
  return { category: 'Événement', scene: 'choir' };
}

/** « 2026-11-01 » + « 19:00 » → date locale (sans décalage de fuseau). */
function when(dateRaw: unknown, timeRaw: unknown) {
  const time = str(timeRaw).match(/^(\d{1,2})[:hH](\d{2})?/);
  if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw.trim())) {
    const [y, m, d] = dateRaw.trim().split('-').map(Number);
    return new Date(y, m - 1, d, time ? Number(time[1]) : 10, time?.[2] ? Number(time[2]) : 0);
  }
  const d = dateOf(dateRaw);
  if (d && time) d.setHours(Number(time[1]), time[2] ? Number(time[2]) : 0, 0, 0);
  return d;
}

const imageOf = (x: Raw) =>
  [x.imageUrl, x.image_url, x.image, x.cover, x.coverUrl, x.banner, x.bannerUrl, x.poster, x.posterUrl, x.thumbnail, x.thumbnailUrl, x.photo, x.flyer]
    .map((v) => (isObj(v) ? str(v.url, v.src, v.downloadURL) : str(v)))
    .find((v) => /^https?:\/\//.test(v)) || undefined;

function participantsOf(x: Raw) {
  for (const v of [x.participantsCount, x.participants_count, x.attendeesCount, x.goingCount, x.participants, x.attendees, x.going]) {
    if (typeof v === 'number') return v;
    if (Array.isArray(v)) return v.length;
  }
  return 0;
}

export function toEvent(input: unknown): ChurchEvent | null {
  if (!isObj(input)) return null;
  const x = expandRow(isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input);
  if (x.deleted_at || /draft|archiv|cancel|annul|brouillon/i.test(str(x.status)) || x.isPublished === false) return null;
  const tr = isObj(x.titleTranslations) ? x.titleTranslations : {};
  const title = str(x.title, x.titre, x.name, x.eventName, tr.fr, tr.en);
  const id = str(x.public_id, x.legacy_id) || (x.id !== undefined ? String(x.id) : '');
  const start = when(x.date ?? x.startDate ?? x.start_date ?? x.startAt ?? x.start_at ?? x.eventDate ?? x.event_date ?? x.serviceDate ?? x.dateTime ?? x.start, x.time ?? x.startTime ?? x.start_time ?? x.heure ?? x.serviceTime);
  if (!title || !id || !start) return null;
  const end = when(x.endDate ?? x.end_date ?? x.endAt ?? x.end_at ?? x.end, x.endTime ?? x.end_time);

  // Paroisse : par identifiant ou par nom, parmi les paroisses réelles déjà chargées.
  const parishes = parishStore.get().list;
  const pid = str(x.parishId, x.parish_id, isObj(x.parish) ? x.parish.id : '');
  const pname = str(x.parishName, x.parish_name, isObj(x.parish) ? x.parish.name : typeof x.parish === 'string' ? x.parish : '');
  const parish = parishes.find((p) => (pid && p.id === pid.replace(/[^\w-]+/g, '-')) || (pname && normalize(p.name) === normalize(pname)));
  const loc = isObj(x.location) ? str(x.location.name, x.location.address, x.location.city) : str(x.location);
  const place = str(x.place, x.lieu, x.venue, x.address, x.adresse, loc, pname, x.city, x.ville) || (/online|en ligne|zoom|live/i.test(str(x.mode, x.type)) ? 'En ligne' : '');
  const { category, scene } = classify(str(x.category, x.categorie, x.type, x.eventType, x.kind), title);

  return {
    id: `api-${id}`,
    title,
    date: start.toISOString(),
    endDate: end && end.getTime() > start.getTime() ? end.toISOString() : undefined,
    place: place || parish?.name || 'Lieu à préciser',
    parishId: parish?.id,
    scene,
    image: imageOf(x),
    category,
    description: stripHtml(str(x.description, x.body, x.content, x.details, x.text, x.summary)),
    participants: participantsOf(x),
    remote: true,
  };
}

/* ───────────── Liste (en mémoire) ───────────── */

interface EventState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  list: ChurchEvent[];
}
export const eventStore = createStore<EventState>(() => ({ status: 'idle', list: [] }));

let loading: Promise<void> | null = null;

async function loadEvents() {
  eventStore.set({ status: 'loading' });
  try {
    // Les paroisses servent à relier chaque événement à sa fiche (carte, itinéraire).
    await ensureParishes().catch(() => undefined);
    const all: ChurchEvent[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 20; i++) {
      const res = await api.getRaw<Raw>('/v1/agenda', { limit: 100, cursor });
      const rows = Array.isArray(res.data) ? res.data : [];
      all.push(...rows.map(toEvent).filter((e): e is ChurchEvent => !!e));
      const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
      const next = typeof page.next_cursor === 'string' ? page.next_cursor : null;
      if (!next || page.has_more === false || rows.length === 0) break;
      cursor = next;
    }
    const unique = [...new Map(all.map((e) => [e.id, e])).values()].sort((a, b) => a.date.localeCompare(b.date));
    eventStore.set({ status: 'ready', list: unique });
  } catch {
    eventStore.set({ status: 'error' });
    loading = null;
  }
}

export function ensureEvents() {
  if (!loading) loading = loadEvents();
  return loading;
}

/** Événements à afficher (réels ou démo). */
export function useEvents() {
  const remote = useApp((s) => !!s.account?.remote);
  const state = eventStore.use((s) => s);
  useEffect(() => {
    if (remote) void ensureEvents();
  }, [remote]);
  if (!remote) return { remote, status: 'ready' as const, list: churchEvents };
  return { remote, status: state.status, list: state.list };
}
