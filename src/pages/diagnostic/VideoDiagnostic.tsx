import { useState } from 'react';
import { Check, ClipboardCopy, Film } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { appStore } from '@/store/app';
import { embedUrl, isHls } from '@/components/MediaPlayer';
import { toVideo } from '@/services/streaming';
import { expandRow } from '@/services/weeklyTheme';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { copyText } from '@/lib/utils';

/**
 * Diagnostic interne des vidéos : pour chaque vidéo, les champs utiles et le test de chaque lien
 * dans ce navigateur (lisible ? format ? erreur ?). Rapport court, prévu pour être copié tel quel.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const USEFUL = /url|path|video|file|src|thumb|poster|image|cover|link|media|stream|hls|youtube|mime|codec|format|type|duration|status|provider/i;
const hideToken = (s: string) => s.replace(/([?&](?:token|signature|sig|key|X-Amz-Signature)=)[^&]+/gi, '$1…');

function short(v: unknown, depth = 0): unknown {
  if (typeof v === 'string') return hideToken(v.length > 220 ? `${v.slice(0, 220)}…` : v);
  if (Array.isArray(v)) return v.slice(0, 3).map((x) => short(x, depth + 1));
  if (isObj(v)) return depth > 2 ? '{…}' : Object.fromEntries(Object.entries(v).filter(([k]) => USEFUL.test(k)).map(([k, x]) => [k, short(x, depth + 1)]));
  return v;
}

const MEDIA_ERRORS: Record<number, string> = { 1: 'chargement interrompu', 2: 'erreur réseau', 3: 'format non décodable (codec)', 4: 'format ou adresse non pris en charge' };

/** Teste un lien dans ce navigateur : intégration, flux HLS, ou fichier lu par une balise <video>. */
async function probe(src: string): Promise<string> {
  if (embedUrl(src)) return 'intégration (YouTube / Vimeo / Facebook) — lisible';
  let http = '';
  try {
    const res = await fetch(src, { method: 'GET', headers: { Range: 'bytes=0-1023' }, cache: 'no-store' });
    http = `HTTP ${res.status} · ${res.headers.get('content-type') ?? 'type inconnu'}`;
    void res.body?.cancel();
  } catch {
    http = 'requête bloquée (CORS) ou serveur injoignable';
  }
  if (isHls(src)) return `flux HLS · ${http}`;
  const result = await new Promise<string>((resolve) => {
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.muted = true;
    const done = (r: string) => {
      window.clearTimeout(timer);
      el.removeAttribute('src');
      el.load();
      resolve(r);
    };
    const timer = window.setTimeout(() => done('aucune réponse en 12 s'), 12000);
    el.onloadedmetadata = () => done(el.videoWidth ? `LISIBLE · ${el.videoWidth}×${el.videoHeight} · ${Math.round(el.duration)} s` : `audio seul ou image absente · ${Math.round(el.duration)} s`);
    el.onerror = () => done(`ILLISIBLE · ${MEDIA_ERRORS[el.error?.code ?? 0] ?? 'erreur inconnue'}`);
    el.src = src;
  });
  return `${result} · ${http}`;
}

async function rowsOf(path: string) {
  const res = await api.getRaw<Raw>(path, { limit: 30 });
  const data = Array.isArray(res.data) ? res.data : isObj(res.data) && Array.isArray(res.data.items) ? res.data.items : [];
  return (data.filter(isObj) as Raw[]).map((r) => expandRow(isObj(r.legacy_data) ? { ...r.legacy_data, ...r } : r));
}

