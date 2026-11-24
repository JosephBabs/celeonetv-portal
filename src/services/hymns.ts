import { useEffect } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { getHymn, hymnBooks, hymnNumbers, hymnTitle } from '@/data/hymns';
import { useApp } from '@/store/app';
import { normalize } from '@/lib/utils';
import { expandRow, isObj, str, stripHtml, type Raw } from './weeklyTheme';

/**
 * Cantiques : recueil réel (GET /v1/cantiques) pour un compte connecté, recueil de démonstration sinon.
 * Les pages lisent tout via useHymnCatalog() / useHymn(), sans savoir d'où viennent les données.
 */

export interface HymnBlock {
  label: string;
  lines: string[];
  refrain?: boolean;
}

export interface HymnView {
  key: string;
  bookId: string;
  bookLabel: string;
  number: number;
  title: string;
  tone?: string;
  blocks: HymnBlock[];
  audioUrl?: string;
  scoreUrl?: string;
  hasAudio: boolean;
  hasScore: boolean;
  demo: boolean;
  /** Identifiant côté API, pour charger les paroles si la liste ne les contient pas. */
  apiId?: string;
}

export interface CatalogBook {
  id: string;
  label: string;
  short: string;
  numbers: number[];
}

/* ───────────── Démo ───────────── */

function demoHymn(bookId: string, n: number): HymnView | null {
  const h = getHymn(bookId, n);
  if (!h) return null;
  return {
    key: `${bookId}-${n}`,
    bookId,
    bookLabel: h.book.label,
    number: n,
    title: h.title,
    tone: h.key,
    blocks: h.stanzas.map((lines, i) => ({ label: `Couplet ${i + 1}`, lines })).flatMap((b) => [b, { label: 'Refrain', lines: h.refrain, refrain: true }]),
    hasAudio: h.hasAudio,
    hasScore: h.hasScore,
    demo: true,
  };
}

const demoBooks = (): CatalogBook[] => hymnBooks.map((b) => ({ id: b.id, label: b.label, short: b.short, numbers: hymnNumbers(b.id) }));

/* ───────────── Lecture de l'API ───────────── */

const LANGS: Record<string, string> = {
  fr: 'Français', fra: 'Français', french: 'Français', francais: 'Français',
  en: 'Anglais', eng: 'Anglais', english: 'Anglais', anglais: 'Anglais',
  yo: 'Yoruba', yor: 'Yoruba', yoruba: 'Yoruba',
  gun: 'Goun', goun: 'Goun', gou: 'Goun', fon: 'Fon',
};

const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cantiques';
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function numberOf(x: Raw) {
  for (const v of [x.number, x.numero, x.num, x.hymnNumber, x.hymn_number, x.no, x.order, x.index]) {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d]/g, '')) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  const m = str(x.title, x.public_id, x.legacy_id).match(/\b(\d{1,4})\b/);
  return m ? Number(m[1]) : 0;
}

function bookOf(x: Raw) {
  const fromObj = (v: unknown) => (isObj(v) ? str(v.name, v.title, v.label) : str(v));
  const book = [x.book, x.bookName, x.book_name, x.recueil, x.hymnal, x.hymnBook, x.collectionName, x.category, x.categorie].map(fromObj).find(Boolean);
  const lang = str(x.language, x.lang, x.langue, x.locale);
  const label = book || LANGS[normalize(lang)] || cap(lang) || (str(x.legacy_path).split('/').find((p, i, all) => i > 0 && i < all.length - 1 && !/^\d+$/.test(p)) ?? '');
  const clean = LANGS[normalize(label)] ?? cap(label);
  return clean || 'Cantiques';
}

const REFRAIN = /^(refrain|chorus|r\s*[:.)]|ref\.?\s*:?|egbe|ègbè|ohia)\s*[:.-]?\s*/i;
const VERSE_NUM = /^(\d{1,2})\s*[.):-]\s*/;

/**
 * HTML du recueil (hymnContent) → texte : une ligne par <p>, un <br> isolé ou un <p> vide
 * entre deux paragraphes sépare les couplets (ligne vide).
 */
