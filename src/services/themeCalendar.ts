import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { weeklyTheme as demoTheme } from '@/data/home';
import { useApp } from '@/store/app';
import { bibleLink, dateOf, expandRow, isObj, isoWeekKey, str, stripHtml, toList, weekOf, type Raw } from './weeklyTheme';

/**
 * Calendrier des thèmes (comme l'app mobile) : mois → semaines → cultes.
 * L'API range tout dans /v1/weekly-themes :
 *  - weekly_themes/2026-W44                      → thème de la semaine
 *  - weekly_themes/2026-W44/event_days/…         → cultes (date, heure, lecture, cantiques)
 *  - autres lignes (mois)                        → thème du mois, si présent
 */

export interface ThemeDay {
  id: string;
  weekKey: string;
  date: Date | null;
  time: string;
  dayLabel: string;
  title: string;
  readings: { ref: string; to?: string }[];
  hymns: string[];
  notes: string;
  celebration: boolean;
}

export interface ThemeWeek {
  key: string;
  number: number;
  title: string;
  start: Date;
  end: Date;
  summary: string;
  readings: { ref: string; to?: string }[];
  days: ThemeDay[];
  monthKey: string;
  monthTitle: string;
}

export interface ThemeMonth {
  key: string;
  index: number;
  label: string;
  year: number;
  title: string;
  start: Date;
  end: Date;
  weeks: ThemeWeek[];
  counts: { cultes: number; lectures: number; cantiques: number };
}

export interface ThemeCalendar {
  months: ThemeMonth[];
  weeks: ThemeWeek[];
  current: ThemeWeek | null;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS: Record<string, string> = { monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' };
const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Lundi de la semaine ISO « 2026-W44 ». */
function mondayOf(key: string) {
  const [y, w] = key.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}

const readingsOf = (r: Raw) =>
  toList(r.readings ?? r.reading ?? r.bibleReadings ?? r.bibleReading ?? r.bible_reading ?? r.references ?? r.reference ?? r.verses ?? r.verse ?? r.scripture ?? r.passage ?? r.lectures ?? r.lecture).map((ref) => ({ ref, to: bibleLink(ref) }));

function hymnsOf(r: Raw) {
  const v = r.hymns ?? r.cantiques ?? r.songs;
  if (!Array.isArray(v)) return toList(v);
  return v
    .map((h) => (isObj(h) ? [str(h.number, h.numero) || (typeof h.number === 'number' ? String(h.number) : ''), str(h.title, h.name, h.titre)].filter(Boolean).join(' · ') : typeof h === 'number' ? String(h) : str(h)))
    .filter(Boolean);
}

function toDay(r: Raw): ThemeDay {
  const date = dateOf(r.date ?? r.day ?? r.startAt ?? r.start_at);
  const local = date && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? new Date(Number(r.date.slice(0, 4)), Number(r.date.slice(5, 7)) - 1, Number(r.date.slice(8, 10))) : date;
  const dayKey = str(r.dayKey, r.day_key).toLowerCase();
  const title = str(r.title, r.name, r.label) || 'Culte';
  return {
    id: str(r.public_id, r.legacy_id, r.id) || String(r.id),
    weekKey: weekOf(r),
    date: local,
    time: str(r.time, r.hour, r.heure),
    dayLabel: DAYS[dayKey] ?? (local ? FR_DAYS[local.getDay()] : ''),
    title,
    readings: readingsOf(r),
    hymns: hymnsOf(r),
    notes: stripHtml(str(r.notes, r.note, r.description)),
    celebration: /fête|fete|célébration|celebration|anniversaire|pèlerinage|noël|pâques/i.test(`${title} ${str(r.type, r.category)}`),
  };
}

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export function buildCalendar(rows: Raw[]): ThemeCalendar {
  const live = rows.filter((r) => !r.deleted_at && !/draft|archiv/i.test(str(r.status)));
  const isDay = (r: Raw) => /\/event_days\//.test(str(r.legacy_path)) || !!r.dayKey || !!r.time;
  const isWeek = (r: Raw) => !isDay(r) && !!weekOf(r) && !/month|mois/i.test(str(r.legacy_path));
  const days = live.filter(isDay).map(toDay);
  const weekRows = live.filter(isWeek);
  const monthRows = live.filter((r) => !isDay(r) && !isWeek(r) && str(r.title));

  const weeks = new Map<string, ThemeWeek>();
  for (const r of weekRows) {
    const key = weekOf(r);
    if (!key || weeks.has(key)) continue;
    const start = dateOf(r.start_date ?? r.startDate ?? r.weekStart) ?? mondayOf(key);
    const end = dateOf(r.end_date ?? r.endDate ?? r.weekEnd) ?? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    weeks.set(key, {
      key,
      number: Number(key.slice(-2)),
      title: str(r.title, r.theme, r.name) || 'Thème de la semaine',
      start,
      end,
      summary: stripHtml(str(r.summary, r.description, r.body, r.content)),
      readings: readingsOf(r),
      days: [],
      monthKey: monthKeyOf(start),
      monthTitle: str(r.monthTitle, r.month_title, r.monthTheme, r.month_theme, isObj(r.month) ? r.month.title : ''),
    });
  }
  // Cultes rattachés à leur semaine (semaine créée si le thème manque).
  for (const d of days) {
    if (!d.weekKey) continue;
    if (!weeks.has(d.weekKey)) {
      const start = mondayOf(d.weekKey);
      weeks.set(d.weekKey, { key: d.weekKey, number: Number(d.weekKey.slice(-2)), title: '', start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6), summary: '', readings: [], days: [], monthKey: monthKeyOf(start), monthTitle: '' });
    }
    weeks.get(d.weekKey)!.days.push(d);
  }
  for (const w of weeks.values()) w.days.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0) || a.time.localeCompare(b.time));

  // Thèmes de mois éventuels : rattachés par période ou par mois.
  const monthTitles = new Map<string, string>();
  for (const r of monthRows) {
    const start = dateOf(r.start_date ?? r.startDate ?? r.from ?? r.date);
    const keyFromPath = (str(r.legacy_path, r.public_id).match(/\d{4}-\d{2}(?!\d)/) ?? [''])[0];
    const key = start ? monthKeyOf(start) : keyFromPath;
    if (key && !monthTitles.has(key)) monthTitles.set(key, str(r.title, r.theme));
  }

  const sortedWeeks = [...weeks.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
  const months = new Map<string, ThemeMonth>();
  for (const w of sortedWeeks) {
    let m = months.get(w.monthKey);
    if (!m) {
      const [y, mo] = w.monthKey.split('-').map(Number);
      m = { key: w.monthKey, index: mo, label: MONTHS[mo - 1], year: y, title: monthTitles.get(w.monthKey) || w.monthTitle, start: w.start, end: w.end, weeks: [], counts: { cultes: 0, lectures: 0, cantiques: 0 } };
      months.set(w.monthKey, m);
    }
    m.weeks.push(w);
    m.end = w.end;
    if (!m.title && w.monthTitle) m.title = w.monthTitle;
    m.counts.cultes += w.days.length;
    m.counts.lectures += w.days.reduce((n, d) => n + d.readings.length, 0) + w.readings.length;
    m.counts.cantiques += w.days.reduce((n, d) => n + d.hymns.length, 0);
  }

  const key = isoWeekKey();
  return { months: [...months.values()], weeks: sortedWeeks, current: weeks.get(key) ?? null };
}

