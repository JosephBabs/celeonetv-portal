import { useEffect } from 'react';
import { api } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { churchDocuments, documentCategories, getDocument, type ChurchDocument, type DocSection } from '@/data/documents';
import { useApp } from '@/store/app';
import { dateOf, expandRow, isObj, str, type Raw } from './weeklyTheme';

/**
 * Documents de l'Église : GET /v1/documents pour un compte connecté, documents de démonstration sinon.
 * Le texte (souvent du HTML d'éditeur) est découpé en sections : titres, paragraphes, listes.
 */

export interface DocView extends ChurchDocument {
  /** Fichier joint (PDF…), affiché quand le document n'a pas de texte. */
  fileUrl?: string;
  demo: boolean;
  apiId?: string;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const CATEGORY_LABELS: Record<string, string> = {
  essentials: 'Essentiels', essentiel: 'Essentiels', essentiels: 'Essentiels',
  doctrine: 'Doctrines', doctrines: 'Doctrines',
  liturgy: 'Liturgie', liturgie: 'Liturgie',
  history: 'Histoire', histoire: 'Histoire',
  rules: 'Règlements', reglement: 'Règlements', règlement: 'Règlements',
};
const labelOf = (v: string) => CATEGORY_LABELS[v.toLowerCase()] ?? cap(v);

/* ───────────── Texte → sections ───────────── */

const clean = (s: string) => s.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
const looksLikeHeading = (t: string) => t.length > 1 && t.length <= 90 && !/[.,;:]$/.test(t) && t === t.toUpperCase() && /[A-ZÀ-Ý]/.test(t);

function fromPlainText(text: string): DocSection[] {
  const sections: DocSection[] = [];
  let cur: DocSection = {};
  const push = () => {
    if (cur.heading || cur.paragraphs?.length || cur.list?.length) sections.push(cur);
    cur = {};
  };
  for (const chunk of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map(clean).filter(Boolean);
    if (!lines.length) continue;
    if (lines.length === 1 && looksLikeHeading(lines[0])) {
      push();
      cur.heading = lines[0];
      continue;
    }
    const items = lines.filter((l) => /^(\d{1,2}[.)]|[-•*])\s+/.test(l));
    if (items.length === lines.length && items.length > 1) (cur.list ??= []).push(...items.map((l) => l.replace(/^(\d{1,2}[.)]|[-•*])\s+/, '')));
    else (cur.paragraphs ??= []).push(lines.join(' '));
  }
  push();
  return sections;
}

function fromHtml(html: string): DocSection[] {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const sections: DocSection[] = [];
  let cur: DocSection = {};
  const push = () => {
    if (cur.heading || cur.paragraphs?.length || cur.list?.length) sections.push(cur);
    cur = {};
  };
  const paragraph = (el: Element) => {
    // Un <br> dans un paragraphe = nouvelle ligne → paragraphes distincts.
    const parts = (el.innerHTML.split(/<br\s*\/?>/i).map((p) => clean(new DOMParser().parseFromString(p, 'text/html').body.textContent ?? '')) ?? []).filter(Boolean);
    const onlyBold = el.children.length === 1 && /^(STRONG|B)$/.test(el.children[0].tagName) && clean(el.children[0].textContent ?? '') === clean(el.textContent ?? '');
    if (parts.length === 1 && (onlyBold || looksLikeHeading(parts[0])) && parts[0].length <= 90) {
      push();
      cur.heading = parts[0];
    } else (cur.paragraphs ??= []).push(...parts);
  };
  const walk = (nodes: NodeListOf<ChildNode> | ChildNode[]) => {
    for (const node of Array.from(nodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = clean(node.textContent ?? '');
        if (t) (cur.paragraphs ??= []).push(t);
        continue;
      }
      if (!(node instanceof Element)) continue;
      const tag = node.tagName;
      if (/^H[1-6]$/.test(tag)) {
        push();
        cur.heading = clean(node.textContent ?? '');
      } else if (tag === 'UL' || tag === 'OL') {
        const items = Array.from(node.querySelectorAll(':scope > li')).map((li) => clean(li.textContent ?? '')).filter(Boolean);
        if (items.length) (cur.list ??= []).push(...items);
      } else if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'BLOCKQUOTE') {
        // Éditeurs « contenteditable » : un <div> par ligne, ou des blocs imbriqués.
        if (Array.from(node.children).some((c) => /^(P|DIV|H[1-6]|UL|OL|SECTION|BLOCKQUOTE)$/.test(c.tagName))) walk(node.childNodes);
        else paragraph(node);
      } else if (tag === 'P') paragraph(node);
      else if (tag !== 'BR') {
        const t = clean(node.textContent ?? '');
        if (t) (cur.paragraphs ??= []).push(t);
      }
    }
  };
  walk(body.childNodes);
  push();
  return sections;
}

