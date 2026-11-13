import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, MessageCircle, Newspaper, Trash2, Users } from 'lucide-react';
import type { AppNotification, NotificationCategory } from '@/data/types';
import { notifications } from '@/services/notifications';
import { cn, timeAgo } from '@/lib/utils';
import { Chip } from './ui/Chip';

export const categoryMeta: Record<NotificationCategory, { label: string; icon: typeof Bell }> = {
  messages: { label: 'Messages', icon: MessageCircle },
  social: { label: 'Social', icon: Users },
  publications: { label: 'Publications', icon: Newspaper },
  evenements: { label: 'Événements', icon: CalendarDays },
  systeme: { label: 'Système', icon: Bell },
};

export function deleteWithUndo(n: AppNotification) {
  notifications.remove(n);
}

export function NotificationItem({ n, compact, onNavigate }: { n: AppNotification; compact?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const meta = categoryMeta[n.category];
  const open = () => {
    notifications.markRead(n);
    onNavigate?.();
    navigate(n.action.to);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
      className={cn('group relative flex cursor-pointer gap-3 rounded-xl transition hover:bg-surface-sunken/70', compact ? 'p-2.5' : 'p-3.5', !n.read && 'bg-mint-50')}
    >
      <span className={cn('icon-tile rounded-xl', compact ? 'h-10 w-10' : 'h-12 w-12')}>
        <meta.icon size={compact ? 18 : 21} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!compact && <Chip upper>{meta.label}</Chip>}
          <span className="ml-auto shrink-0 text-xs text-ink-faint">{timeAgo(n.createdAt)}</span>
        </div>
        <p className={cn('truncate font-bold text-ink', compact ? 'pr-6 text-[13.5px]' : 'mt-1.5 text-[15px]')}>
          {!n.read && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand-600 align-middle" aria-label="Non lue" />}
          {n.title}
        </p>
        <p className={cn('text-ink-muted', compact ? 'line-clamp-2 text-[12.5px]' : 'text-sm')}>{n.body}</p>
        {!compact && <span className="mt-1.5 inline-block text-[13px] font-bold text-brand-700 group-hover:underline">{n.action.label}</span>}
      </div>
      <button
        aria-label="Supprimer la notification"
        onClick={(e) => {
          e.stopPropagation();
          deleteWithUndo(n);
        }}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full bg-danger-50 text-danger transition hover:bg-danger/15',
          compact && 'absolute right-2 top-2 opacity-0 group-hover:opacity-100 focus:opacity-100',
        )}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
