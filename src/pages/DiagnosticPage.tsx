import { useState } from 'react';
import { Check, ClipboardCopy, Play, ShieldCheck, Stethoscope } from 'lucide-react';
import { api, API_URL } from '@/lib/api';
import { expandRow, isoWeekKey, splitRows } from '@/services/weeklyTheme';
import { useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { cn, copyText } from '@/lib/utils';
import { ChatDiagnostic, ProfileDiagnostic, VideoDiagnostic } from './diagnostic/VideoDiagnostic';

/**
 * Diagnostic de l'API : affiche la forme des réponses (2 éléments par liste) pour adapter l'affichage.
 * Les données sensibles sont masquées avant affichage : rien n'est envoyé ailleurs.
 */
const endpoints = [
  { id: 'weekly', label: 'Thème de la semaine', path: '/v1/weekly-themes', query: {} },
  { id: 'posts', label: 'Fil de l’Accueil (publications officielles)', path: '/v1/posts', query: { limit: 2 } },
  { id: 'feed', label: 'Fil Social', path: '/v1/feed', query: { limit: 2 } },
  { id: 'inbox', label: 'Notifications (boîte de réception)', path: '/v1/push/inbox', query: {} },
  { id: 'cantiques', label: 'Cantiques', path: '/v1/cantiques', query: {} },
  { id: 'songs', label: 'Morceaux (songs)', path: '/v1/songs', query: {} },
  { id: 'albums', label: 'Albums', path: '/v1/albums', query: {} },
  { id: 'documents', label: 'Documents', path: '/v1/documents', query: {} },
  { id: 'history', label: 'Histoire de l’Église', path: '/v1/church-history', query: {} },
  { id: 'parishes', label: 'Paroisses', path: '/v1/parishes', query: {} },
  { id: 'agenda', label: 'Événements (agenda)', path: '/v1/agenda', query: {} },
  { id: 'channels', label: 'Chaînes', path: '/v1/channels', query: {} },
  { id: 'videos', label: 'Vidéos', path: '/v1/videos', query: {} },
  { id: 'lives', label: 'Directs (sessions)', path: '/v1/live/sessions', query: {} },
] as const;

/** Catalogues (cantiques, morceaux, albums) analysés en résumé plutôt qu'en brut. */
const CATALOGS = new Set<string>(['cantiques', 'songs', 'albums', 'documents', 'history', 'parishes', 'agenda', 'channels', 'videos', 'lives']);

const SENSITIVE = /token|password|secret|otp|hash|api[_-]?key|authorization|cookie|session/i;
const PERSONAL = /email|phone|telephone|tel$|mobile|address|adresse|birth|naissance/i;

function sanitize(v: unknown, depth = 0, maxLen = 160): unknown {
  if (depth > 6) return '…';
  if (Array.isArray(v)) {
    const head = v.slice(0, 2).map((x) => sanitize(x, depth + 1, maxLen));
    return v.length > 2 ? [...head, `… ${v.length - 2} élément(s) de plus`] : head;
  }
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, SENSITIVE.test(k) || PERSONAL.test(k) ? '[masqué]' : sanitize(x, depth + 1, maxLen)]),
    );
  }
  if (typeof v === 'string') {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '[e-mail masqué]';
    if (/^\+?[\d\s.-]{8,}$/.test(v)) return '[numéro masqué]';
    return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
  }
  return v;
}

/** Thèmes : parcourt toutes les pages, résume les types de lignes et montre en détail la semaine en cours. */
async function analyseWeekly() {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 15; i++) {
    const res = await api.getRaw<Record<string, unknown>>('/v1/weekly-themes', { cursor });
    const list = Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : [];
    rows.push(...list.map(expandRow));
    const page = (res.meta as { page?: { has_more?: boolean; next_cursor?: string } } | undefined)?.page;
    if (!page?.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
  }
  const shapes: Record<string, number> = {};
  for (const r of rows) {
    const shape = String(r.legacy_path ?? r.legacy_collection ?? '(sans chemin)').replace(/\d{4}-W\d{2}/g, 'SEMAINE').replace(/SEMAINE-[\w-]+/g, 'SEMAINE-ID');
    shapes[shape] = (shapes[shape] ?? 0) + 1;
  }
  const key = isoWeekKey();
  const thisWeek = rows.filter((r) => String(r.legacy_path ?? r.public_id ?? '').includes(key));
  const { themes } = splitRows(rows);
  return JSON.stringify(
    sanitize({ semaine_en_cours: key, lignes_lues: rows.length, types_de_lignes: shapes, semaine_en_cours_detail: thisWeek.slice(0, 4), exemple_ligne_theme: themes.slice(0, 2), champs_disponibles: [...new Set(rows.flatMap((r) => Object.keys(r)))] }, 0, 600),
    null,
    2,
  );
}

