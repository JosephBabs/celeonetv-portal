import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AArrowDown, AArrowUp, BookOpen, ChevronDown, ChevronRight, ChevronUp, Download, ExternalLink, FileText, Folder, List, Printer, RotateCw, ScrollText, Search, Share2,
  SlidersHorizontal, Star,
} from 'lucide-react';
import { docText, ensureDocumentContent, ensureDocuments, useDocuments, type DocView } from '@/services/documents';
import { library, useLibrary } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { SearchField, SectionHeader } from '@/components/SectionHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { cn, formatDate, normalize } from '@/lib/utils';

const docIcon = { file: FileText, list: List, book: BookOpen, scroll: ScrollText };

function DocCard({ d }: { d: DocView }) {
  const fav = useLibrary((s) => s.docFavorites.includes(d.id));
  const Icon = docIcon[d.icon];
  return (
    <Link to={`/documents/${d.id}`} className="card card-hover group flex items-center gap-4 rounded-2xl p-4">
      <span className="icon-tile h-14 w-14 shrink-0 rounded-2xl border border-brand-200/60">
        <Icon size={24} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[16px] font-bold leading-snug text-ink">{d.title}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip icon={Folder}>{d.category}</Chip>
          {d.subcategory && <span className="text-xs text-ink-muted">{d.subcategory}</span>}
          {d.fileUrl && !d.sections.length && <span className="text-xs font-semibold text-brand-700">PDF</span>}
          {fav && <Star size={13} className="fill-gold-500 text-gold-500" aria-label="Favori" />}
        </span>
        {d.reference && <span className="mt-1 block truncate text-[13px] text-ink-muted">{d.reference}</span>}
      </span>
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-4 py-2 text-sm font-semibold text-ink-soft transition group-hover:bg-brand-600 group-hover:text-white sm:inline-flex">
        Ouvrir <ChevronRight size={16} />
      </span>
    </Link>
  );
}

