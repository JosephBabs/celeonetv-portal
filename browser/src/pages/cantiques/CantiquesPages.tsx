import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AArrowDown, AArrowUp, ChevronDown, ChevronLeft, ChevronUp, Copy, Download, Globe, Info, Languages, LayoutGrid, List, Music, Music2, Pause, Play, RotateCw, Rows3,
  Settings, Share2, SkipBack, SkipForward, Star,
} from 'lucide-react';
import { RANGE_SIZE } from '@/data/hymns';
import { ensureCatalog, ensureLyrics, hymnStore, useHymnCatalog, type CatalogBook, type HymnView } from '@/services/hymns';
import { library, player, useLibrary, usePlayer } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { SearchField, SectionHeader } from '@/components/SectionHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { LogoMark } from '@/components/ui/Logo';
import { cn, copyText, normalize } from '@/lib/utils';

type Catalog = ReturnType<typeof useHymnCatalog>;
const labelOf = (books: CatalogBook[], id: string) => books.find((b) => b.id === id)?.label ?? id;
const hasNumber = (books: CatalogBook[], id: string, n: number) => !!books.find((b) => b.id === id)?.numbers.includes(n);

/** Plages de 42 numéros (comme l'app mobile). */
function rangesOf(nums: number[]) {
  const max = nums[nums.length - 1] ?? 0;
  const ranges: { id: string; from: number; to: number; numbers: number[] }[] = [];
  for (let from = 1; from <= max; from += RANGE_SIZE) {
    const to = from + RANGE_SIZE - 1;
    const numbers = nums.filter((n) => n >= from && n <= to);
    if (numbers.length) ranges.push({ id: `${from}-${to}`, from, to, numbers });
  }
  return ranges;
}

function hymnText(h: HymnView) {
  const blocks = h.blocks.map((b) => `${b.refrain ? 'Refrain :' : b.label.replace('Couplet ', '') + '.'}\n${b.lines.join('\n')}`);
  return `Cantique n° ${h.number} — ${h.title} (${h.bookLabel})\n\n${blocks.join('\n\n')}`;
}

/** Chargement, erreur ou recueil vide (compte réel). Rien quand les cantiques sont prêts. */
function CatalogStatus({ cat }: { cat: Catalog }) {
  if (!cat.remote || cat.books.length > 0) return null;
  if (cat.status === 'error') {
    return (
      <div className="card mt-4 rounded-2xl">
        <EmptyState icon={Music} title="Cantiques indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void ensureCatalog()}>Réessayer</Button>} />
      </div>
    );
  }
  if (cat.status === 'ready') {
    return (
      <div className="card mt-4 rounded-2xl">
        <EmptyState icon={Music} title="Aucun cantique publié pour le moment" />
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card flex items-center gap-4 rounded-2xl p-4">
          <span className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-surface-sunken" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-1/2 animate-pulse rounded bg-surface-sunken" />
            <span className="block h-3 w-3/4 animate-pulse rounded bg-surface-sunken" />
          </span>
        </div>
      ))}
    </div>
  );
}

