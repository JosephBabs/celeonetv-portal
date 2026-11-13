import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookmark, BookOpen, ChevronLeft, ChevronRight, Copy, Languages, Share2, X } from 'lucide-react';
import { bibleBooks, bibleLanguages, getBook, getChapter, nextChapter, prevChapter, type BibleLang } from '@/data/bible';
import { library, useLibrary } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { SearchField, SectionHeader } from '@/components/SectionHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { cn, copyText, normalize } from '@/lib/utils';

function LangFab() {
  const lang = useLibrary((s) => s.bibleLang);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Changer la langue de la Bible" className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-sm font-black text-white shadow-glow md:bottom-8 md:right-8 xl:right-[calc(max(0px,(100vw-1600px)/2)+344px)]">
        {bibleLanguages.find((l) => l.id === lang)?.short}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Langue de la Bible" size="sm">
        <div className="space-y-1.5">
          {bibleLanguages.map((l) => (
            <button key={l.id} onClick={() => { library.setBibleLang(l.id); setOpen(false); toast(`Bible en ${l.label}`); }} className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold', lang === l.id ? 'bg-mint-100 text-brand-900' : 'hover:bg-surface-sunken')}>
              {l.label} <span className="text-xs text-ink-muted">{l.short}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-3 flex flex-wrap items-center gap-1 text-[13px] text-ink-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} />}
          {it.to ? <Link to={it.to} className="hover:text-brand-700 hover:underline">{it.label}</Link> : <span className="font-semibold text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ───────────── Niveau 1 : livres ───────────── */

export function BibleHomePage() {
  const lang = useLibrary((s) => s.bibleLang);
  const recent = useLibrary((s) => s.bibleRecent);
  const bookmarks = useLibrary((s) => s.bibleBookmarks);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'tout' | 'ancien' | 'nouveau'>('tout');
  const books = bibleBooks.filter((b) => (filter === 'tout' || b.testament === filter) && normalize(b.name).includes(normalize(query)));
  const recentRef = recent?.split('/');
  const recentBook = recentRef ? getBook(recentRef[0]) : null;

  return (
    <div className="pb-16">
      <SectionHeader title="Bible Center" subtitle={`Bible complète · ${bibleLanguages.find((l) => l.id === lang)?.label}`} />
      {recentBook && (
        <Link to={`/bible/${recentRef![0]}/${recentRef![1]}`} className="mb-4 flex items-center gap-4 rounded-3xl bg-[linear-gradient(120deg,#0a6b60,#14a394)] p-5 text-white shadow-md transition hover:shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><BookOpen size={22} /></span>
          <span className="flex-1">
            <span className="block text-xs text-white/75">Reprendre la lecture</span>
            <span className="block font-display text-xl font-black">{recentBook.name} {recentRef![1]}</span>
          </span>
          <ChevronRight />
        </Link>
      )}
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher un livre" />
      <div className="mt-3 flex gap-2">
        {([['tout', 'Tout'], ['ancien', 'Ancien Testament'], ['nouveau', 'Nouveau Testament']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={cn('h-10 rounded-full px-4 text-sm font-semibold transition', filter === id ? 'bg-brand-700 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>{label}</button>
        ))}
      </div>
      {bookmarks.length > 0 && !query && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted"><Bookmark size={13} /> Mes signets</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {bookmarks.map((b) => {
              const [slug, ch] = b.split('/');
              return <Link key={b} to={`/bible/${b}`} className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold hover:border-brand-300">{getBook(slug)?.name} {ch}</Link>;
            })}
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {books.length === 0 && <div className="card rounded-2xl sm:col-span-2 lg:col-span-3"><EmptyState icon={BookOpen} title="Aucun livre ne correspond" /></div>}
        {books.map((b) => (
          <Link key={b.slug} to={`/bible/${b.slug}`} className="card card-hover group flex items-center gap-3 rounded-2xl p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-sm font-black text-brand-700">{bibleBooks.indexOf(b) + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{b.name}</span>
              <span className="block text-xs text-ink-muted">{b.testament === 'ancien' ? 'Ancien' : 'Nouveau'} Testament · {b.chapters} chapitre{b.chapters > 1 ? 's' : ''}</span>
            </span>
            <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-semibold transition group-hover:bg-brand-600 group-hover:text-white">Ouvrir</span>
          </Link>
        ))}
      </div>
      <LangFab />
    </div>
  );
}

/* ───────────── Niveau 2 : chapitres ───────────── */

export function BibleBookPage() {
  const { livre = '' } = useParams();
  const book = getBook(livre);
  const bookmarks = useLibrary((s) => s.bibleBookmarks);
  if (!book) return <div className="card rounded-2xl"><EmptyState icon={BookOpen} title="Livre introuvable" action={<Button to="/bible">Retour à la Bible</Button>} /></div>;
  return (
    <div className="pb-16">
      <Breadcrumb items={[{ label: 'Bible Center', to: '/bible' }, { label: book.name }]} />
      <div className="mb-5 rounded-3xl bg-[linear-gradient(120deg,#0a6b60,#14a394)] p-6 text-white shadow-md">
        <p className="text-sm text-white/75">{book.testament === 'ancien' ? 'Ancien' : 'Nouveau'} Testament</p>
        <h1 className="font-display text-[34px] font-black leading-tight">{book.name}</h1>
        <p className="text-sm text-white/80">{book.chapters} chapitre{book.chapters > 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
          <Link key={c} to={`/bible/${book.slug}/${c}`} className={cn('relative flex aspect-square items-center justify-center rounded-xl border text-[15px] font-bold transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-600 hover:text-white', bookmarks.includes(`${book.slug}/${c}`) ? 'border-gold-500 bg-gold-50' : 'border-line bg-surface')}>
            {c}
          </Link>
        ))}
      </div>
      <LangFab />
    </div>
  );
}

/* ───────────── Niveau 3 : lecture ───────────── */

export function BibleChapterPage() {
  const { livre = '', chapitre = '1' } = useParams();
  const navigate = useNavigate();
  const lang = useLibrary((s) => s.bibleLang);
  const bookmarks = useLibrary((s) => s.bibleBookmarks);
  const book = getBook(livre);
  const chapter = Number(chapitre);
  const verses = useMemo(() => getChapter(livre, chapter, lang), [livre, chapter, lang]);
  const [selected, setSelected] = useState<number[]>([]);
  const ref = `${livre}/${chapter}`;
  const marked = bookmarks.includes(ref);
  const prev = prevChapter(livre, chapter);
  const next = nextChapter(livre, chapter);

  useEffect(() => {
    setSelected([]);
    if (book) library.setBibleRecent(ref);
    window.scrollTo({ top: 0 });
  }, [ref, book]);

  if (!book || !chapter || chapter > book.chapters) {
    return <div className="card rounded-2xl"><EmptyState icon={BookOpen} title="Chapitre introuvable" action={<Button to="/bible">Retour à la Bible</Button>} /></div>;
  }

  const selectionText = () => selected.sort((a, b) => a - b).map((v) => `${v}. ${verses?.[v - 1]}`).join('\n');
  const refLabel = `${book.name} ${chapter}${selected.length ? ` : ${selected.sort((a, b) => a - b).join(', ')}` : ''}`;
  const toggle = (v: number) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const go = (r: { slug: string; chapter: number } | null) => r && navigate(`/bible/${r.slug}/${r.chapter}`);

  return (
    <div className="pb-24">
      <Breadcrumb items={[{ label: 'Bible Center', to: '/bible' }, { label: book.name, to: `/bible/${book.slug}` }, { label: `Chapitre ${chapter}` }]} />
      <div className="card sticky top-[72px] z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <IconButton icon={ChevronLeft} label="Chapitre précédent" disabled={!prev} onClick={() => go(prev)} />
        <div className="min-w-[110px] flex-1 text-center">
          <p className="font-display text-lg font-black leading-tight">{book.name} {chapter}</p>
          <p className="text-xs text-ink-muted">{selected.length ? `${selected.length} sélection${selected.length > 1 ? 's' : ''}` : 'Touchez un numéro pour sélectionner'}</p>
        </div>
        <IconButton icon={ChevronRight} label="Chapitre suivant" disabled={!next} onClick={() => go(next)} />
        <div className="flex w-full justify-center gap-2 sm:w-auto">
          <Button size="sm" variant={marked ? 'soft' : 'ghost'} icon={Bookmark} onClick={() => toast(library.toggleBookmark(ref) ? 'Chapitre ajouté à vos signets' : 'Signet retiré')}>{marked ? 'Marqué' : 'Marquer'}</Button>
          <Button size="sm" variant="ghost" icon={Share2} onClick={() => openShare({ title: refLabel, url: `/bible/${ref}` })}>Partager</Button>
        </div>
      </div>

      {!verses ? (
        <div className="card rounded-3xl">
          <EmptyState
            icon={Languages}
            title={`Ce chapitre n'est pas encore disponible en ${bibleLanguages.find((l) => l.id === lang)?.label}`}
            text="Vous pouvez le lire dans une autre langue en attendant."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {bibleLanguages.filter((l) => l.id !== lang && getChapter(livre, chapter, l.id)).map((l) => (
                  <Button key={l.id} variant="soft" onClick={() => library.setBibleLang(l.id as BibleLang)}>Lire en {l.label}</Button>
                ))}
              </div>
            }
          />
        </div>
      ) : (
        <article className="card rounded-3xl px-5 py-6 sm:px-10 sm:py-8">
          <p className="mb-5 rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">Texte de démonstration — la traduction officielle sera intégrée ici.</p>
          <div className="space-y-1">
            {verses.map((v, i) => {
              const n = i + 1;
              const on = selected.includes(n);
              return (
                <p key={n} className={cn('group -mx-2 rounded-lg px-2 py-1 text-[18px] leading-[1.8] transition', on ? 'bg-gold-100/70' : 'hover:bg-surface-sunken/60')}>
                  <button onClick={() => toggle(n)} aria-pressed={on} aria-label={`Sélectionner le verset ${n}`} className={cn('mr-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full align-[2px] text-xs font-black transition', on ? 'bg-brand-600 text-white' : 'bg-mint-100 text-brand-700 hover:bg-brand-600 hover:text-white')}>
                    {n}
                  </button>
                  {v}
                  <button onClick={() => openShare({ title: `${book.name} ${chapter} : ${n} — ${v}`, url: `/bible/${ref}` })} aria-label={`Partager le verset ${n}`} className="ml-1.5 inline-flex rounded-full p-1 align-middle text-ink-faint opacity-0 transition hover:bg-mint-100 hover:text-brand-700 group-hover:opacity-100 [@media(hover:none)]:opacity-60">
                    <Share2 size={14} />
                  </button>
                </p>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
            <Button variant="ghost" icon={ChevronLeft} disabled={!prev} onClick={() => go(prev)}>{prev ? `${getBook(prev.slug)?.name} ${prev.chapter}` : 'Début'}</Button>
            <Button variant="ghost" iconRight={ChevronRight} disabled={!next} onClick={() => go(next)}>{next ? `${getBook(next.slug)?.name} ${next.chapter}` : 'Fin'}</Button>
          </div>
        </article>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-lg animate-slide-up items-center gap-2 rounded-2xl bg-night p-2.5 text-white shadow-lg md:bottom-6">
          <span className="flex-1 pl-2 text-sm font-semibold">{selected.length} verset{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</span>
          <IconButton icon={Copy} label="Copier la sélection" variant="glass" size="sm" onClick={async () => toast((await copyText(`${refLabel}\n${selectionText()}`)) ? 'Versets copiés' : 'Copie impossible')} />
          <IconButton icon={Share2} label="Partager la sélection" variant="glass" size="sm" onClick={() => openShare({ title: refLabel, url: `/bible/${ref}` })} />
          <IconButton icon={Bookmark} label="Marquer" variant="glass" size="sm" onClick={() => toast(library.toggleBookmark(ref) ? 'Ajouté à vos signets' : 'Signet retiré')} />
          <IconButton icon={X} label="Effacer la sélection" variant="glass" size="sm" onClick={() => setSelected([])} />
        </div>
      )}
      <LangFab />
    </div>
  );
}
