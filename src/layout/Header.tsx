import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, CircleHelp, Moon, Plus, Clapperboard, House, LogOut, Menu, MessageCircle, PanelRight, RotateCcw, Search, Settings, UserRound, Users,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { NotificationItem } from '@/components/NotificationItem';
import { useFriends } from '@/services/friends';
import { notifications as notifActions, useNotifications } from '@/services/notifications';
import { EmptyState } from '@/components/ui/Feedback';
import { accountName, actions, useApp } from '@/store/app';
import { chatStore, useUnreadChats } from '@/store/chat';
import { libraryStore } from '@/store/library';
import { mediaStore } from '@/store/media';
import { agendaStore } from '@/store/agenda';
import { settings, settingsStore, useSettings } from '@/store/settings';
import { Toggle } from '@/components/ui/Toggle';
import { CreateChooser } from '@/components/social/SocialWidgets';
import { Button } from '@/components/ui/Button';
import { confirmDialog, toast, ui, useUi, withLoader } from '@/store/ui';
import { GlobalSearch } from './GlobalSearch';
import { headerVariantFor } from './routeMeta';
import { cn } from '@/lib/utils';

function NotificationsPopover() {
  const { items: notifications, loaded } = useNotifications();
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  return (
    <Popover
      className="w-[380px] max-w-[calc(100vw-24px)]"
      trigger={({ open, toggle }) => <IconButton icon={Bell} label="Notifications" badge={unread} active={open} onClick={toggle} />}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <div>
              <h2 className="text-lg font-extrabold">Notifications</h2>
              <p className="text-xs text-ink-muted">{unread ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
            </div>
            {unread > 0 && (
              <button onClick={() => void notifActions.markAllRead()} className="rounded-full px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-mint-100">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-[440px] space-y-0.5 overflow-y-auto px-2 pb-2">
            {!loaded ? (
              <p className="py-8 text-center text-sm text-ink-muted">Chargement…</p>
            ) : notifications.length === 0 ? (
              <EmptyState icon={Bell} title="Aucune notification pour le moment" className="py-8" />
            ) : (
              notifications.slice(0, 8).map((n) => <NotificationItem key={n.id} n={n} compact onNavigate={close} />)
            )}
          </div>
          <Link to="/notifications" onClick={close} className="block border-t border-line py-3 text-center text-sm font-bold text-brand-700 hover:bg-mint-50">
            Tout voir
          </Link>
        </div>
      )}
    </Popover>
  );
}

function ThemeMenuItem() {
  const theme = useSettings((s) => s.theme);
  const dark = theme === 'sombre' || (theme === 'systeme' && document.documentElement.classList.contains('dark'));
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken"><Moon size={16} /></span>
      <span className="flex-1">Mode sombre<span className="block text-xs font-normal text-ink-muted">{theme === 'systeme' ? 'Selon l’appareil' : dark ? 'Activé' : 'Désactivé'}</span></span>
      <Toggle checked={dark} onChange={(v) => settings.set({ theme: v ? 'sombre' : 'clair' })} label="Mode sombre" />
    </div>
  );
}

function ProfilePopover() {
  const account = useApp((s) => s.account);
  const navigate = useNavigate();
  if (!account) return null;
  const name = accountName(account);
  return (
    <Popover
      className="w-[320px]"
      trigger={({ open, toggle }) => (
        <button onClick={toggle} aria-label="Menu du compte" aria-expanded={open} className={cn('rounded-full p-0.5 transition', open ? 'ring-2 ring-brand-500' : 'hover:ring-2 hover:ring-line')}>
          <Avatar name={name} hue={account.hue} src={account.avatar} size="sm" />
        </button>
      )}
    >
      {(close) => {
        const go = (to: string) => {
          close();
          navigate(to);
        };
        return (
          <div className="p-2">
            <button onClick={() => go('/profil')} className="flex w-full items-center gap-3 rounded-xl bg-mint-50 p-3 text-left transition hover:bg-mint-100">
              <Avatar name={name} hue={account.hue} src={account.avatar} size="md" />
              <span className="min-w-0">
                <span className="block truncate font-bold">{name}</span>
                <span className="block truncate text-xs text-ink-muted">Voir votre profil</span>
              </span>
            </button>
            <div className="my-2 h-px bg-line" />
            <MenuItem icon={UserRound} onClick={() => go('/social/profil')}>Profil social</MenuItem>
            <MenuItem icon={Settings} onClick={() => go('/profil/parametres')}>Paramètres et confidentialité</MenuItem>
            <MenuItem icon={CircleHelp} onClick={() => go('/menu/compte/aide')}>Aide et assistance</MenuItem>
            <ThemeMenuItem />
            <MenuItem
              icon={RotateCcw}
              hint="Remet toutes les données de test à zéro"
              onClick={async () => {
                close();
                if (await confirmDialog({ title: 'Réinitialiser la démo ?', message: 'Likes, commentaires, notifications et amis reviendront à leur état initial.', confirmLabel: 'Réinitialiser' })) {
                  actions.resetDemo();
                  chatStore.reset();
                  libraryStore.reset();
                  mediaStore.reset();
                  agendaStore.reset();
                  settingsStore.reset();
                  toast('Données de démonstration réinitialisées');
                }
              }}
            >
              Réinitialiser la démo
            </MenuItem>
            <MenuItem
              icon={LogOut}
              tone="danger"
              onClick={() => {
                close();
                withLoader('Déconnexion…', 800, () => {
                  actions.logout();
                  navigate('/connexion');
                });
              }}
            >
              Se déconnecter
            </MenuItem>
            <p className="px-3 pb-1 pt-2 text-[11px] text-ink-faint">Confidentialité · Conditions · © 2026 CélèOne</p>
          </div>
        );
      }}
    </Popover>
  );
}

function SocialCreateButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <Button size="sm" icon={Plus} className="hidden h-10 lg:inline-flex" onClick={() => setOpen(true)}>
        Créer
      </Button>
      <CreateChooser open={open} onClose={() => setOpen(false)} onPick={(k) => navigate(`/social?creer=${k}`)} />
    </>
  );
}

export function Header() {
  const section = useUi((s) => s.section);
  const unreadMessages = useUnreadChats();
  const demoRequests = useApp((s) => s.friendRequests.length);
  const account = useApp((s) => s.account);
  const remoteRequests = useFriends((s) => s.incoming.length);
  const requestCount = account?.remote ? remoteRequests : demoRequests;
  const { pathname } = useLocation();
  const variant = headerVariantFor(section);
  const is = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <header className="sticky top-0 z-40 h-header border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="flex h-full items-center gap-2 px-3 md:gap-4 md:px-5">
        <IconButton icon={Menu} label="Ouvrir le menu" variant="plain" className="lg:hidden" onClick={() => ui.setMenuOpen(true)} />
        <Logo className="shrink-0" onClick={() => ui.setSection('accueil')} wordmarkClassName="hidden min-[400px]:block" />
        <GlobalSearch className="ml-2 hidden max-w-[440px] flex-1 md:block xl:ml-8" />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <IconButton icon={Search} label="Rechercher" className="md:hidden" onClick={() => ui.setSearchOpen(true)} />

          {variant === 'default' && (
            <>
              <IconButton icon={House} label="Accueil" to="/accueil" active={is('/accueil')} className="hidden sm:inline-flex" />
              <IconButton icon={MessageCircle} label="Discussions" to="/discussions" badge={unreadMessages} active={is('/discussions')} />
              <NotificationsPopover />
              <ProfilePopover />
            </>
          )}

          {variant === 'social' && (
            <>
              <SocialCreateButton />
              <IconButton icon={House} label="Accueil" to="/accueil" className="hidden sm:inline-flex" />
              <IconButton icon={Users} label="Amis" to="/social/amis" badge={requestCount} active={is('/social/amis')} />
              <IconButton icon={MessageCircle} label="Discussions" to="/discussions" badge={unreadMessages} active={is('/discussions')} />
              <IconButton icon={Clapperboard} label="Cele Vibes" to="/social/cele-vibes" active={is('/social/cele-vibes')} className="hidden sm:inline-flex" />
              {account && (
                <Link to="/social/profil" aria-label="Profil social" title="Profil social" className={cn('rounded-full p-0.5 transition', is('/social/profil') ? 'ring-2 ring-brand-500' : 'hover:ring-2 hover:ring-line')}>
                  <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="sm" />
                </Link>
              )}
            </>
          )}

          {variant === 'reduced' && (
            <>
              <NotificationsPopover />
              <IconButton icon={Settings} label="Paramètres" to="/profil/parametres" active={is('/profil/parametres')} />
            </>
          )}

          <IconButton icon={PanelRight} label="Accès rapides" variant="plain" className="hidden lg:inline-flex xl:hidden" onClick={() => ui.setRailOpen(true)} />
        </div>
      </div>
      <div className="rainbow-bar absolute inset-x-0 bottom-[-1px] h-[2px] opacity-80" />
    </header>
  );
}
