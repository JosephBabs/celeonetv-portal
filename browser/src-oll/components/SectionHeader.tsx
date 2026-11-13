import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LogoMark } from './ui/Logo';
import { IconButton } from './ui/Button';
import { cn } from '@/lib/utils';

/** En-tête de section façon app mobile : logo (ou retour), titre, sous-titre, actions à droite. */
export function SectionHeader({ title, subtitle, actions, back, eyebrow, className }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: string | boolean; eyebrow?: string; className?: string }) {
  const navigate = useNavigate();
  return (
    <div className={cn('mb-4 flex items-center gap-3', className)}>
      {back ? (
        <IconButton icon={ChevronLeft} label="Retour" shape="square" onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))} />
      ) : (
        <LogoMark className="h-12 w-12 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="truncate text-[26px] font-black leading-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, autoFocus, className }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; className?: string }) {
  return (
    <label className={cn('flex h-14 items-center gap-3 rounded-2xl bg-surface-sunken px-5 text-ink-muted transition focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand-500/30', className)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-full flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint" />
      {value && (
        <button type="button" onClick={() => onChange('')} className="rounded-full px-2 py-1 text-xs font-semibold text-ink-muted hover:bg-line">
          Effacer
        </button>
      )}
    </label>
  );
}
