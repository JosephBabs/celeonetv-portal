import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEscape } from './Overlay';

/** Menu déroulant ancré à son déclencheur ; se ferme au clic extérieur et sur Échap. */
export function Popover({
  trigger,
  children,
  align = 'right',
  className,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setInnerOpen(v));
  const root = useRef<HTMLDivElement>(null);
  useEscape(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  });

  const close = () => setOpen(false);
  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div className={cn('absolute top-[calc(100%+8px)] z-50 animate-pop-in rounded-xl border border-line bg-surface shadow-lg', align === 'right' ? 'right-0' : 'left-0', className)}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, tone, hint }: { icon?: LucideIcon; children: ReactNode; onClick?: () => void; tone?: 'danger'; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition hover:bg-surface-sunken', tone === 'danger' ? 'text-danger-700' : 'text-ink')}
    >
      {Icon && (
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', tone === 'danger' ? 'bg-danger-50' : 'bg-surface-sunken')}>
          <Icon size={16} />
        </span>
      )}
      <span className="flex-1">
        {children}
        {hint && <span className="block text-xs font-normal text-ink-muted">{hint}</span>}
      </span>
    </button>
  );
}
