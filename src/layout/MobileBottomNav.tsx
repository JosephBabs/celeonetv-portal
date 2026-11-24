import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark, Compass, House, Music, Phone, Plus, Search, Settings, UserRound, Users, MessageCircle, CirclePlay,
} from 'lucide-react';
import { primaryNav } from '@/data/navigation';
import { accountName, useApp } from '@/store/app';
import { useNotifications } from '@/services/notifications';
import { ui, useUi } from '@/store/ui';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { CreateChooser } from '@/components/social/SocialWidgets';
import type { BottomNavKind } from './routeMeta';
import { cn } from '@/lib/utils';

const barClass = 'fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden';

/** Barre par défaut : l'item actif devient un gros cercle surélevé dans son emplacement (comme l'app mobile). */
function DefaultBar() {
  const { pathname } = useLocation();
  const { items: notifications } = useNotifications();
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  return (
    <nav className={barClass} aria-label="Navigation principale">
      <ul className="grid h-16 grid-cols-5">
        {primaryNav.map((item) => {
          const active = pathname.startsWith(item.to);
          const label = item.id === 'accueil' ? 'Cèlè One' : item.label;
          return (
            <li key={item.id} className="flex justify-center">
              <NavLink to={item.to} aria-label={label} className="relative flex w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-muted" aria-current={active ? 'page' : undefined}>
                {active ? (
                  <span className={cn('relative -mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full shadow-lg ring-4 ring-surface', item.icon === 'logo' ? 'bg-white' : 'bg-brand-700 text-white')}>
                    {item.icon === 'logo' ? <LogoMark className="h-11 w-11" /> : <item.icon size={25} strokeWidth={2} />}
                    {item.icon === 'logo' && unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">{unread}</span>}
                  </span>
                ) : (
                  <>
                    {item.icon === 'logo' ? <LogoMark className="h-6 w-6" /> : <item.icon size={22} strokeWidth={1.7} />}
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SimpleBar({ items }: { items: { label: string; icon: typeof House; to?: string; onClick?: () => void; active: boolean; avatar?: boolean; center?: boolean }[] }) {
  const account = useApp((s) => s.account);
  return (
    <nav className={barClass}>
      <ul className="flex h-16 items-center justify-around">
        {items.map((it) => {
          const inner = it.center ? (
            <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-surface">
              <it.icon size={26} />
            </span>
          ) : (
            <>
              {it.avatar && account ? (
                <span className={cn('rounded-full', it.active && 'ring-2 ring-brand-500')}>
                  <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="xs" />
                </span>
              ) : (
                <span className={cn('flex h-8 w-12 items-center justify-center rounded-full transition', it.active && 'bg-mint-100')}>
                  <it.icon size={21} strokeWidth={it.active ? 2.3 : 1.8} />
                </span>
              )}
              <span>{it.label}</span>
            </>
          );
          const cls = cn('flex min-w-[56px] flex-col items-center gap-0.5 text-[11px] font-medium', it.active ? 'text-brand-700' : 'text-ink-muted');
          return (
            <li key={it.label}>
              {it.to ? (
                <Link to={it.to} className={cls} aria-label={it.label}>
                  {inner}
                </Link>
              ) : (
                <button onClick={it.onClick} className={cls} aria-label={it.label}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileBottomNav({ kind }: { kind: BottomNavKind }) {
  const { pathname, search } = useLocation();
  const searchOpen = useUi((s) => s.searchOpen);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const tab = new URLSearchParams(search).get('vue') ?? new URLSearchParams(search).get('onglet');

  if (kind === 'none') return null;
  if (kind === 'default') return <DefaultBar />;

  if (kind === 'social') {
    return (
      <>
        <SimpleBar
          items={[
            { label: 'Accueil', icon: House, to: '/social', active: pathname === '/social' },
            { label: 'Rechercher', icon: Search, onClick: () => ui.setSearchOpen(true), active: searchOpen },
            { label: 'Créer', icon: Plus, onClick: () => setCreating(true), active: false, center: true },
            { label: 'Cele Vibes', icon: CirclePlay, to: '/social/cele-vibes', active: pathname.startsWith('/social/cele-vibes') },
            { label: 'Profil social', icon: UserRound, to: '/social/profil', active: pathname.startsWith('/social/profil'), avatar: true },
          ]}
        />
        <CreateChooser open={creating} onClose={() => setCreating(false)} onPick={(k) => navigate(`/social?creer=${k}`)} />
      </>
    );
  }

  if (kind === 'discussions') {
    return (
      <SimpleBar
        items={[
          { label: 'Discussions', icon: MessageCircle, to: '/discussions', active: !tab },
          { label: 'Vos appels', icon: Phone, to: '/discussions?vue=appels', active: tab === 'appels' },
          { label: 'Personnes', icon: Users, to: '/discussions?vue=personnes', active: tab === 'personnes' },
          { label: 'Paramètres', icon: Settings, to: '/discussions?vue=parametres', active: tab === 'parametres' },
        ]}
      />
    );
  }

  return (
    <SimpleBar
      items={[
        { label: 'Accueil', icon: House, to: '/streaming', active: !tab },
        { label: 'Explorer', icon: Compass, to: '/streaming?onglet=explorer', active: tab === 'explorer' },
        { label: 'Musique', icon: Music, to: '/streaming?onglet=musique', active: tab === 'musique' },
        { label: 'Ma liste', icon: Bookmark, to: '/streaming?onglet=ma-liste', active: tab === 'ma-liste' },
        { label: 'Moi', icon: UserRound, to: '/streaming?onglet=moi', active: tab === 'moi' },
      ]}
    />
  );
}