function LanguageSheet({ open, onClose, current, onPick, number, books }: { open: boolean; onClose: () => void; current: string; onPick: (id: string) => void; number?: number; books: CatalogBook[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Choisir la langue" description={number ? `Le cantique n° ${number} sera conservé s'il existe dans la langue choisie.` : undefined} size="sm">
      <div className="space-y-1.5">
        {books.map((b) => {
          const available = !number || b.numbers.includes(number);
          return (
            <button key={b.id} onClick={() => { onPick(b.id); onClose(); }} className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition', current === b.id ? 'bg-mint-100 text-brand-900' : 'hover:bg-surface-sunken')}>
              <span>Cantiques en {b.label}</span>
              <span className="text-xs font-medium text-ink-muted">{number ? (available ? `n° ${number} disponible` : `n° ${number} absent`) : `${b.numbers.length} cantiques`}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ───────────── Niveau 1 : langues ───────────── */

export function CantiquesHomePage() {
  const favorites = useLibrary((s) => s.hymnFavorites);
  const recent = useLibrary((s) => s.hymnRecent);
  const [query, setQuery] = useState('');
  const cat = useHymnCatalog();
  const { books } = cat;

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const num = Number(q.replace(/\D/g, ''));
    return books.flatMap((b) =>
      b.numbers
        .filter((n) => (num && String(n).startsWith(String(num))) || normalize(`${b.label} ${cat.title(b.id, n)}`).includes(q))
        .slice(0, 12)
        .map((n) => ({ book: b, n })),
    ).slice(0, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, books]);

  const shortcut = (key: string) => {
    const cut = key.lastIndexOf('-');
    const b = key.slice(0, cut);
    const n = key.slice(cut + 1);
    // Favoris de la démo absents du recueil réel : masqués.
    if (cat.status === 'ready' && !hasNumber(books, b, Number(n))) return null;
    return (
      <Link key={key} to={`/cantiques/${b}/${n}`} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-[13px] font-semibold hover:border-brand-300">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-mint-100 px-1.5 text-xs font-bold text-brand-700">{n}</span>
        {cat.title(b, Number(n))} <span className="text-ink-faint">· {labelOf(books, b)}</span>
      </Link>
    );
  };

  return (
    <div>
      <SectionHeader title="Cantiques" subtitle={cat.remote && !books.length ? 'Chargement du recueil…' : `${books.length} livre${books.length > 1 ? 's' : ''}${cat.remote && cat.status === 'loading' ? ' · chargement…' : ''}`} />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher des cantiques…" />
      {!query && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-200 bg-mint-100 px-4 py-3 text-sm text-brand-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-600"><Info size={16} /></span>
          Astuce : recherchez par langue, numéro, titre ou texte du cantique.
        </div>
      )}

      {query ? (
        <div className="card mt-4 rounded-2xl p-2">
          {results.length === 0 ? (
            <EmptyState icon={Music} title="Aucun cantique ne correspond à votre recherche" />
          ) : (
            results.map(({ book, n }) => (
              <Link key={`${book.id}-${n}`} to={`/cantiques/${book.id}/${n}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-sunken">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-sm font-bold text-brand-700">{n}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{cat.title(book.id, n)}</span>
                <Chip tone="lavender">{book.label}</Chip>
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          {(favorites.length > 0 || recent.length > 0) && (
            <div className="mt-5 space-y-3">
              {favorites.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted"><Star size={13} /> Mes favoris</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{favorites.map(shortcut)}</div>
                </div>
              )}
              {recent.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Récemment ouverts</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{recent.map(shortcut)}</div>
                </div>
              )}
            </div>
          )}
          <CatalogStatus cat={cat} />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {books.map((b) => (
              <Link key={b.id} to={`/cantiques/${b.id}`} className="card card-hover group relative flex items-center gap-4 rounded-2xl p-4">
                <span className="icon-tile h-14 w-14 shrink-0 rounded-2xl border border-brand-200/60"><Music2 size={24} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-bold">Cantiques en {b.label}</span>
                  <span className="block text-sm text-ink-muted">{b.numbers.length} cantiques · Choisissez une langue pour parcourir le livre</span>
                </span>
                <Chip tone="lavender" className="absolute right-4 top-3">{b.label}</Chip>
                <span className="mt-5 hidden shrink-0 items-center rounded-full bg-surface-sunken px-4 py-2 text-sm font-semibold transition group-hover:bg-brand-600 group-hover:text-white sm:inline-flex">Ouvrir ›</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────── Niveaux 2 & 3 : plages et numéros ───────────── */

function NumberGrid({ book, numbers }: { book: string; numbers: number[] }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
      {numbers.map((n) => (
        <Link key={n} to={`/cantiques/${book}/${n}`} className="flex aspect-square items-center justify-center rounded-xl border border-line bg-surface-sunken/70 sm:aspect-auto sm:h-14 text-[15px] font-bold text-ink transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-600 hover:text-white">
          {n}
        </Link>
      ))}
    </div>
  );
}

function CantiquesBookPage({ book, openRange, cat }: { book: string; openRange?: string; cat: Catalog }) {
  const navigate = useNavigate();
  const { books } = cat;
  const all = useMemo(() => books.find((b) => b.id === book)?.numbers ?? [], [books, book]);
  const ranges = useMemo(() => rangesOf(all), [all]);
  const [query, setQuery] = useState('');
  const [grid, setGrid] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set(openRange ? [openRange] : []));
  const bookLabel = labelOf(books, book);

  useEffect(() => {
    if (openRange) {
      setOpen((p) => new Set(p).add(openRange));
      window.setTimeout(() => document.getElementById(`plage-${openRange}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
    }
  }, [openRange]);

  const q = normalize(query.trim());
  const filtered = q ? all.filter((n) => String(n).startsWith(q) || normalize(cat.title(book, n)).includes(q) || normalize(cat.get(book, n)?.tone ?? '').includes(q)) : null;
  const toggle = (id: string) => setOpen((p) => {
    const next = new Set(p);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div>
      <SectionHeader
        title={`Cantiques (${bookLabel})`}
        subtitle={`${all.length} cantiques`}
        actions={
          <>
            <IconButton icon={grid ? List : LayoutGrid} label={grid ? 'Vue par plages' : 'Vue grille'} shape="square" onClick={() => setGrid((g) => !g)} />
            <IconButton icon={Settings} label="Paramètres" shape="square" to="/profil/parametres" />
          </>
        }
      />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher par titre, numéro, tonalité" />
      <div className="mt-3 flex gap-2">
        <button onClick={() => setLangOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:border-brand-300"><Languages size={16} /> {bookLabel}</button>
        <button onClick={() => setGrid((g) => !g)} className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold', grid ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface hover:border-brand-300')}><Rows3 size={16} /> Vue grille</button>
      </div>

      <div className="mt-4">
        {filtered ? (
          filtered.length === 0 ? (
            <div className="card rounded-2xl"><EmptyState icon={Music} title="Aucun cantique ne correspond à votre recherche" /></div>
          ) : (
            <div className="card rounded-2xl p-2">
              {filtered.slice(0, 60).map((n) => (
                <Link key={n} to={`/cantiques/${book}/${n}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-sunken">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-sm font-bold text-brand-700">{n}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{cat.title(book, n)}</span>
                  <span className="text-xs text-ink-muted">{cat.get(book, n)?.tone}</span>
                </Link>
              ))}
            </div>
          )
        ) : grid ? (
          <div className="card rounded-2xl p-4"><NumberGrid book={book} numbers={all} /></div>
        ) : (
          <div className="space-y-2.5">
            {ranges.map((r) => {
              const isOpen = open.has(r.id);
              return (
                <div key={r.id} id={`plage-${r.id}`} className="card scroll-mt-24 overflow-hidden rounded-2xl">
                  <button onClick={() => toggle(r.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className="rounded-full border border-brand-200 bg-mint-100 px-3.5 py-1.5 text-[15px] font-bold text-brand-900">{r.from}-{r.to}</span>
                    <span className="flex-1 text-[15px] text-ink-muted">{r.numbers.length} cantiques</span>
                    <ChevronDown size={20} className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && <div className="animate-fade-in border-t border-line px-4 pb-4 pt-3"><NumberGrid book={book} numbers={r.numbers} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={() => setLangOpen(true)} className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-sm font-black text-white shadow-glow md:bottom-8 md:right-8" aria-label="Changer de langue">
        {books.find((b) => b.id === book)?.short}
      </button>
      <LanguageSheet books={books} open={langOpen} onClose={() => setLangOpen(false)} current={book} onPick={(id) => navigate(`/cantiques/${id}`)} />
    </div>
  );
}

/* ───────────── Niveau 4 : détail ───────────── */

function ScoreModal({ open, onClose, title, url }: { open: boolean; onClose: () => void; title: string; url?: string }) {
  const notes = [0, 3, 2, 5, 4, 2, 1, 3, 6, 4, 2, 0, 3, 5, 4, 1];
  if (url) {
    return (
      <Modal open={open} onClose={onClose} title="Partition" description={title} size="lg" footer={<Button icon={Download} onClick={() => window.open(url, '_blank', 'noopener')}>Ouvrir / télécharger</Button>}>
        {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) ? <img src={url} alt={`Partition — ${title}`} className="w-full rounded-xl bg-white" /> : <iframe src={url} title={`Partition — ${title}`} className="h-[70vh] w-full rounded-xl bg-white" />}
      </Modal>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="Partition" description={`${title} — aperçu de démonstration`} size="lg" footer={<Button icon={Download} onClick={() => { onClose(); toast('Partition téléchargée (démo)'); }}>Télécharger le PDF</Button>}>
      <div className="space-y-6 rounded-2xl bg-white p-5">
        {[0, 1].map((row) => (
          <svg key={row} viewBox="0 0 640 90" className="w-full">
            {[0, 1, 2, 3, 4].map((l) => <line key={l} x1="0" x2="640" y1={20 + l * 12} y2={20 + l * 12} stroke="#94a3b8" strokeWidth="1" />)}
            <text x="6" y="64" fontSize="54" fill="#0f1b2d">𝄞</text>
            {notes.map((n, i) => (
              <g key={i}>
                <ellipse cx={70 + i * 35} cy={68 - ((n + row) % 7) * 6} rx="6.5" ry="5" fill="#0f1b2d" transform={`rotate(-20 ${70 + i * 35} ${68 - ((n + row) % 7) * 6})`} />
                <line x1={76 + i * 35} x2={76 + i * 35} y1={68 - ((n + row) % 7) * 6} y2={36 - ((n + row) % 7) * 6} stroke="#0f1b2d" strokeWidth="1.5" />
              </g>
            ))}
            {[4, 8, 12].map((b) => <line key={b} x1={58 + b * 35} x2={58 + b * 35} y1="20" y2="68" stroke="#0f1b2d" strokeWidth="1" />)}
          </svg>
        ))}
      </div>
    </Modal>
  );
}

function CantiqueDetailPage({ book, number, cat }: { book: string; number: number; cat: Catalog }) {
  const navigate = useNavigate();
  const { books } = cat;
  const hymn = cat.get(book, number);
  const key = `${book}-${number}`;
  const bookLabel = labelOf(books, book);
  const [lyricsTried, setLyricsTried] = useState<string | null>(null);
  const fav = useLibrary((s) => s.hymnFavorites.includes(key));
  const fontSize = useLibrary((s) => s.hymnFontSize);
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const [langOpen, setLangOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const nums = books.find((b) => b.id === book)?.numbers ?? [];
  const idx = nums.indexOf(number);
  const prev = nums[idx - 1];
  const next = nums[idx + 1];

  const found = !!hymn;
  useEffect(() => {
    if (found) library.openHymn(key);
    window.scrollTo({ top: 0 });
  }, [key, found]);

  // Paroles absentes de la liste : chargement du cantique seul.
  useEffect(() => {
    if (!hymn || hymn.demo || hymn.blocks.length) return;
    void ensureLyrics(hymn).finally(() => setLyricsTried(key));
  }, [hymn, key]);

  if (!hymn) {
    return (
      <div className="card rounded-2xl">
        <EmptyState icon={Music} title={`Le cantique n° ${number} n'existe pas en ${bookLabel}`} action={<Button to={`/cantiques/${book}`}>Voir les cantiques en {bookLabel}</Button>} />
      </div>
    );
  }

  const isCurrent = track?.id === key;
  const playAudio = () => {
    if (!hymn.hasAudio) return toast('Aucun enregistrement audio pour ce cantique', { tone: 'danger' });
    if (isCurrent) return player.toggle();
    player.play({ id: key, title: `${hymn.number}. ${hymn.title}`, subtitle: `Cantiques en ${hymn.bookLabel}`, to: `/cantiques/${book}/${number}`, duration: 150 + (number % 90), src: hymn.audioUrl });
  };

  return (
    <div className="pb-16">
      <div className="mb-4 flex items-center gap-2">
        <IconButton icon={ChevronLeft} label="Retour à la liste" shape="square" onClick={() => navigate(`/cantiques/${book}`)} />
        <div className="flex-1 text-center"><LogoMark className="mx-auto h-11 w-11" /></div>
        <IconButton icon={Globe} label="Changer de langue" shape="square" onClick={() => setLangOpen(true)} />
        <IconButton icon={ChevronUp} label="Remonter" shape="square" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </div>

      <div className="card flex items-start gap-4 rounded-3xl p-5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-black text-brand-600">#{hymn.number}</p>
          <h1 className="text-[26px] font-black leading-tight">{hymn.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {hymn.tone && <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm"><Music size={14} className="text-brand-600" /> Tonalité : {hymn.tone}</span>}
            <button onClick={() => setLangOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-semibold uppercase hover:bg-line"><Languages size={14} /> {hymn.bookLabel}</button>
          </div>
        </div>
        <button onClick={playAudio} className="flex flex-col items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <span className={cn('flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md transition hover:scale-105', hymn.hasAudio ? 'bg-brand-500' : 'bg-ink-faint')}>
            {isCurrent && playing ? <Pause size={26} className="fill-white" /> : <Play size={26} className="ml-1 fill-white" />}
          </span>
          Audio
        </button>
      </div>

      <div className="my-4 flex flex-wrap gap-2">
        <Button variant="ghost" icon={Copy} onClick={async () => toast((await copyText(hymnText(hymn))) ? 'Paroles copiées' : 'Copie impossible')}>Copier</Button>
        <Button variant="ghost" icon={Share2} onClick={() => openShare({ title: `Cantique n° ${hymn.number} — ${hymn.title}`, url: `/cantiques/${book}/${number}` })}>Partager</Button>
        <Button variant="ghost" icon={Music2} disabled={!hymn.hasScore} onClick={() => setScoreOpen(true)}>Partition</Button>
        <Button variant={fav ? 'soft' : 'ghost'} icon={Star} onClick={() => toast(library.toggleHymnFavorite(key) ? 'Ajouté aux favoris' : 'Retiré des favoris')}>{fav ? 'Favori' : 'Favoris'}</Button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={AArrowDown} label="Réduire le texte" size="sm" onClick={() => library.setHymnFontSize(fontSize - 1)} />
          <IconButton icon={AArrowUp} label="Agrandir le texte" size="sm" onClick={() => library.setHymnFontSize(fontSize + 1)} />
        </div>
      </div>

      <article className="card rounded-3xl px-6 py-7 sm:px-10" style={{ fontSize }}>
        {hymn.demo && <p className="mb-5 rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">Paroles de démonstration — elles seront remplacées par le recueil officiel.</p>}
        {hymn.blocks.length === 0 && (
          <p className="py-6 text-center text-[15px] text-ink-muted">{lyricsTried === key ? 'Les paroles de ce cantique ne sont pas encore disponibles.' : 'Chargement des paroles…'}</p>
        )}
        {hymn.blocks.map((b, i) =>
          b.refrain ? (
            <div key={i} className="-mt-3 mb-6 border-l-4 border-brand-300 pl-4 italic text-ink-soft">
              {!hymn.demo && <p className="mb-1 text-xs font-bold uppercase not-italic tracking-wide text-brand-600">Refrain</p>}
              {b.lines.map((l, j) => <p key={j} className="leading-[1.75]">{l}</p>)}
            </div>
          ) : (
            <div key={i} className="mb-6">
              {b.label && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-600">{b.label}</p>}
              {b.lines.map((l, j) => <p key={j} className="leading-[1.75] text-ink">{l}</p>)}
            </div>
          ),
        )}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <Button variant="ghost" icon={SkipBack} disabled={!prev} onClick={() => navigate(`/cantiques/${book}/${prev}`)}>{prev ? `n° ${prev}` : 'Début'}</Button>
          <Link to={`/cantiques/${book}`} className="text-sm font-semibold text-brand-700 hover:underline">Tous les cantiques</Link>
          <Button variant="ghost" iconRight={SkipForward} disabled={!next} onClick={() => navigate(`/cantiques/${book}/${next}`)}>{next ? `n° ${next}` : 'Fin'}</Button>
        </div>
      </article>

      <LanguageSheet
        books={books}
        open={langOpen}
        onClose={() => setLangOpen(false)}
        current={book}
        number={number}
        onPick={(id) => {
          if (hasNumber(books, id, number)) navigate(`/cantiques/${id}/${number}`);
          else {
            toast(`Le n° ${number} n'existe pas en ${labelOf(books, id)}`);
            navigate(`/cantiques/${id}`);
          }
        }}
      />
      <ScoreModal open={scoreOpen} onClose={() => setScoreOpen(false)} title={hymn.title} url={hymn.scoreUrl} />
    </div>
  );
}

/** /cantiques/:langue et /cantiques/:langue/:item (item = numéro ou plage « 1-42 »). */
export function CantiquesBookRoute() {
  const { langue = '', item } = useParams();
  const cat = useHymnCatalog();
  const loading = hymnStore.use((s) => s.status === 'loading' || s.status === 'idle');
  if (!cat.books.some((b) => b.id === langue)) {
    if (cat.remote && loading) return <div className="card rounded-2xl"><EmptyState icon={Music} title="Chargement du recueil…" /></div>;
    return <div className="card rounded-2xl"><EmptyState icon={Music} title="Ce recueil n'existe pas" action={<Button to="/cantiques">Voir les recueils</Button>} /></div>;
  }
  if (item && /^\d+$/.test(item)) return <CantiqueDetailPage book={langue} number={Number(item)} cat={cat} />;
  return <CantiquesBookPage book={langue} openRange={item && /^\d+-\d+$/.test(item) ? item : undefined} cat={cat} />;
}
