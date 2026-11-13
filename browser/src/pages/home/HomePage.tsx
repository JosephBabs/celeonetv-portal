import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ArrowUp, BookOpen, Building2, CalendarDays, ChevronDown, ChevronRight, CircleCheck, LayoutGrid, Library, Map,
  Megaphone, Newspaper, FileText, Radio,
} from 'lucide-react';
import { explorePromos, featuredParish, homeShortcuts } from '@/data/home';
import { useWeeklyTheme } from '@/services/weeklyTheme';
import type { Post, PostKind } from '@/data/types';
import { useApp } from '@/store/app';
import { ui } from '@/store/ui';
import { PostCard, PostDetailModal } from '@/components/feed/PostCard';
import { RemoteFeed } from '@/components/feed/RemoteFeed';
import { LiveRail } from '@/components/live/LiveRail';
import { QuickAccessGrid } from '@/layout/RightRail';
import { EmptyState, PostSkeleton } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/Button';
import { cn, normalize } from '@/lib/utils';

type TabId = 'actualites' | 'annonces' | 'reformes' | 'reactions' | 'agenda';

const tabs: { id: TabId; label: string; icon: typeof Newspaper; kinds?: PostKind[] }[] = [
  { id: 'actualites', label: 'Actualités', icon: Newspaper },
  { id: 'annonces', label: 'Annonces', icon: Megaphone, kinds: ['annonce'] },
  { id: 'reformes', label: 'Réformes', icon: FileText, kinds: ['reforme'] },
  { id: 'reactions', label: 'Réactions', icon: CircleCheck },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, kinds: ['agenda'] },
];

let feedLoaded = false;

function HomeTabs({ value, onChange }: { value: TabId; onChange: (t: TabId) => void }) {
  const [compact, setCompact] = useState(false);
  const [forceExpanded, setForceExpanded] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const c = window.scrollY > 220;
      setCompact(c);
      if (!c) setForceExpanded(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const isCompact = compact && !forceExpanded;

  return (
    <div className="sticky top-header z-30 -mx-3 bg-canvas/85 px-3 py-2.5 backdrop-blur-md sm:-mx-5 sm:px-5">
      <div className={cn('relative flex items-center gap-2 transition-all', isCompact && 'rounded-2xl border border-line/70 bg-surface p-1.5 shadow-sm')}>
        <div role="tablist" aria-label="Filtrer le fil" className={cn('flex flex-1 gap-2 overflow-x-auto scrollbar-none', isCompact && 'justify-between gap-1')}>
          {tabs.map((t) => {
            const active = value === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                title={t.label}
                onClick={() => {
                  onChange(t.id);
                  if (compact) window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition',
                  isCompact ? 'h-10 flex-1 rounded-xl' : 'h-11 px-4 text-[14.5px]',
                  active ? 'bg-brand-700 text-white shadow-sm' : isCompact ? 'text-brand-700 hover:bg-mint-100' : 'bg-mint-300/70 text-brand-900 hover:bg-mint-300',
                )}
              >
                <t.icon size={isCompact ? 20 : 18} strokeWidth={2} />
                {!isCompact && t.label}
                {isCompact && <span className="sr-only">{t.label}</span>}
              </button>
            );
          })}
        </div>
        {isCompact && <IconButton icon={ChevronDown} label="Afficher les libellés" variant="white" size="sm" className="absolute -bottom-4 right-2 shadow-md" onClick={() => setForceExpanded(true)} />}
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0 sm:h-[84px] sm:w-[84px]">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <BookOpen strokeWidth={1.7} className="absolute h-6 w-6 sm:h-7 sm:w-7 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
    </div>
  );
}