let cache: ThemeCalendar | undefined;

async function loadAll(signal: AbortSignal) {
  const rows: Raw[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 40; i++) {
    const res = await api.getRaw<Raw>('/v1/weekly-themes', { cursor }, signal);
    if (Array.isArray(res.data)) rows.push(...res.data.filter(isObj).map(expandRow));
    const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
    if (page.has_more !== true || typeof page.next_cursor !== 'string') break;
    cursor = page.next_cursor;
  }
  return buildCalendar(rows);
}

function demoCalendar(): ThemeCalendar {
  const key = isoWeekKey();
  const start = mondayOf(key);
  const week: ThemeWeek = {
    key, number: Number(key.slice(-2)), title: demoTheme.title, start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6),
    summary: demoTheme.summary, readings: demoTheme.readings.map((r) => ({ ref: r.ref, to: r.to })), monthKey: monthKeyOf(start), monthTitle: '',
    days: [
      { id: 'd1', weekKey: key, date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2), time: '19:00', dayLabel: 'Mercredi', title: 'Culte du mercredi', readings: [{ ref: demoTheme.readings[0].ref, to: demoTheme.readings[0].to }], hymns: ['12', '46'], notes: '', celebration: false },
      { id: 'd2', weekKey: key, date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6), time: '10:00', dayLabel: 'Dimanche', title: 'Culte dominical', readings: [{ ref: demoTheme.readings[1].ref, to: demoTheme.readings[1].to }], hymns: ['1', '91', '173'], notes: '', celebration: false },
    ],
  };
  const month: ThemeMonth = { key: week.monthKey, index: start.getMonth() + 1, label: MONTHS[start.getMonth()], year: start.getFullYear(), title: 'Thème du mois (démo)', start, end: week.end, weeks: [week], counts: { cultes: 2, lectures: 2, cantiques: 5 } };
  return { months: [month], weeks: [week], current: week };
}

export function useThemeCalendar() {
  const accountRemote = useApp((s) => !!s.account?.remote);
  const remote = accountRemote || (import.meta.env.VITE_DATA_MODE ?? 'api') !== 'demo';
  const [data, setData] = useState<ThemeCalendar | undefined>(remote ? cache : demoCalendar());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!remote) {
      setData(demoCalendar());
      return;
    }
    if (cache) return;
    const ctrl = new AbortController();
    loadAll(ctrl.signal)
      .then((c) => {
        cache = c;
        setData(c);
      })
      .catch((e) => (e as Error).name !== 'AbortError' && setError((e as Error).message));
    return () => ctrl.abort();
  }, [remote]);
  return { data, loading: !data && !error, error };
}
