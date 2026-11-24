import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Clock, FileText, LayoutGrid, Search, Users, X } from 'lucide-react';
import { members } from '@/data/members';
import { menuGroups } from '@/data/navigation';
import { actions, appStore, useApp } from '@/store/app';
import { ui, useUi } from '@/store/ui';
import { MemberAvatar } from '@/components/ui/Avatar';
import { useEscape } from '@/components/ui/Overlay';
import { cn, normalize } from '@/lib/utils';

type ResultType = 'membres' | 'publications' | 'pages';
interface Result {
  key: string;
  type: ResultType;
  title: string;
  subtitle: string;
  to: string;
  memberId?: string;
}

const filters: { id: ResultType | 'tout'; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'membres', label: 'Membres' },
  { id: 'publications', label: 'Publications' },
  { id: 'pages', label: 'Pages & outils' },
];

const pages = [
  { title: 'Accueil', to: '/accueil' },
  { title: 'Social', to: '/social' },
  { title: 'Documents', to: '/documents' },
  { title: 'Cantiques', to: '/cantiques' },
  { title: 'Jeunesse', to: '/jeunesse' },
  { title: 'Bible complète', to: '/bible' },
  { title: 'Discussions', to: '/discussions' },
  { title: 'Notifications', to: '/notifications' },
  { title: 'Agenda', to: '/agenda' },
  { title: 'Événements', to: '/evenements' },
  { title: 'Radio', to: '/radio' },
  { title: 'Streaming', to: '/streaming' },
  { title: 'Carte des paroisses', to: '/carte-paroisses' },
];

function search(query: string): Result[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const posts = appStore.get().officialPosts;
  const out: Result[] = [];
  members
    .filter((m) => !m.official && m.id !== 'me' && normalize(`${m.name} ${m.parish}`).includes(q))
    .forEach((m) => out.push({ key: `m-${m.id}`, type: 'membres', title: m.name, subtitle: m.parish, to: `/social/profil/${m.id}`, memberId: m.id }));
  posts
    .filter((p) => normalize(`${p.title ?? ''} ${p.body} ${p.tag}`).includes(q))
    .forEach((p) => out.push({ key: `p-${p.id}`, type: 'publications', title: p.title ?? p.body.slice(0, 60), subtitle: `${p.tag} · Admin Cèlè One`, to: `/accueil?publication=${p.id}` }));
  pages
    .filter((p) => normalize(p.title).includes(q))
    .forEach((p) => out.push({ key: `pg-${p.to}`, type: 'pages', title: p.title, subtitle: 'Page', to: p.to }));
  menuGroups.forEach((g) =>
    g.items
      .filter((i) => normalize(`${i.label} ${g.label}`).includes(q))
      .forEach((i) => out.push({ key: `i-${g.id}-${i.id}`, type: 'pages', title: i.label, subtitle: g.label, to: i.to })),
  );
  return out;
}

function SearchPanel({ query, setQuery, onClose }: { query: string; setQuery: (q: string) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const recent = useApp((s) => s.recentSearches);
  const [filter, setFilter] = useState<ResultType | 'tout'>('tout');
  const results = useMemo(() => search(query), [query]);
  const visible = filter === 'tout' ? results : results.filter((r) => r.type === filter);

  const go = (r: Result) => {
    actions.pushRecentSearch(query || r.title);
    onClose();
    navigate(r.to);
  };

  if (!query.trim()) {
    return (
      <div className="p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-sm font-extrabold">Recherches récentes</p>
          {recent.length > 0 && (
            <button onClick={actions.clearRecentSearches} className="text-xs font-semibold text-brand-700 hover:underline">
              Effacer
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-ink-muted">Aucune recherche récente</p>
        ) : (
          recent.map((r) => (
            <button key={r} onClick={() => setQuery(r)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-sunken">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
                <Clock size={15} />
              </span>
              <span className="flex-1 truncate">{r}</span>
            </button>
          ))
        )}
        <p className="mt-2 border-t border-line px-2 pt-3 text-xs text-ink-muted">Essayez « cantique », « Grâce », « programme » ou « paroisse ».</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
        {filters.map((f) => {
          const count = f.id === 'tout' ? results.length : results.filter((r) => r.type === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition', filter === f.id ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}
            >
              {f.label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-ink-muted">Aucun résultat pour « {query} »</p>
      ) : (
        <ul className="max-h-[60vh] overflow-y-auto">
          {visible.slice(0, 12).map((r) => (
            <li key={r.key}>
              <button onClick={() => go(r)} className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-sunken">
                {r.memberId ? (
                  <MemberAvatar memberId={r.memberId} size="sm" />
                ) : (
                  <span className="icon-tile h-9 w-9 rounded-full">{r.type === 'publications' ? <FileText size={16} /> : <LayoutGrid size={16} />}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.title}</span>
                  <span className="block truncate text-xs text-ink-muted">{r.subtitle}</span>
                </span>
                <ArrowUpRight size={15} className="text-ink-faint opacity-0 transition group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Barre de recherche globale du header (desktop) — panneau de résultats ancré. */
export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEscape(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={root} className={cn('relative', className)}>
      <label className="flex h-10 items-center gap-2.5 rounded-full bg-surface-sunken px-4 text-ink-muted transition focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand-500/30">
        <Search size={17} />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => e.key === 'Enter' && actions.pushRecentSearch(query)}
          placeholder="Rechercher publications, membres, pages…"
          aria-label="Recherche globale"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {query && (
          <button aria-label="Effacer la recherche" onClick={() => setQuery('')} className="rounded-full p-0.5 hover:text-ink">
            <X size={15} />
          </button>
        )}
      </label>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 min-w-[340px] animate-pop-in rounded-xl border border-line bg-surface shadow-lg">
          <SearchPanel query={query} setQuery={setQuery} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/** Recherche plein écran (mobile / tablette). */
export function MobileSearch() {
  const open = useUi((s) => s.searchOpen);
  const [query, setQuery] = useState('');
  const close = () => {
    ui.setSearchOpen(false);
    setQuery('');
  };
  useEscape(open, close);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65] flex animate-fade-in flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3 py-3">
        <button aria-label="Retour" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken">
          <ArrowLeft size={19} />
        </button>
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-surface-sunken px-4">
          <Search size={16} className="text-ink-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && actions.pushRecentSearch(query)}
            placeholder="Rechercher sur Cèlè One"
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SearchPanel query={query} setQuery={setQuery} onClose={close} />
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-ink-muted">
        <Users size={14} /> Membres, publications, pages et outils du menu
      </div>
    </div>
  );
}