export function DocumentsPage() {
  const favorites = useLibrary((s) => s.docFavorites);
  const recent = useLibrary((s) => s.docRecent);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('Tous');
  const [sub, setSub] = useState<string>('Tous');
  const [onlyFav, setOnlyFav] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const lib = useDocuments();
  const { docs, categories } = lib;
  const loading = lib.remote ? lib.status !== 'ready' && lib.status !== 'error' && docs.length === 0 : false;

  const subs = useMemo(() => ['Tous', ...new Set(docs.filter((d) => (category === 'Tous' || d.category === category) && d.subcategory).map((d) => d.subcategory))], [category, docs]);
  // Texte de recherche calculé une fois par document.
  const haystack = useMemo(() => new Map(docs.map((d) => [d.id, normalize(`${d.title} ${d.reference} ${d.subcategory} ${docText(d)}`)])), [docs]);
  const visible = docs.filter((d) => {
    const q = normalize(query);
    return (!q || (haystack.get(d.id) ?? '').includes(q)) && (category === 'Tous' || d.category === category) && (sub === 'Tous' || d.subcategory === sub) && (!onlyFav || favorites.includes(d.id));
  });
  const recentDocs = recent.map((id) => lib.get(id)).filter((d): d is DocView => !!d).slice(0, 3);
  const activeFilters = Number(category !== 'Tous') + Number(sub !== 'Tous') + Number(onlyFav);

  return (
    <div>
      <SectionHeader title="Documents" subtitle={loading ? 'Chargement…' : `${visible.length}/${docs.length} documents`} />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher des documents…" />
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => setFiltersOpen(true)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-brand-200 bg-mint-100 px-4 text-sm font-semibold text-brand-800 hover:bg-mint-200">
          <SlidersHorizontal size={16} /> Filtres {activeFilters > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeFilters}</span>}
        </button>
        {['Tous', ...categories].map((c) => (
          <button key={c} onClick={() => { setCategory(c); setSub('Tous'); }} className={cn('h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition', category === c ? 'bg-brand-700 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>
            {c}
          </button>
        ))}
        <button onClick={() => setOnlyFav((v) => !v)} aria-pressed={onlyFav} className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition', onlyFav ? 'bg-gold-500 text-night' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>
          <Star size={15} /> Favoris
        </button>
      </div>

      {recentDocs.length > 0 && !query && category === 'Tous' && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Ouverts récemment</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {recentDocs.map((d) => (
              <Link key={d.id} to={`/documents/${d.id}`} className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold hover:border-brand-300">{d.title}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[104px] rounded-2xl" />)
        ) : lib.remote && lib.status === 'error' && docs.length === 0 ? (
          <div className="card rounded-2xl lg:col-span-2">
            <EmptyState icon={FileText} title="Documents indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void ensureDocuments()}>Réessayer</Button>} />
          </div>
        ) : visible.length === 0 ? (
          <div className="card rounded-2xl lg:col-span-2">
            <EmptyState icon={FileText} title={query ? 'Aucun document ne correspond à votre recherche' : 'Aucun document disponible pour le moment'} action={activeFilters ? <Button variant="ghost" onClick={() => { setCategory('Tous'); setSub('Tous'); setOnlyFav(false); }}>Réinitialiser les filtres</Button> : undefined} />
          </div>
        ) : (
          visible.map((d) => <DocCard key={d.id} d={d} />)
        )}
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtres" size="sm" footer={<><Button variant="ghost" onClick={() => { setCategory('Tous'); setSub('Tous'); setOnlyFav(false); }}>Réinitialiser</Button><Button onClick={() => setFiltersOpen(false)}>Voir {visible.length} résultat{visible.length > 1 ? 's' : ''}</Button></>}>
        <p className="mb-2 text-sm font-semibold">Catégorie</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {['Tous', ...categories].map((c) => (
            <button key={c} onClick={() => { setCategory(c); setSub('Tous'); }} className={cn('h-9 rounded-full border px-3.5 text-sm font-semibold', category === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{c}</button>
          ))}
        </div>
        <p className="mb-2 text-sm font-semibold">Sous-catégorie</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {subs.map((c) => (
            <button key={c} onClick={() => setSub(c)} className={cn('h-9 rounded-full border px-3.5 text-sm font-semibold', sub === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{c}</button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Uniquement mes favoris
        </label>
      </Modal>
    </div>
  );
}

function Highlight({ text, query, matchStart }: { text: string; query: string; matchStart: { current: number } }) {
  if (!query) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const nt = normalize(text);
  const nq = normalize(query);
  let i = 0;
  let found = nt.indexOf(nq);
  while (found >= 0) {
    parts.push(text.slice(i, found));
    const idx = matchStart.current++;
    parts.push(<mark key={found} data-match={idx} className="rounded bg-gold-100 px-0.5 text-ink">{text.slice(found, found + query.length)}</mark>);
    i = found + query.length;
    found = nt.indexOf(nq, i);
  }
  parts.push(text.slice(i));
  return <>{parts}</>;
}

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const lib = useDocuments();
  const doc = lib.get(documentId ?? '');
  const [contentTried, setContentTried] = useState<string | null>(null);
  const fontSize = useLibrary((s) => s.docFontSize);
  const fav = useLibrary((s) => (doc ? s.docFavorites.includes(doc.id) : false));
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const docId = doc?.id;
  useEffect(() => {
    if (docId) library.openDoc(docId);
  }, [docId]);

  // Texte absent de la liste : chargement du document seul.
  useEffect(() => {
    if (!doc || doc.demo || doc.sections.length) return;
    void ensureDocumentContent(doc).finally(() => setContentTried(doc.id));
  }, [doc]);

  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(document.querySelectorAll('mark[data-match]').length);
  });
  useEffect(() => {
    setCurrent(0);
  }, [query]);
  useEffect(() => {
    document.querySelectorAll('mark[data-match]').forEach((m) => m.classList.remove('!bg-gold-500'));
    const el = document.querySelector(`mark[data-match="${current}"]`);
    el?.classList.add('!bg-gold-500');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [current, query, total]);

  if (!doc && lib.remote && lib.status !== 'ready' && lib.status !== 'error') {
    return <div className="card rounded-2xl"><EmptyState icon={FileText} title="Chargement du document…" /></div>;
  }
  if (!doc) {
    return (
      <div className="card rounded-2xl">
        <EmptyState icon={FileText} title="Document introuvable" action={<Button to="/documents">Retour aux documents</Button>} />
      </div>
    );
  }

  const download = () => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener');
      return;
    }
    const blob = new Blob([docText(doc)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Document téléchargé');
  };

  const counter = { current: 0 };
  const q = query.trim();

  return (
    <div className="pb-10">
      <SectionHeader
        back="/documents"
        title={doc.title}
        subtitle={[doc.subcategory, doc.category].filter(Boolean).join(' · ')}
        actions={<IconButton icon={Search} label="Rechercher dans le document" shape="square" active={searchOpen} onClick={() => setSearchOpen((v) => !v)} />}
      />
      {searchOpen && (
        <div className="mb-3 flex items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Rechercher dans le document…" autoFocus className="h-12 flex-1" />
          {q && (
            <div className="flex items-center gap-1 text-sm text-ink-muted">
              <span className="tabular-nums">{total ? current + 1 : 0}/{total}</span>
              <IconButton icon={ChevronUp} label="Résultat précédent" size="sm" disabled={!total} onClick={() => setCurrent((c) => (c - 1 + total) % total)} />
              <IconButton icon={ChevronDown} label="Résultat suivant" size="sm" disabled={!total} onClick={() => setCurrent((c) => (c + 1) % total)} />
            </div>
          )}
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={fav ? 'soft' : 'ghost'} icon={Star} onClick={() => toast(library.toggleDocFavorite(doc.id) ? 'Ajouté à vos favoris' : 'Retiré de vos favoris')}>
          {fav ? 'Favori' : 'Ajouter aux favoris'}
        </Button>
        <Button size="sm" variant="ghost" icon={Share2} onClick={() => openShare({ title: doc.title, url: `/documents/${doc.id}` })}>Partager</Button>
        <Button size="sm" variant="ghost" icon={Download} onClick={download}>Télécharger</Button>
        <Button size="sm" variant="ghost" icon={Printer} className="hidden sm:inline-flex" onClick={() => window.print()}>Imprimer</Button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={AArrowDown} label="Réduire le texte" size="sm" onClick={() => library.setDocFontSize(fontSize - 1)} />
          <IconButton icon={AArrowUp} label="Agrandir le texte" size="sm" onClick={() => library.setDocFontSize(fontSize + 1)} />
        </div>
      </div>

      <article className="card rounded-3xl px-6 py-7 sm:px-10 sm:py-9" style={{ fontSize }}>
        <p className="mb-6 text-xs text-ink-muted">
          {[doc.updatedAt && `Mis à jour le ${formatDate(doc.updatedAt)}`, doc.pages > 0 && `${doc.pages} pages`, doc.reference].filter(Boolean).join(' · ')}
        </p>
        {doc.sections.length === 0 && doc.fileUrl && (
          <div className="space-y-3">
            {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(doc.fileUrl) ? <img src={doc.fileUrl} alt={doc.title} className="w-full rounded-xl" /> : <iframe src={doc.fileUrl} title={doc.title} className="h-[75vh] w-full rounded-xl border border-line bg-white" />}
            <Button variant="soft" icon={ExternalLink} onClick={() => window.open(doc.fileUrl, '_blank', 'noopener')}>Ouvrir le fichier</Button>
          </div>
        )}
        {doc.sections.length === 0 && !doc.fileUrl && (
          <p className="py-6 text-center text-[15px] text-ink-muted">{doc.demo || contentTried === doc.id ? 'Le contenu de ce document n’est pas encore disponible.' : 'Chargement du contenu…'}</p>
        )}
        {doc.sections.map((s, i) => (
          <Fragment key={i}>
            {s.heading && <h2 className="mb-3 mt-6 font-display text-[1.25em] font-black uppercase leading-snug text-ink first:mt-0"><Highlight text={s.heading} query={q} matchStart={counter} /></h2>}
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="mb-4 leading-relaxed text-ink-soft"><Highlight text={p} query={q} matchStart={counter} /></p>
            ))}
            {s.list && (
              <ol className="mb-4 list-decimal space-y-2 pl-7 leading-relaxed text-ink">
                {s.list.map((l, j) => (
                  <li key={j} className="pl-1"><Highlight text={l} query={q} matchStart={counter} /></li>
                ))}
              </ol>
            )}
          </Fragment>
        ))}
      </article>
    </div>
  );
}
