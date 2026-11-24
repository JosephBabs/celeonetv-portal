import { useEffect } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { parishes as demoParishes, type Parish } from '@/data/parishes';
import { useApp } from '@/store/app';
import { dateOf, expandRow, isObj, str, type Raw } from './weeklyTheme';

/**
 * Paroisses réelles (GET /v1/parishes) pour un compte connecté, paroisses de démonstration sinon.
 * Les coordonnées arrivent sous des formes variées (lat/lng, GeoPoint Firebase, [lng, lat]…).
 */

export interface ParishView extends Parish {
  /** Faux quand l'API ne donne pas de position : la paroisse reste trouvable, sans repère sur la carte. */
  located: boolean;
  diocese?: string;
  district?: string;
  country?: string;
}

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.replace(',', '.')) : NaN);
const valid = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

function positionOf(x: Raw): { lat: number; lng: number } | null {
  const tryPair = (lat: unknown, lng: unknown) => {
    const a = num(lat);
    const b = num(lng);
    return valid(a, b) ? { lat: a, lng: b } : null;
  };
  const direct = tryPair(x.lat ?? x.latitude, x.lng ?? x.lon ?? x.long ?? x.longitude);
  if (direct) return direct;
  for (const key of ['location', 'position', 'coordinates', 'coords', 'geo', 'geopoint', 'gps', 'geolocation']) {
    const v = x[key];
    if (isObj(v)) {
      const p = tryPair(v.lat ?? v.latitude ?? v._latitude, v.lng ?? v.lon ?? v.longitude ?? v._longitude);
      if (p) return p;
      // GeoJSON { type: 'Point', coordinates: [lng, lat] }
      if (Array.isArray(v.coordinates)) {
        const g = tryPair(v.coordinates[1], v.coordinates[0]);
        if (g) return g;
      }
    }
    if (Array.isArray(v) && v.length >= 2) {
      // « coordinates » suit la convention GeoJSON [lng, lat] ; les autres champs [lat, lng].
      // Une première valeur hors latitude (> 90) impose aussi l'ordre [lng, lat].
      const lngFirst = key === 'coordinates' || Math.abs(num(v[0])) > 90;
      const p = lngFirst ? tryPair(v[1], v[0]) : tryPair(v[0], v[1]);
      if (p) return p;
    }
    if (typeof v === 'string') {
      const m = v.match(/(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)/);
      if (m) {
        const p = tryPair(m[1], m[2]);
        if (p) return p;
      }
    }
  }
  return null;
}

const DAYS: Record<string, string> = { monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' };

function scheduleOf(x: Raw): Parish['schedule'] {
  const raw = x.schedule ?? x.schedules ?? x.services ?? x.horaires ?? x.serviceTimes ?? x.programs ?? x.programme;
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        if (typeof s === 'string') {
          const [day, ...rest] = s.split(/\s*[:–—-]\s*/);
          return { day: DAYS[day.toLowerCase()] ?? day, hours: rest.join(' — ') };
        }
        if (!isObj(s)) return null;
        const day = str(s.day, s.jour, s.dayKey, s.dayOfWeek);
        const hours = [str(s.hours, s.time, s.heure, s.start, s.startTime), str(s.label, s.title, s.name, s.type)].filter(Boolean).join(' — ');
        return day || hours ? { day: DAYS[day.toLowerCase()] ?? day, hours } : null;
      })
      .filter((s): s is { day: string; hours: string } => !!s);
  }
  if (isObj(raw)) return Object.entries(raw).map(([day, hours]) => ({ day: DAYS[day.toLowerCase()] ?? day, hours: Array.isArray(hours) ? hours.join(', ') : String(hours) }));
  return [];
}

function addressOf(x: Raw) {
  const a = x.address ?? x.adresse;
  if (isObj(a)) return [str(a.street, a.line1, a.quartier, a.district), str(a.city, a.ville), str(a.country, a.pays)].filter(Boolean).join(', ');
  return str(a, x.fullAddress, x.full_address, x.location_name, x.locationName, x.quartier);
}