function lyricsText(raw: string) {
  const STANZA = '[[couplet]]';
  const html = raw
    .replace(/>\s+</g, '><')
    .replace(/(<\/p>)((?:<br\s*\/?>)+)/gi, `$1${STANZA}`)
    .replace(/<p[^>]*>\s*<\/p>/gi, STANZA)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n');
  const decoded = /<[a-z!]|&[a-z#0-9]+;/i.test(html) ? (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '') : html;
  return decoded
    .split(STANZA)
    .join('\n\n')
    .replace(/\u00a0/g, ' ')
    // « … Ogo.                    Amin » : le « Amin » final passe sur sa propre ligne.
    .replace(/[ \t]{3,}(Amin|Amen)(\.?)\s*$/i, '\n$1$2');
}

/** Paroles brutes (texte, HTML ou tableau) → blocs « Couplet n » / « Refrain ». */
export function toBlocks(raw: unknown): HymnBlock[] {
  if (Array.isArray(raw)) {
    const blocks: HymnBlock[] = [];
    let verse = 0;
    for (const item of raw) {
      const text = isObj(item) ? str(item.text, item.lyrics, item.content, item.lines) || (Array.isArray(item.lines) ? item.lines.join('\n') : '') : str(item);
      if (!text) continue;
      const type = isObj(item) ? str(item.type, item.kind, item.label) : '';
      const refrain = /refrain|chorus/i.test(type) || REFRAIN.test(text);
      const lines = stripHtml(text).replace(REFRAIN, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      blocks.push(refrain ? { label: 'Refrain', lines, refrain: true } : { label: `Couplet ${++verse}`, lines });
    }
    return blocks;
  }
  const text = typeof raw === 'string' ? lyricsText(raw) : '';
  if (!text.trim()) return [];
  let verse = 0;
  const blocks: HymnBlock[] = text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      if (REFRAIN.test(lines[0])) {
        const first = lines[0].replace(REFRAIN, '');
        return { label: 'Refrain', lines: first ? [first, ...lines.slice(1)] : lines.slice(1), refrain: true };
      }
      const m = lines[0].match(VERSE_NUM);
      if (m) verse = Number(m[1]);
      else verse += 1;
      return { label: `Couplet ${verse}`, lines: (m ? [lines[0].replace(VERSE_NUM, ''), ...lines.slice(1)] : lines).map((l) => l.replace(/\s{2,}/g, ' ')).filter(Boolean) };
    });
  // Un seul bloc sans numéro : pas d'intitulé « Couplet 1 ».
  if (blocks.length === 1 && !blocks[0].refrain && !VERSE_NUM.test(text.trim())) blocks[0].label = '';
  return blocks;
}

/** Premier champ de paroles non vide (l'API utilise « hymnContent », en HTML). */
const lyricsOf = (x: Raw) =>
  [x.hymnContent, x.hymn_content, x.lyrics, x.paroles, x.stanzas, x.couplets, x.verses, x.text, x.content, x.body, x.words].find((v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== ''));
const urlOf = (...vals: unknown[]) => vals.map((v) => (isObj(v) ? str(v.url, v.src, v.downloadURL) : str(v))).find((v) => /^https?:\/\//.test(v)) || undefined;

export function toHymn(input: unknown): HymnView | null {
  if (!isObj(input)) return null;
  const x = expandRow(isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input);
  if (x.deleted_at || /draft|archiv/i.test(str(x.status))) return null;
  const number = numberOf(x);
  if (!number) return null;
  const bookLabel = bookOf(x);
  const bookId = slug(bookLabel);
  const tr = isObj(x.titleTranslations) ? x.titleTranslations : {};
  const title = str(x.title, x.titre, x.name, tr.fr, tr.en).replace(new RegExp(`^(n[°o]\\s*)?${number}\\s*[.:-]\\s*`, 'i'), '') || `Cantique ${number}`;
  const audioUrl = urlOf(x.audioUrl, x.audio_url, x.audio, x.audioFile, x.mp3, x.mp3Url, x.soundUrl, x.media_url);
  const scoreUrl = urlOf(x.scoreUrl, x.score_url, x.partition, x.partitionUrl, x.sheetUrl, x.pdfUrl, x.pdf);
  const apiId = str(x.public_id, x.legacy_id) || (x.id !== undefined ? String(x.id) : '');
  return {
    key: `${bookId}-${number}`,
    bookId,
    bookLabel,
    number,
    title,
    tone: str(x.musicalKey, x.musical_key, x.key, x.tonalite, x.tonality) || undefined,
    blocks: toBlocks(lyricsOf(x)),
    audioUrl,
    scoreUrl,
    hasAudio: !!audioUrl,
    hasScore: !!scoreUrl,
    demo: false,
    apiId: x.id !== undefined ? String(x.id) : apiId,
  };
}

/* ───────────── Catalogue réel (en mémoire) ───────────── */

interface CatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  hymns: Record<string, HymnView>;
  rows: number;
  error?: string;
}
export const hymnStore = createStore<CatalogState>(() => ({ status: 'idle', hymns: {}, rows: 0 }));

