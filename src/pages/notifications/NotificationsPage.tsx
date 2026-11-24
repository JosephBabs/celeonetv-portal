import { useMemo, useState } from 'react';
import { Bell, CheckCheck, LayoutGrid, RotateCw, Trash2 } from 'lucide-react';
import { notificationCategories } from '@/data/notifications';
import type { NotificationCategory } from '@/data/types';
import { loadInbox, notifications as notifActions, useNotifications } from '@/services/notifications';
import { confirmDialog, toast } from '@/store/ui';
import { NotificationItem, categoryMeta } from '@/components/NotificationItem';
import { EmptyState } from '@/components/ui/Feedback';
import { Button, IconButton } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const { items: notifications, loaded, error } = useNotifications();
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const visible = filter === 'all' ? notifications : notifications.filter((n) => n.category === filter);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-start gap-3 p-5 pb-4">
          <LogoMark className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-black leading-tight text-ink">Notifications</h1>
            <p className="text-sm text-ink-muted">{unread ? `${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
          </div>
          <IconButton
            icon={Trash2}
            label="Supprimer toutes les notifications"
            variant="danger-soft"
            shape="square"
            size="lg"
            disabled={notifications.length === 0}
            onClick={async () => {
              const ok = await confirmDialog({ title: 'Supprimer toutes les notifications ?', message: 'Cette action est définitive.', confirmLabel: 'Tout supprimer', tone: 'danger' });
              if (ok) {
                try {
                  await notifActions.clear();
                  toast('Toutes les notifications ont été supprimées');
                } catch (e) {
                  toast((e as Error).message, { tone: 'danger' });
                }
              }
            }}
          />
        </div>
        <div className="px-5">
          <Button variant="soft" icon={CheckCheck} disabled={unread === 0} onClick={() => { void notifActions.markAllRead(); toast('Toutes les notifications sont marquées comme lues'); }}>
            Marquer lu
          </Button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-4 scrollbar-none" role="tablist" aria-label="Catégories">
          {notificationCategories.map((c) => {
            const count = c.id === 'all' ? notifications.length : notifications.filter((n) => n.category === c.id).length;
            const Icon = c.id === 'all' ? LayoutGrid : categoryMeta[c.id].icon;
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(c.id)}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition',
                  active ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-surface text-ink-soft hover:border-brand-300',
                )}
              >
                <Icon size={16} />
                {c.label}
                <span className={cn('text-[13px]', active ? 'text-white/80' : 'text-ink-muted')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-2">
        {!loaded ? (
          <div className="space-y-1 p-1.5" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-2">
                <span className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-surface-sunken" />
                <span className="flex-1 space-y-2 py-1">
                  <span className="block h-3.5 w-1/3 animate-pulse rounded bg-surface-sunken" />
                  <span className="block h-3 w-3/4 animate-pulse rounded bg-surface-sunken" />
                </span>
              </div>
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted">Notifications indisponibles. Vérifiez votre connexion internet puis réessayez.</p>
            <Button variant="soft" icon={RotateCw} className="mt-3" onClick={() => void loadInbox()}>Réessayer</Button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification pour le moment" text="Vous serez averti ici des messages, demandes d'amis et événements." />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