function WeeklyThemeCard() {
  const navigate = useNavigate();
  const { theme: weeklyTheme, loading } = useWeeklyTheme();
  const dayOfWeek = ((new Date().getDay() + 6) % 7) + 1;
  if (loading) return <div className="skeleton mb-4 h-[124px] rounded-3xl" aria-label="Chargement du thème de la semaine" />;
  if (!weeklyTheme) return null;
  return (
    <>
      <button onClick={() => navigate('/menu/calendrier/theme-semaine')} className="group relative mb-4 flex w-full items-center gap-3 overflow-hidden rounded-3xl sm:gap-4 bg-[linear-gradient(120deg,#0B565A,#1D8A8F_55%,#2FA5A9)] p-5 text-left text-white shadow-md transition hover:shadow-lg">
        <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[18px] border-white/[0.06]" />
        <span className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/[0.05]" />
        <ProgressRing value={dayOfWeek / 7} />
        <span className="min-w-0 flex-1">
          <span className="text-[13px] font-medium text-white/80">Thème de la semaine{weeklyTheme.week && <span className="hidden sm:inline"> · S{weeklyTheme.week}</span>}</span>
          <span className="mt-0.5 block font-display text-[22px] font-black leading-tight sm:text-[26px]">{weeklyTheme.title}</span>
          {weeklyTheme.readings.length > 0 && <span className="mt-1 hidden text-[12.5px] text-white/75 sm:block">{weeklyTheme.readings.map((r) => r.ref).join(' · ')}</span>}
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 sm:h-14 sm:w-14 shadow-md transition group-hover:translate-x-1">
          <ArrowRight size={24} />
        </span>
      </button>
    </>
  );
}

function ExploreCard({ promo }: { promo: (typeof explorePromos)[number] }) {
  return (
    <Link to={promo.to} className="group flex gap-4 rounded-2xl border border-gold-500/40 bg-gold-50 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-night">
        <Library size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gold-700">{promo.eyebrow}</span>
        <span className="mt-0.5 block font-display text-[17px] font-black uppercase leading-tight text-ink">{promo.title}</span>
        <span className="mt-1 block text-sm text-ink-soft">{promo.text}</span>
      </span>
      <ChevronRight size={20} className="mt-4 shrink-0 text-gold-700 transition group-hover:translate-x-1" />
    </Link>
  );
}

function ParishCard() {
  return (
    <div className="rounded-2xl border border-brand-200 bg-mint-100 p-4 shadow-xs">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Building2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{featuredParish.eyebrow}</p>
          <p className="font-display text-[17px] font-black uppercase leading-tight text-ink">{featuredParish.name}</p>
          <p className="mt-1 text-sm text-ink-soft">{featuredParish.address}</p>
        </div>
        <IconButton icon={Map} label="Voir sur la carte" variant="white" to={`/carte-paroisses?paroisse=${featuredParish.id}`} />
      </div>
      <Link to={`/carte-paroisses?paroisse=${featuredParish.id}`} className="mt-3 flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-brand-700 transition hover:bg-mint-50">
        <CalendarDays size={15} className="shrink-0" />
        <span className="truncate">{featuredParish.note}</span>
      </Link>
    </div>
  );
}

function ShortcutsBlock() {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface-sunken/60 p-3">
      <div className="grid grid-cols-2 gap-2">
        {homeShortcuts.map((s) => (
          <Link key={s.label} to={s.to} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-brand-300 hover:text-brand-800">
            <s.icon size={16} className="shrink-0 text-brand-600" />
            <span className="truncate">{s.label}</span>
          </Link>
        ))}
        <button onClick={() => ui.setMenuOpen(true)} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-brand-300 hover:text-brand-800">
          <LayoutGrid size={16} className="text-brand-600" /> Tout voir
        </button>
      </div>
    </div>
  );
}

function FloatingButtons() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3 md:bottom-8 md:right-6 xl:right-[calc(max(0px,(100vw-1600px)/2)+336px)]">
      <Link to="/radio" title="Écouter la radio" aria-label="Écouter la radio" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-brand-700 shadow-md transition hover:-translate-y-0.5">
        <Radio size={20} />
      </Link>
      {show && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Remonter en haut" className="flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition hover:bg-brand-700">
          <ArrowUp size={22} />
        </button>
      )}
    </div>
  );
}