let loading: Promise<void> | null = null;

async function loadCatalog() {
  hymnStore.set({ status: 'loading', error: undefined });
  try {
    let cursor: string | undefined;
    for (let i = 0; i < 120; i++) {
      const res = await api.getRaw<Raw>('/v1/cantiques', { limit: 100, cursor });
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map(toHymn).filter((h): h is HymnView => !!h);
      // Affichage progressif : chaque page s'ajoute dès réception.
      hymnStore.set((s) => ({ hymns: { ...s.hymns, ...Object.fromEntries(mapped.map((h) => [h.key, h])) }, rows: s.rows + list.length }));
      const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
      const next = typeof page.next_cursor === 'string' ? page.next_cursor : typeof res.nextCursor === 'string' ? res.nextCursor : null;
      if (!next || page.has_more === false || res.hasMore === false || list.length === 0) break;
      cursor = next;
    }
    hymnStore.set({ status: 'ready' });
  } catch (e) {
    hymnStore.set({ status: 'error', error: (e as Error).message });
    loading = null;
  }
}

export function ensureCatalog() {
  if (!loading) loading = loadCatalog();
  return loading;
}

function booksOf(hymns: Record<string, HymnView>): CatalogBook[] {
  const map = new Map<string, CatalogBook>();
  for (const h of Object.values(hymns)) {
    let b = map.get(h.bookId);
    if (!b) map.set(h.bookId, (b = { id: h.bookId, label: h.bookLabel, short: h.bookLabel.slice(0, 2).toUpperCase(), numbers: [] }));
    b.numbers.push(h.number);
  }
  for (const b of map.values()) b.numbers = [...new Set(b.numbers)].sort((a, c) => a - c);
  return [...map.values()].sort((a, c) => c.numbers.length - a.numbers.length || a.label.localeCompare(c.label));
}

let booksCache: { src: Record<string, HymnView>; books: CatalogBook[] } | null = null;

/** Recueils et cantiques à afficher, avec l'état de chargement. */
export function useHymnCatalog() {
  const remote = useApp((s) => !!s.account?.remote);
  const state = hymnStore.use((s) => s);
  useEffect(() => {
    if (remote) void ensureCatalog();
  }, [remote]);
  if (!remote) {
    return { remote, status: 'ready' as const, books: demoBooks(), rows: 0, error: undefined, get: demoHymn, title: (b: string, n: number) => hymnTitle(b, n) };
  }
  if (booksCache?.src !== state.hymns) booksCache = { src: state.hymns, books: booksOf(state.hymns) };
  const get = (b: string, n: number) => state.hymns[`${b}-${n}`] ?? null;
  return { remote, status: state.status, books: booksCache.books, rows: state.rows, error: state.error, get, title: (b: string, n: number) => get(b, n)?.title ?? `Cantique ${n}` };
}

/** Paroles absentes de la liste : on charge le cantique seul (GET /v1/cantiques/{id}). */
export async function ensureLyrics(h: HymnView) {
  if (h.demo || h.blocks.length || !h.apiId) return;
  try {
    const raw = await api.get<unknown>(`/v1/cantiques/${encodeURIComponent(h.apiId)}`);
    const full = toHymn(isObj(raw) && isObj(raw.cantique) ? raw.cantique : raw);
    if (full?.blocks.length) hymnStore.set((s) => ({ hymns: { ...s.hymns, [h.key]: { ...h, ...full, key: h.key, bookId: h.bookId, bookLabel: h.bookLabel } } }));
  } catch {
    /* le détail affichera « paroles indisponibles » */
  }
}