async function runVideoDiagnostic(onProgress: (text: string) => void) {
  const lines: string[] = [`Navigateur : ${navigator.userAgent.replace(/\s+/g, ' ').slice(0, 160)}`, ''];
  for (const [label, path, live] of [['Vidéos', '/v1/videos', false], ['Directs', '/v1/live/sessions', true]] as const) {
    let rows: Raw[] = [];
    try {
      rows = await rowsOf(path);
    } catch (e) {
      lines.push(`### ${label} — erreur : ${(e as Error).message}`, '');
      continue;
    }
    lines.push(`### ${label} — ${rows.length} élément(s) lus (12 premiers testés)`);
    for (const row of rows.slice(0, 12)) {
      const v = toVideo(row, { live });
      lines.push('', `• ${String(row.title ?? row.name ?? row.id)}`);
      lines.push(`  champs : ${JSON.stringify(short(row))}`);
      lines.push(`  vignette retenue : ${v?.thumbnail ? hideToken(v.thumbnail) : 'aucune'}`);
      if (!v || v.sources.length === 0) lines.push('  liens retenus : aucun');
      for (const src of v?.sources ?? []) {
        onProgress([...lines, `  test en cours : ${hideToken(src)}`].join('\n'));
        lines.push(`  lien : ${hideToken(src)}`, `    → ${await probe(src)}`);
      }
      onProgress(lines.join('\n'));
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function VideoDiagnostic() {
  const [report, setReport] = useState('');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <section className="card rounded-2xl p-4">
      <p className="mb-1 flex items-center gap-2 font-bold"><Film size={18} className="text-brand-600" /> Test de lecture des vidéos</p>
      <p className="mb-3 text-sm text-ink-muted">Teste chaque lien de vidéo dans ce navigateur. Le rapport est court : copiez-le seul.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button icon={Film} loading={running} loadingText="Test en cours…" onClick={async () => { setRunning(true); setCopied(false); setReport(await runVideoDiagnostic(setReport)); setRunning(false); }}>Tester les vidéos</Button>
        <Button variant="ghost" icon={copied ? Check : ClipboardCopy} disabled={!report || running} onClick={async () => { const ok = await copyText(report); setCopied(ok); toast(ok ? 'Rapport vidéos copié' : 'Copie impossible', { tone: ok ? 'success' : 'danger' }); }}>
          {copied ? 'Copié' : 'Copier ce rapport'}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-sunken p-3 text-xs leading-relaxed text-ink-soft">{report || 'Non lancé.'}</pre>
    </section>
  );
}

/* ───────────── Profils (photos des amis) ───────────── */

const PHOTO = /photo|avatar|image|picture|pic|cover|banner|logo|name/i;

function probeImage(src: string) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    const t = window.setTimeout(() => resolve('aucune réponse en 10 s'), 10000);
    img.onload = () => { window.clearTimeout(t); resolve(`CHARGÉE · ${img.naturalWidth}×${img.naturalHeight}`); };
    img.onerror = () => { window.clearTimeout(t); resolve('ÉCHEC du chargement'); };
    img.src = src;
  });
}

async function runProfileDiagnostic(onProgress: (t: string) => void) {
  const lines: string[] = [];
  const friends = await api.get<unknown>('/v1/friends').catch(() => []);
  const rows = (Array.isArray(friends) ? friends : []).filter(isObj).slice(0, 6);
  lines.push(`### Amis — ${rows.length} testés`);
  for (const f of rows) {
    const profiles = Array.isArray(f.profiles) ? f.profiles.filter(isObj) : [];
    lines.push('', `• amitié : ${JSON.stringify(short(profiles))}`);
    for (const p of profiles) {
      const uid = String(p.uid ?? '');
      if (!uid) continue;
      for (const col of ['users', 'user_data']) {
        const doc = await api.get<unknown>(`/v1/resources/${col}/${encodeURIComponent(uid)}`, { __kind: 'doc' }).catch((e: Error) => `erreur : ${e.message}`);
        const data = isObj(doc) && isObj(doc.data) ? doc.data : doc;
        const fields = isObj(data) ? Object.fromEntries(Object.entries(data).filter(([k]) => PHOTO.test(k)).map(([k, v]) => [k, typeof v === 'string' ? hideToken(v.slice(0, 220)) : isObj(v) ? '{objet}' : v])) : data;
        lines.push(`  ${col}/${uid.slice(0, 6)}… : ${JSON.stringify(fields)}`);
        if (isObj(fields)) for (const [k, v] of Object.entries(fields)) if (typeof v === 'string' && /^https?:/.test(v)) lines.push(`    ${k} → ${await probeImage(v)}`);
        onProgress(lines.join('\n'));
      }
    }
  }
  return lines.join('\n');
}

export function ProfileDiagnostic() {
  const [report, setReport] = useState('');
  const [running, setRunning] = useState(false);
  return (
    <section className="card rounded-2xl p-4">
      <p className="mb-1 flex items-center gap-2 font-bold"><Film size={18} className="text-brand-600" /> Test des photos de profil</p>
      <p className="mb-3 text-sm text-ink-muted">Lit la fiche de vos premiers amis et teste leurs photos dans ce navigateur.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button loading={running} loadingText="Test en cours…" onClick={async () => { setRunning(true); setReport(await runProfileDiagnostic(setReport)); setRunning(false); }}>Tester les profils</Button>
        <Button variant="ghost" icon={ClipboardCopy} disabled={!report || running} onClick={async () => toast((await copyText(report)) ? 'Rapport profils copié' : 'Copie impossible')}>Copier ce rapport</Button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-sunken p-3 text-xs leading-relaxed text-ink-soft">{report || 'Non lancé.'}</pre>
    </section>
  );
}

/* ───────────── Discussions (structure seulement, textes masqués) ───────────── */

