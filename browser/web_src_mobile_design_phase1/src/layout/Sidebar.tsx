import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { menuGroups, menuShortcuts, primaryNav } from '@/data/navigation';
import { LogoMark } from '@/components/ui/Logo';
import { cn, normalize } from '@/lib/utils';
import type { NavItem } from '@/data/types';

export function PrimaryNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navigation principale" className="space-y-1">
      {primaryNav.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[15px] font-semibold transition',
              isActive ? 'bg-mint-100 font-bold text-brand-900' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="rainbow-bar absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-full" />}
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition', isActive ? 'bg-surface text-brand-700 shadow-xs' : 'bg-surface-sunken text-ink-muted group-hover:text-brand-700')}>
                {item.icon === 'logo' ? <LogoMark className="h-7 w-7" /> : <item.icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />}
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function MenuTile({ item, onNavigate, compact }: { item: NavItem; onNavigate?: () => void; compact?: boolean }) {
  const { pathname } = useLocation();
  const active = pathname === item.to;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium leading-tight transition',
        compact ? 'py-2' : 'py-2.5',
        active ? 'bg-mint-100 text-brand-900' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
      )}
    >
      <item.icon size={16} className="shrink-0 text-brand-600" strokeWidth={2} />
      <span className="min-w-0">
        <span className="line-clamp-2">{item.label}</span>
        {item.hint && <span className="block text-[10.5px] font-bold uppercase text-brand-600">{item.hint}</span>}
      </span>
    </NavLink>
  );
}

const INITIAL_GROUPS = 6;

/** Menu secondaire ☰ : raccourcis + 15 groupes en accordéon (plusieurs ouverts possibles). */
export function SecondaryMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => {
    const current = menuGroups.find((g) => g.items.some((i) => i.to === pathname));
    return new Set(current ? [current.id] : []);
  });

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return menuGroups.flatMap((g) => g.items.filter((i) => normalize(`${i.label} ${g.label}`).includes(q)).map((i) => ({ ...i, group: g.label })));
  }, [query]);

  useEffect(() => {
    const current = menuGroups.find((g) => g.items.some((i) => i.to === pathname));
    if (current) {
      setOpen((prev) => (prev.has(current.id) ? prev : new Set(prev).add(current.id)));
      if (menuGroups.indexOf(current) >= INITIAL_GROUPS) setShowAll(true);
    }
  }, [pathname]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const groups = showAll ? menuGroups : menuGroups.slice(0, INITIAL_GROUPS);

  return (
    <div>
      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un outil…"
          aria-label="Rechercher un outil dans le menu"
          className="h-10 w-full rounded-full border border-transparent bg-surface-sunken pl-9 pr-9 text-[13px] outline-none transition placeholder:text-ink-faint focus:border-brand-300 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
        />
        {query && (
          <button aria-label="Effacer" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint hover:text-ink">
            <X size={14} />
          </button>
        )}
      </div>

      {results ? (
        <div className="space-y-0.5">
          {results.length === 0 && <p className="px-2 py-6 text-center text-sm text-ink-muted">Aucun outil ne correspond à « {query} ».</p>}
          {results.map((r) => (
            <div key={r.to + r.id}>
              <MenuTile item={r} onNavigate={onNavigate} compact />
              <p className="-mt-1 mb-1 pl-9 text-[11px] text-ink-faint">{r.group}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-2 px-1 text-[13px] font-extrabold text-ink">Raccourcis</p>
          <div className="mb-5 grid grid-cols-2 gap-1.5">
            {menuShortcuts.map((s) => (
              <NavLink
                key={s.id}
                to={s.to}
                onClick={onNavigate}
                className="flex flex-col gap-2 rounded-xl border border-line/70 bg-surface p-2.5 text-[12.5px] font-semibold leading-tight text-ink transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm"
              >
                <span className="icon-tile h-8 w-8 rounded-lg">
                  <s.icon size={16} />
                </span>
                <span>
                  {s.label}
                  {s.hint && <span className="block text-[10.5px] font-bold text-brand-600">{s.hint}</span>}
                </span>
              </NavLink>
            ))}
          </div>

          <div className="space-y-1.5">
            {groups.map((g) => {
              const isOpen = open.has(g.id);
              return (
                <div key={g.id} className={cn('overflow-hidden rounded-xl border transition', isOpen ? 'border-line bg-surface shadow-xs' : 'border-transparent bg-surface/70 hover:bg-surface')}>
                  <button onClick={() => toggle(g.id)} aria-expanded={isOpen} className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left">
                    <span className="icon-tile h-8 w-8 rounded-lg">
                      <g.icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{g.label}</span>
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-bold text-ink-muted">{g.items.length}</span>
                    <ChevronDown size={16} className={cn('text-ink-muted transition-transform duration-200', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="grid animate-fade-in grid-cols-2 gap-1 border-t border-line/70 p-1.5">
                      {g.items.map((i) => (
                        <MenuTile key={i.id} item={i} onNavigate={onNavigate} compact />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowAll((v) => !v)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-mint-100 py-2.5 text-[13px] font-bold text-brand-800 transition hover:bg-mint-200">
            {showAll ? 'Voir moins' : `Voir plus (${menuGroups.length - INITIAL_GROUPS})`}
            <ChevronDown size={15} className={cn('transition-transform', showAll && 'rotate-180')} />
          </button>
        </>
      )}
    </div>
  );
}

export function SidebarFooter() {
  return (
    <p className="px-1 pb-2 pt-6 text-[11px] leading-relaxed text-ink-faint">
      Confidentialité · Conditions · Aide
      <br />© 2026 CélèOne — Église du Christianisme Céleste
    </p>
  );
}

export function DesktopSidebar() {
  return (
    <div className="space-y-5 px-3 py-5">
      <PrimaryNav />
      <div className="h-px bg-line" />
      <div>
        <p className="eyebrow mb-3 px-1">Menu</p>
        <SecondaryMenu />
      </div>
      <SidebarFooter />
    </div>
  );
}
