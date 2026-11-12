import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Settings, X } from 'lucide-react';
import { accountName, actions, useApp } from '@/store/app';
import { ui, useUi, withLoader } from '@/store/ui';
import { Drawer } from '@/components/ui/Overlay';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { Header } from './Header';
import { DesktopSidebar, PrimaryNav, SecondaryMenu, SidebarFooter } from './Sidebar';
import { RightRail } from './RightRail';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileSearch } from './GlobalSearch';
import { getRouteMeta } from './routeMeta';
import { MiniPlayer } from '@/components/MiniPlayer';
import { CeleLoader } from '@/components/CeleLoader';
import { cn } from '@/lib/utils';
import { useInboxSync } from '@/services/notifications';
import { useFriendsSync } from '@/services/friends';
import { useConversationsSync } from '@/services/conversations';

function MenuDrawer() {
  const open = useUi((s) => s.menuOpen);
  const account = useApp((s) => s.account);
  const navigate = useNavigate();
  const close = () => ui.setMenuOpen(false);
  if (!account) return null;
  const name = accountName(account);
  return (
    <Drawer open={open} onClose={close} title="Menu">
      <div className="flex items-start justify-between px-5 pb-3 pt-5">
        <div>
          <p className="eyebrow">Cèlè One</p>
          <h2 className="font-display text-[28px] font-black leading-tight text-brand-900">Menu</h2>
        </div>
        <IconButton icon={X} label="Fermer" variant="soft" onClick={close} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mb-4 rounded-2xl border border-brand-200 bg-mint-100 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={name} hue={account.hue} src={account.avatar} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-bold">{name}</p>
              <p className="truncate text-xs text-ink-muted">{account.identifier}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                close();
                navigate('/profil');
              }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-800"
            >
              Voir le profil <ChevronRight size={15} />
            </button>
            <IconButton icon={Settings} label="Paramètres" variant="white" size="sm" className="h-9 w-9" onClick={() => { close(); navigate('/profil/parametres'); }} />
            <button
              onClick={() => {
                close();
                withLoader('Déconnexion…', 800, () => {
                  actions.logout();
                  navigate('/connexion');
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-3.5 py-2 text-[13px] font-semibold text-danger-700 hover:bg-danger/15"
            >
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        </div>
        <div className="mb-5 rounded-2xl bg-surface p-2 lg:hidden">
          <PrimaryNav onNavigate={close} />
        </div>
        <SecondaryMenu onNavigate={close} />
        <SidebarFooter />
      </div>
    </Drawer>
  );
}

function RailDrawer() {
  const open = useUi((s) => s.railOpen);
  const close = () => ui.setRailOpen(false);
  return (
    <Drawer open={open} onClose={close} side="right" title="Accès rapides" className="bg-canvas">
      <div className="flex justify-end px-3 pt-3">
        <IconButton icon={X} label="Fermer" onClick={close} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <RightRail onNavigate={close} />
      </div>
    </Drawer>
  );
}

export function AppShell() {
  const account = useApp((s) => s.account);
  const section = useUi((s) => s.section);
  const { pathname, search } = useLocation();
  const meta = getRouteMeta(pathname);

  // Compte réel : boîte de notifications chargée puis rafraîchie chaque minute.
  useInboxSync();
  // Compte réel : amis et demandes d'ami (badge, colonne de droite).
  useFriendsSync();
  // Compte réel : liste des discussions (badge des messages non lus).
  useConversationsSync();

  // Compte réel : profil rechargé depuis l'API à l'ouverture de l'application.
  useEffect(() => {
    void actions.refreshAccount();
  }, []);

  useEffect(() => {
    if (meta.section) ui.setSection(meta.section);
  }, [meta.section]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    ui.setMenuOpen(false);
    ui.setRailOpen(false);
  }, [pathname]);

  const publicSocialPost = /^\/social\/[^/]+$/.test(pathname) && !/^\/social\/(?:amis|cele-vibes|profil)$/.test(pathname);
  const publicMemberPage = /^\/social\/(?:membre|page|profil)\/[^/]+\/?$/.test(pathname);
  const guestContent = pathname === '/'
    || publicSocialPost
    || publicMemberPage
    || /^\/(?:accueil|posts?\/[^/]+|reels\/[^/]+|live\/[^/]+|[^/]+\/live|videos\/[^/]+|movies\/[^/]+|songs\/[^/]+|hymns\/[^/]+|themes\/[^/]+|weekly-themes\/[^/]+|weekly-programs\/[^/]+|spiritual-program|streaming(?:\/.*)?|carte-paroisses|parishes(?:\/[^/]+)?|cantiques(?:\/.*)?|bible(?:\/.*)?|jeunesse(?:\/.*)?|radio|agenda|evenements)\/?$/.test(pathname);
  if (!account && !guestContent) return <Navigate to="/connexion" replace state={{ from: pathname + search }} />;

  const bottomNav = meta.bottomNav ?? (section === 'social' ? 'social' : 'default');
  const full = meta.layout === 'full';

  return (
    <div className="min-h-screen">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Header />
      <div className={cn('mx-auto flex w-full', !full && 'max-w-[1600px]')}>
        {!full && (
          <aside className="sticky top-header hidden h-[calc(100vh-var(--header-h))] w-[280px] shrink-0 overflow-y-auto lg:block" aria-label="Navigation">
            <DesktopSidebar />
          </aside>
        )}
        <main id="contenu" className={cn('min-w-0 flex-1', full ? '' : 'px-3 pb-28 pt-4 sm:px-5 md:pb-12 lg:pt-6')}>
          {full ? (
            <Suspense fallback={<CeleLoader />}>
              <Outlet />
            </Suspense>
          ) : (
            <div className={cn('mx-auto w-full', meta.layout === 'wide' ? 'max-w-[960px]' : 'max-w-[680px]')}>
              <Suspense fallback={<CeleLoader />}>
                <Outlet />
              </Suspense>
            </div>
          )}
        </main>
        {meta.layout === 'standard' && (
          <aside className="sticky top-header hidden h-[calc(100vh-var(--header-h))] w-[320px] shrink-0 overflow-y-auto xl:block" aria-label="Accès rapides">
            <RightRail />
          </aside>
        )}
      </div>
      <MobileBottomNav kind={bottomNav} />
      <MiniPlayer withBottomNav={bottomNav !== 'none'} />
      <MenuDrawer />
      <RailDrawer />
      <MobileSearch />
    </div>
  );
}