export function toParish(input: unknown): ParishView | null {
  if (!isObj(input)) return null;
  const x = expandRow(isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input);
  if (x.deleted_at || /draft|archiv|inactive|disabled|rejected/i.test(str(x.status)) || x.isActive === false) return null;
  const name = str(x.name, x.title, x.parishName, x.parish_name, x.nom);
  const id = str(x.public_id, x.legacy_id, x.slug) || (x.id !== undefined ? String(x.id) : '');
  if (!name || !id) return null;
  const pos = positionOf(x);
  const adr = isObj(x.address) ? x.address : {};
  const city = str(x.city, x.ville, x.town, x.commune, adr.city, adr.ville);
  const founded = dateOf(x.founded ?? x.foundedAt ?? x.founded_at ?? x.foundationDate ?? x.creationDate ?? x.dateCreation);
  return {
    id: id.replace(/[^\w-]+/g, '-'),
    name,
    city,
    address: addressOf(x) || [city, str(x.country, x.pays, adr.country)].filter(Boolean).join(', '),
    lat: pos?.lat ?? NaN,
    lng: pos?.lng ?? NaN,
    located: !!pos,
    shepherd: str(x.shepherd, x.berger, x.shepherdName, x.pastor, x.pastorName, x.leader, x.leaderName, x.responsable, x.chef),
    phone: str(x.phone, x.phoneNumber, x.telephone, x.tel, x.contact, x.contactPhone),
    founded: founded ? founded.toISOString() : '',
    feast: str(x.feast, x.feastDay, x.fete, x.anniversary, x.patronalFeast),
    schedule: scheduleOf(x),
    diocese: str(x.diocese, x.dioceseName, x.diocese_name, isObj(x.diocese) ? x.diocese.name : '') || undefined,
    district: str(x.district, x.districtName, x.district_name, isObj(x.district) ? x.district.name : '') || undefined,
    country: str(x.country, x.pays, adr.country, adr.pays) || undefined,
  };
}

/* ───────────── Liste (en mémoire) ───────────── */

interface ParishState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  list: ParishView[];
  rows: number;
  error?: string;
}
export const parishStore = createStore<ParishState>(() => ({ status: 'idle', list: [], rows: 0 }));

let loading: Promise<void> | null = null;

async function loadParishes() {
  parishStore.set({ status: 'loading', error: undefined });
  try {
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let i = 0; i < 50; i++) {
      const res = await api.getRaw<Raw>('/v1/parishes', { limit: 100, cursor });
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows.map(toParish).filter((p): p is ParishView => !!p && !seen.has(p.id));
      mapped.forEach((p) => seen.add(p.id));
      parishStore.set((s) => ({ list: [...s.list, ...mapped], rows: s.rows + rows.length }));
      const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
      const next = typeof page.next_cursor === 'string' ? page.next_cursor : null;
      if (!next || page.has_more === false || rows.length === 0) break;
      cursor = next;
    }
    parishStore.set({ status: 'ready' });
  } catch (e) {
    parishStore.set({ status: 'error', error: (e as Error).message });
    loading = null;
  }
}

export function ensureParishes() {
  if (!loading) loading = loadParishes();
  return loading;
}

const demo: ParishView[] = demoParishes.map((p) => ({ ...p, located: true }));

/** Paroisses à afficher (réelles ou démo) et état du chargement. */
export function useParishes() {
  const remote = useApp((s) => !!s.account?.remote);
  const state = parishStore.use((s) => s);
  useEffect(() => {
    if (remote) void ensureParishes();
  }, [remote]);
  if (!remote) return { remote, status: 'ready' as const, list: demo, rows: 0, error: undefined, get: (id: string) => demo.find((p) => p.id === id) };
  return { remote, status: state.status, list: state.list, rows: state.rows, error: state.error, get: (id: string) => state.list.find((p) => p.id === id) };
}

/** Lecture hors composant (agenda, historique) : paroisse réelle si chargée, sinon démo. */
export function findParish(id: string, remote: boolean): ParishView | undefined {
  return (remote ? parishStore.get().list : demo).find((p) => p.id === id);
}