export function HomePage() {
  const remote = useApp((s) => !!s.account?.remote);
  const posts = useApp((s) => s.officialPosts);
  const hidden = useApp((s) => s.hiddenPosts);
  const liked = useApp((s) => s.liked);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('actualites');
  const [loading, setLoading] = useState(!feedLoaded);

  useEffect(() => {
    if (feedLoaded) return;
    const t = window.setTimeout(() => {
      feedLoaded = true;
      setLoading(false);
    }, 650);
    return () => window.clearTimeout(t);
  }, []);

  const visible = useMemo(() => {
    const def = tabs.find((t) => t.id === tab)!;
    return posts.filter((p: Post) => {
      if (hidden.includes(p.id)) return false;
      if (tab === 'reactions') return liked[p.id] || p.comments.some((c) => c.authorId === 'me');
      return !def.kinds || def.kinds.includes(p.kind);
    });
  }, [posts, hidden, liked, tab]);

  const openPost = params.get('publication');
  const setOpenPost = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('publication', id);
    else next.delete('publication');
    setParams(next, { replace: !id });
  };

  const emptyText: Record<TabId, string> = {
    actualites: 'Aucune annonce pour le moment.',
    annonces: 'Aucune annonce pour le moment.',
    reformes: 'Aucune réforme publiée pour le moment.',
    reactions: "Les publications que vous aimez ou commentez apparaîtront ici.",
    agenda: 'Aucun programme publié pour le moment.',
  };

  return (
    <div>
      <HomeTabs value={tab} onChange={setTab} />
      <div className="mt-2">
        <LiveRail />
        <WeeklyThemeCard />
        <div className="mb-5 xl:hidden">
          <QuickAccessGrid columns={4} />
        </div>
        {tab === 'agenda' && (
          <Link to="/agenda" className="mb-4 flex items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-mint-50 p-4 text-sm font-semibold text-brand-800 hover:bg-mint-100">
            <CalendarDays size={18} /> Ouvrir mon agenda personnel et mes alertes
            <ChevronRight size={16} className="ml-auto" />
          </Link>
        )}
        {remote ? (
          <RemoteFeed
            source="accueil"
            onOpen={setOpenPost}
            emptyText={emptyText[tab]}
            filter={(p) => {
              const t = normalize(p.tag);
              if (tab === 'reactions') return !!p.likedByMe;
              if (tab === 'annonces') return t.includes('annonce');
              if (tab === 'reformes') return t.includes('reforme');
              if (tab === 'agenda') return t.includes('agenda') || t.includes('programme');
              return true;
            }}
            extra={(i) => (tab === 'actualites' ? (i === 0 ? <ExploreCard promo={explorePromos[0]} /> : i === 2 ? <ParishCard /> : i === 3 ? <ShortcutsBlock /> : null) : null)}
          />
        ) : (
        <div className="space-y-4">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : visible.length === 0 ? (
            <div className="card">
              <EmptyState icon={tab === 'reactions' ? CircleCheck : Newspaper} title={emptyText[tab]} />
            </div>
          ) : (
            visible.map((p, i) => (
              <Fragment key={p.id}>
                <PostCard post={p} onOpen={() => setOpenPost(p.id)} />
                {tab === 'actualites' && i === 0 && <ExploreCard promo={explorePromos[0]} />}
                {tab === 'actualites' && i === 2 && <ParishCard />}
                {tab === 'actualites' && i === 3 && <ShortcutsBlock />}
                {tab === 'actualites' && i === 5 && <ExploreCard promo={explorePromos[1]} />}
              </Fragment>
            ))
          )}
          {!loading && visible.length > 0 && <p className="py-6 text-center text-sm text-ink-faint">Vous êtes à jour ✨</p>}
        </div>
        )}
      </div>
      <FloatingButtons />
      <PostDetailModal postId={openPost} onClose={() => setOpenPost(null)} />
    </div>
  );
}