const PRIVATE_TEXT = /text|body|content|message|caption|preview|last_message_text/i;

/** Garde les noms de champs et les types ; remplace tout texte de message par sa longueur. */
function structure(v: unknown, depth = 0, key = ''): unknown {
  if (typeof v === 'string') {
    if (PRIVATE_TEXT.test(key)) return `[texte masqué, ${v.length} car.]`;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '[e-mail masqué]';
    if (/^\+?[\d\s.-]{8,}$/.test(v)) return '[numéro masqué]';
    return hideToken(v.length > 80 ? `${v.slice(0, 80)}…` : v);
  }
  if (Array.isArray(v)) return depth > 3 ? `[${v.length} éléments]` : [...v.slice(0, 2).map((x) => structure(x, depth + 1, key)), ...(v.length > 2 ? [`… ${v.length - 2} de plus`] : [])];
  if (isObj(v)) return depth > 3 ? '{…}' : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, /token|password|secret/i.test(k) ? '[masqué]' : structure(x, depth + 1, k)]));
  return v;
}

/** Teste chaque route possible des discussions et montre la forme de la réponse (textes masqués). */
async function runChatDiagnostic(onProgress: (t: string) => void) {
  const lines: string[] = [];
  const uid = appStore.get().account?.uid ?? '';
  // Identifiant de discussion vu dans les notifications (champ chatId), utile pour tester les routes « par discussion ».
  let chatId = '';
  try {
    const inbox = await api.get<unknown>('/v1/push/inbox');
    const items = isObj(inbox) && Array.isArray(inbox.items) ? inbox.items : [];
    for (const n of items) if (isObj(n) && isObj(n.data) && typeof n.data.chatId === 'string') { chatId = n.data.chatId; break; }
  } catch { /* sans notification */ }
  lines.push(`uid du compte : ${uid ? `${uid.slice(0, 6)}…` : 'inconnu'} · chatId vu dans les notifications : ${chatId ? `${chatId.slice(0, 6)}…` : 'aucun'}`);
  const probe = async (label: string, path: string, query?: Record<string, string | number>) => {
    try {
      const res = await api.getRaw<unknown>(path, query);
      lines.push('', `### OK — ${label}`, JSON.stringify(structure(res), null, 2).slice(0, 2500));
    } catch (e) {
      lines.push('', `### ÉCHEC — ${label} : ${(e as Error).message}${e instanceof ApiError ? ` (code ${e.status})` : ''}`);
    }
    onProgress(lines.join('\n'));
  };
  await probe('GET /v1/conversations', '/v1/conversations');
  await probe('GET /v1/conversations?limit=5', '/v1/conversations', { limit: 5 });
  if (chatId) {
    await probe('GET /v1/conversations/{chatId}', `/v1/conversations/${encodeURIComponent(chatId)}`);
    await probe('GET /v1/conversations/{chatId}/messages', `/v1/conversations/${encodeURIComponent(chatId)}/messages`, { limit: 3 });
    await probe('GET /v1/resources/chats/{chatId} (document)', `/v1/resources/chats/${encodeURIComponent(chatId)}`, { __kind: 'doc' });
    await probe('GET /v1/resources/chats/{chatId}/messages', `/v1/resources/chats/${encodeURIComponent(chatId)}/messages`, { per_page: 3 });
  }
  for (const field of ['participants', 'participantIds', 'members', 'memberIds']) {
    await probe(`GET /v1/resources/chats (filtre ${field} contient mon uid)`, '/v1/resources/chats', { 'filter[]': JSON.stringify({ field, operator: 'array-contains', value: uid }), per_page: 2 });
  }
  return lines.join('\n');
}

export function ChatDiagnostic() {
  const [report, setReport] = useState('');
  const [running, setRunning] = useState(false);
  return (
    <section className="card rounded-2xl p-4">
      <p className="mb-1 flex items-center gap-2 font-bold"><Film size={18} className="text-brand-600" /> Structure des discussions</p>
      <p className="mb-3 text-sm text-ink-muted">Montre la forme des conversations et des messages. Le contenu des messages est masqué.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button loading={running} loadingText="Lecture…" onClick={async () => { setRunning(true); setReport(await runChatDiagnostic(setReport)); setRunning(false); }}>Analyser les discussions</Button>
        <Button variant="ghost" icon={ClipboardCopy} disabled={!report || running} onClick={async () => toast((await copyText(report)) ? 'Rapport discussions copié' : 'Copie impossible')}>Copier ce rapport</Button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-sunken p-3 text-xs leading-relaxed text-ink-soft">{report || 'Non lancé.'}</pre>
    </section>
  );
}
