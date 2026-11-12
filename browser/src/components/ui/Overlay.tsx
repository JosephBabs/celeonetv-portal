import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

let lockCount = 0;
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.documentElement.style.overflow = '';
    };
  }, [active]);
}

export function useEscape(active: boolean, onEscape: () => void) {
  const cb = useRef(onEscape);
  cb.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cb.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

/** Place le focus dans le panneau à l'ouverture et le rend à l'élément d'origine à la fermeture. */
function useFocusReturn(active: boolean, panel: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>('[data-autofocus], input:not([type=radio]), textarea');
      (target ?? panel.current)?.focus();
    }, 30);
    return () => {
      window.clearTimeout(t);
      previous?.focus?.();
    };
  }, [active, panel]);
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  hideClose?: boolean;
}

export function Modal({ open, onClose, children, title, description, className, hideClose, size = 'md', footer }: BaseProps & { size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useScrollLock(open);
  useEscape(open, onClose);
  useFocusReturn(open, panel);
  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-night/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn('relative flex max-h-[92vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-surface shadow-lg outline-none sm:animate-pop-in sm:rounded-2xl', width, className)}
      >
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 px-6 pb-2 pt-5">
            <div className="min-w-0 flex-1">
              {title && <h2 id={titleId} className="text-lg font-extrabold text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>
            {!hideClose && <IconButton icon={X} label="Fermer" size="sm" onClick={onClose} />}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-sunken/50 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, children, side = 'left', className, title }: BaseProps & { side?: 'left' | 'right' }) {
  const panel = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useEscape(open, onClose);
  useFocusReturn(open, panel);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 animate-fade-in bg-night/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'absolute top-0 flex h-full w-[88vw] max-w-[380px] flex-col bg-mint-50 shadow-lg outline-none',
          side === 'left' ? 'left-0 animate-slide-left rounded-r-3xl' : 'right-0 animate-slide-right rounded-l-3xl',
          className,
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
