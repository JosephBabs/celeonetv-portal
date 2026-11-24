import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { weeklyTheme as demoTheme } from '@/data/home';
import { bibleBooks } from '@/data/bible';
import { useApp } from '@/store/app';
import { normalize } from '@/lib/utils';

export interface WeeklyTheme {
  week: number | null;
  title: string;
  period: string;
  readings: { label: string; ref: string; to?: string }[];
  summary: string;
  meditation: string[];
}

export type Raw = Record<string, unknown>;
export const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
export const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
export const dateOf = (v: unknown) => {
  if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v);
  if (typeof v === 'number' && v > 0) return new Date(v < 1e12 ? v * 1000 : v);
  if (isObj(v)) {
    if (typeof v.iso === 'string') return new Date(v.iso);
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000);
  }
  return null;
};
export const stripHtml = (v: string) => (/<[a-z]/i.test(v) ? (new DOMParser().parseFromString(v.replace(/<br\s*\/?>/gi, '\n'), 'text/html').body.textContent ?? '').trim() : v);

/** « Exode 19 : 1-9 » → lien vers /bible/exode/19 si le livre est reconnu. */
export function bibleLink(ref: string) {
  const m = ref.match(/^\s*(\d?\s*[^\d:]+?)\s+(\d+)/);
  if (!m) return undefined;
  const book = bibleBooks.find((b) => normalize(b.name) === normalize(m[1]));
  return book ? `/bible/${book.slug}/${m[2]}` : undefined;
}

export function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (isObj(x) ? str(x.ref, x.reference, x.text, x.title, x.verse, x.label) : str(x))).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(/\s*(?:[;·|\n]|\s\/\s)\s*/).filter(Boolean);
  return [];
}

const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

function toTheme(x: Raw): WeeklyTheme | null {
  const data = isObj(x.legacy_data) ? { ...x.legacy_data, ...x } : x;
  const title = str(data.title, data.theme, data.name, data.titre, data.subject);
  if (!title) return null;
  const start = dateOf(data.start_date ?? data.startDate ?? data.week_start ?? data.weekStart ?? data.from);
  const end = dateOf(data.end_date ?? data.endDate ?? data.week_end ?? data.weekEnd ?? data.to);
  const refs = toList(data.readings ?? data.references ?? data.refs ?? data.verses ?? data.bibleReferences ?? data.reference ?? data.verse);
  const weekRaw = data.week ?? data.weekNumber ?? data.week_number ?? data.semaine;
  return {
    week: typeof weekRaw === 'number' ? weekRaw : Number(weekRaw) || null,
    title,
    period: start && end ? `du ${fmt(start)} au ${fmt(end)}` : start ? `à partir du ${fmt(start)}` : '',
    readings: refs.map((ref, i) => ({ label: refs.length > 1 ? `${i + 1}${i === 0 ? 're' : 'e'} lecture` : 'Lecture', ref, to: bibleLink(ref) })),
    summary: stripHtml(str(data.summary, data.description, data.content, data.body, data.text, data.message)),
    meditation: toList(data.meditations ?? data.meditation ?? data.days ?? data.daily),
  };
}

/** Clé ISO de la semaine, au format utilisé par l'API (ex. « 2026-W44 »). */
export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Les champs `data` / `legacy_payload` sont des chaînes JSON : on les déplie. */
export function expandRow(x: Raw): Raw {
  const parse = (v: unknown) => {
    if (isObj(v)) return v;
    if (typeof v === 'string' && v.trim().startsWith('{')) {
      try {
        const o = JSON.parse(v);
        return isObj(o) ? o : {};
      } catch {
        return {};
      }
    }
    return {};
  };
  return { ...parse(x.legacy_payload), ...parse(x.data), ...x, data: undefined, legacy_payload: undefined };
}

/**
 * L'API mélange le thème de la semaine (weekly_themes/2026-W44) et les cultes de la semaine
 * (weekly_themes/2026-W44/event_days/…). Seul le premier est le « thème » : jamais le titre d'un culte.
 */
export function splitRows(rows: Raw[]) {
  const themes: Raw[] = [];
  const days: Raw[] = [];
  for (const r of rows) (/\/event_days\//.test(str(r.legacy_path)) || r.dayKey || r.time ? days : themes).push(r);
  return { themes, days };
}

export const weekOf = (r: Raw) => (str(r.legacy_path, r.public_id, r.legacy_id).match(/\d{4}-W\d{2}/) ?? [''])[0];

/** Titre du thème éventuellement recopié dans les cultes (themeTitle, weekTheme…). */
function themeFromDays(days: Raw[]) {
  for (const d of days) {
    const t = str(d.themeTitle, d.theme_title, d.weekTheme, d.week_theme, d.themeName, isObj(d.theme) ? d.theme.title : d.theme);
    if (t) return { ...d, title: t };
  }
  return null;
}

let cache: WeeklyTheme | null | undefined;

async function loadCurrentTheme(signal: AbortSignal): Promise<WeeklyTheme | null> {
  const key = isoWeekKey();
  const rows: Raw[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 15; i++) {
    const res = await api.getRaw<Raw>('/v1/weekly-themes', { cursor }, signal);
    const list = Array.isArray(res.data) ? res.data.filter(isObj).map(expandRow) : [];
    rows.push(...list);
    if (list.some((r) => weekOf(r) === key && !/\/event_days\//.test(str(r.legacy_path)))) break;
    const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
    if (page.has_more !== true || typeof page.next_cursor !== 'string') break;
    cursor = page.next_cursor;
  }
  const published = rows.filter((r) => !/draft|archiv/i.test(str(r.status)) && !r.deleted_at);
  const { themes, days } = splitRows(published);
  const current = themes.find((t) => weekOf(t) === key) ?? themeFromDays(days.filter((d) => weekOf(d) === key));
  if (!current) return null;
  const theme = toTheme(current);
  if (theme && !theme.week) theme.week = Number(key.slice(-2));
  return theme;
}

/** Thème réel (API) pour un compte connecté, thème de démonstration sinon. */
export function useWeeklyTheme() {
  const accountRemote = useApp((s) => !!s.account?.remote);
  const remote = accountRemote || (import.meta.env.VITE_DATA_MODE ?? 'api') !== 'demo';
  const [theme, setTheme] = useState<WeeklyTheme | null | undefined>(remote ? cache : demoTheme);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!remote) {
      setTheme(demoTheme);
      return;
    }
    if (cache !== undefined) return;
    const ctrl = new AbortController();
    loadCurrentTheme(ctrl.signal)
      .then((t) => {
        cache = t;
        setTheme(t);
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') {
          setError(true);
          setTheme(null);
        }
      });
    return () => ctrl.abort();
  }, [remote]);

  return { theme, loading: remote && theme === undefined && !error, error };
}