export function toSections(raw: unknown): DocSection[] {
  if (Array.isArray(raw)) {
    return raw
      .map((s): DocSection | null => {
        if (typeof s === 'string') return { paragraphs: [clean(s)] };
        if (!isObj(s)) return null;
        const text = str(s.content, s.text, s.body, s.html);
        const inner = text ? toSections(text) : [];
        const list = Array.isArray(s.list) ? s.list.map((l) => clean(String(l))).filter(Boolean) : Array.isArray(s.items) ? s.items.map((l) => clean(String(l))).filter(Boolean) : undefined;
        return { heading: str(s.heading, s.title, s.titre) || undefined, paragraphs: inner.flatMap((i) => [...(i.heading ? [i.heading] : []), ...(i.paragraphs ?? [])]), list: list?.length ? list : inner.flatMap((i) => i.list ?? []) };
      })
      .filter((s): s is DocSection => !!s && !!(s.heading || s.paragraphs?.length || s.list?.length));
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return /<[a-z][\s\S]*>/i.test(raw) ? fromHtml(raw) : fromPlainText(raw);
}

const contentOf = (x: Raw) =>
  [x.documentContent, x.document_content, x.sections, x.contentHtml, x.html, x.content, x.body, x.text, x.texte, x.description].find((v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== ''));
const urlOf = (...vals: unknown[]) => vals.map((v) => (isObj(v) ? str(v.url, v.src, v.downloadURL) : str(v))).find((v) => /^https?:\/\//.test(v)) || undefined;

export function toDocument(input: unknown): DocView | null {
  if (!isObj(input)) return null;
  const x = expandRow(isObj(input.legacy_data) ? { ...input.legacy_data, ...input } : input);
  if (x.deleted_at || /draft|archiv|brouillon/i.test(str(x.status)) || x.isPublished === false) return null;
  const tr = isObj(x.titleTranslations) ? x.titleTranslations : {};
  const title = str(x.title, x.titre, x.name, tr.fr, tr.en);
  const id = str(x.public_id, x.legacy_id, x.slug) || (x.id !== undefined ? String(x.id) : '');
  if (!title || !id) return null;
  const category = labelOf(str(x.category, x.categorie, x.type, x.section, x.group) || 'Documents');
  const fileUrl = urlOf(x.fileUrl, x.file_url, x.pdfUrl, x.pdf_url, x.pdf, x.file, x.documentUrl, x.downloadURL, x.attachment, x.url);
  const updated = dateOf(x.updatedAt ?? x.updated_at ?? x.createdAt ?? x.created_at);
  const pages = Number(x.pages ?? x.pageCount ?? x.page_count) || 0;
  const iconHint = `${category} ${str(x.subcategory, x.subCategory)}`.toLowerCase();
  return {
    id: id.replace(/[^\w-]+/g, '-'),
    title,
    category,
    // « type » (Direction Spirituelle, Biblique…) sert de sous-catégorie quand la catégorie est renseignée.
    subcategory: labelOf(str(x.subcategory, x.subCategory, x.sub_category, x.sousCategorie, x.tag) || (str(x.category, x.categorie) ? str(x.type) : '')) || '',
    reference: str(x.reference, x.ref, x.bibleReference, x.source_reference, x.subtitle),
    icon: /liturg|culte|calend/.test(iconHint) ? 'book' : /histo/.test(iconHint) ? 'scroll' : /doctrin|directive|regle|règle/.test(iconHint) ? 'list' : 'file',
    updatedAt: updated ? updated.toISOString() : '',
    pages,
    sections: toSections(contentOf(x)),
    fileUrl,
    demo: false,
    apiId: x.id !== undefined ? String(x.id) : id,
  };
}

/* ───────────── Catalogue (en mémoire) ───────────── */

interface DocState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  docs: Record<string, DocView>;
  order: string[];
  rows: number;
  error?: string;
}
export const docStore = createStore<DocState>(() => ({ status: 'idle', docs: {}, order: [], rows: 0 }));

let loading: Promise<void> | null = null;

async function loadDocuments() {
  docStore.set({ status: 'loading', error: undefined });
  try {
    let cursor: string | undefined;
    for (let i = 0; i < 30; i++) {
      const res = await api.getRaw<Raw>('/v1/documents', { limit: 100, cursor });
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map(toDocument).filter((d): d is DocView => !!d);
      docStore.set((s) => ({
        docs: { ...s.docs, ...Object.fromEntries(mapped.map((d) => [d.id, d])) },
        order: [...s.order, ...mapped.map((d) => d.id).filter((id) => !s.docs[id])],
        rows: s.rows + list.length,
      }));
      const page = isObj(res.meta) && isObj(res.meta.page) ? res.meta.page : {};
      const next = typeof page.next_cursor === 'string' ? page.next_cursor : null;
      if (!next || page.has_more === false || list.length === 0) break;
      cursor = next;
    }
    docStore.set({ status: 'ready' });
  } catch (e) {
    docStore.set({ status: 'error', error: (e as Error).message });
    loading = null;
  }
}

export function ensureDocuments() {
  if (!loading) loading = loadDocuments();
  return loading;
}

const demoView = (d: ChurchDocument): DocView => ({ ...d, demo: true });

/** Documents à afficher (réels ou démo), catégories et état de chargement. */
export function useDocuments() {
  const remote = useApp((s) => !!s.account?.remote);
  const state = docStore.use((s) => s);
  useEffect(() => {
    if (remote) void ensureDocuments();
  }, [remote]);
  if (!remote) {
    return { remote, status: 'ready' as const, docs: churchDocuments.map(demoView), categories: [...documentCategories] as string[], rows: 0, error: undefined, get: (id: string) => { const d = getDocument(id); return d ? demoView(d) : undefined; } };
  }
  const docs = state.order.map((id) => state.docs[id]).filter(Boolean);
  const categories = [...new Set(docs.map((d) => d.category))];
  return { remote, status: state.status, docs, categories, rows: state.rows, error: state.error, get: (id: string) => state.docs[id] };
}

/** Texte absent de la liste : on charge le document seul (GET /v1/documents/{id}). */
export async function ensureDocumentContent(d: DocView) {
  if (d.demo || d.sections.length || !d.apiId) return;
  try {
    const raw = await api.get<unknown>(`/v1/documents/${encodeURIComponent(d.apiId)}`);
    const full = toDocument(isObj(raw) && isObj(raw.document) ? raw.document : raw);
    if (full && (full.sections.length || full.fileUrl)) docStore.set((s) => ({ docs: { ...s.docs, [d.id]: { ...d, ...full, id: d.id } } }));
  } catch {
    /* le détail affichera « contenu indisponible » */
  }
}

/** Texte brut d'un document (recherche, téléchargement). */
export function docText(d: DocView) {
  return [
    d.title.toUpperCase(),
    [d.category, d.subcategory, d.reference].filter(Boolean).join(' · '),
    '',
    ...d.sections.flatMap((s) => [s.heading ? `\n${s.heading}` : '', ...(s.paragraphs ?? []), ...(s.list ?? []).map((l, i) => `${i + 1}. ${l}`)]),
  ].join('\n');
}