/** Catalogue : quelques pages, champs présents, valeurs des champs de classement, plage des numéros, 2 exemples. */
async function analyseCatalog(path: string) {
  const rows: Record<string, unknown>[] = [];
  let firstMeta: unknown;
  let cursor: string | undefined;
  let pages = 0;
  for (; pages < 6; pages++) {
    const res = await api.getRaw<Record<string, unknown>>(path, { cursor, limit: 100 });
    if (pages === 0) firstMeta = res.meta;
    const list = Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : [];
    rows.push(...list.map(expandRow));
    const page = (res.meta as { page?: { has_more?: boolean; next_cursor?: string } } | undefined)?.page;
    if (!page?.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
  }
  const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const valeurs: Record<string, Record<string, number>> = {};
  for (const f of fields.filter((k) => /lang|langue|book|recueil|categor|type|collection|album|status|section|source|legacy_path|legacy_collection/i.test(k))) {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const v = r[f];
      if (v === undefined || v === null || typeof v === 'object') continue;
      const key = String(v).replace(/\d+/g, 'N').slice(0, 60);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    if (Object.keys(counts).length) valeurs[f] = Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12));
  }
  const numeros: Record<string, { min: number; max: number }> = {};
  for (const f of fields.filter((k) => /number|numero|num$|^no$|index|order/i.test(k))) {
    const nums = rows.map((r) => Number(r[f])).filter((n) => Number.isFinite(n));
    if (nums.length) numeros[f] = { min: Math.min(...nums), max: Math.max(...nums) };
  }
  return JSON.stringify(sanitize({ pages_lues: pages + 1, lignes_lues: rows.length, meta_premiere_page: firstMeta, champs_disponibles: fields, valeurs_des_champs_de_classement: valeurs, plages_de_numeros: numeros, exemples: rows.slice(0, 2) }, 0, 400), null, 2);
}

export function DiagnosticPage() {
  const remote = useApp((s) => !!s.account?.remote);
  const [results, setResults] = useState<Record<string, { status: 'ok' | 'error'; body: string }>>({});
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!remote) {
    return <div className="card rounded-3xl"><EmptyState icon={Stethoscope} title="Diagnostic réservé aux comptes réels" text="Connectez-vous avec votre compte CélèOne pour lancer le diagnostic." /></div>;
  }

  const run = async () => {
    setRunning(true);
    setCopied(false);
    const next: typeof results = {};
    for (const e of endpoints) {
      try {
        const body = e.id === 'weekly' ? await analyseWeekly() : CATALOGS.has(e.id) ? await analyseCatalog(e.path) : JSON.stringify(sanitize(await api.getRaw<unknown>(e.path, e.query)), null, 2);
        next[e.id] = { status: 'ok', body };
      } catch (err) {
        next[e.id] = { status: 'error', body: (err as Error).message };
      }
      setResults({ ...next });
    }
    setRunning(false);
  };

  const report = endpoints.map((e) => `### ${e.label} — GET ${e.path}\n${results[e.id]?.body ?? '(non lancé)'}`).join('\n\n');

  return (
    <div className="space-y-4 pb-12">
      <div>
        <p className="eyebrow">Intégration de l'API</p>
        <h1 className="font-display text-[26px] font-black text-brand-900">Diagnostic</h1>
        <p className="text-sm text-ink-muted">Affiche la forme des réponses de {API_URL} pour adapter l'affichage du fil.</p>
      </div>
      <p className="flex items-start gap-2 rounded-2xl bg-mint-100 px-4 py-3 text-sm text-brand-900">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" /> Jetons, mots de passe, e-mails, numéros et adresses sont masqués. Seuls 2 éléments par liste sont affichés. Rien n'est envoyé automatiquement : c'est vous qui copiez le rapport.
      </p>
      <ChatDiagnostic />
      <ProfileDiagnostic />
      <VideoDiagnostic />
      <p className="pt-2 font-bold">Diagnostic général</p>
      <div className="flex flex-wrap gap-2">
        <Button icon={Play} loading={running} loadingText="Analyse…" onClick={run}>Lancer le diagnostic</Button>
        <Button
          variant="ghost"
          icon={copied ? Check : ClipboardCopy}
          disabled={!Object.keys(results).length || running}
          onClick={async () => {
            const ok = await copyText(report);
            setCopied(ok);
            toast(ok ? 'Rapport copié : collez-le dans la conversation' : 'Copie impossible', { tone: ok ? 'success' : 'danger' });
          }}
        >
          {copied ? 'Copié' : 'Copier le rapport'}
        </Button>
      </div>
      {endpoints.map((e) => {
        const r = results[e.id];
        return (
          <section key={e.id} className="card rounded-2xl p-4">
            <p className="mb-2 flex items-center gap-2 font-bold">
              <span className={cn('h-2.5 w-2.5 rounded-full', !r ? 'bg-line-strong' : r.status === 'ok' ? 'bg-brand-500' : 'bg-danger')} />
              {e.label} <code className="text-xs font-normal text-ink-muted">GET {e.path}</code>
            </p>
            <pre className="max-h-80 overflow-auto rounded-xl bg-surface-sunken p-3 text-xs leading-relaxed text-ink-soft">{r?.body ?? 'Non lancé.'}</pre>
          </section>
        );
      })}
    </div>
  );
}
