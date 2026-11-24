import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  mint: 'bg-mint-100 text-brand-800',
  gray: 'bg-surface-sunken text-ink-soft',
  gold: 'bg-gold-50 text-gold-700',
  lavender: 'bg-lavender-50 text-lavender',
  violet: 'bg-violet-50 text-violet',
  orange: 'bg-orange-50 text-orange',
  danger: 'bg-danger-50 text-danger-700',
  night: 'bg-night text-white',
  brand: 'bg-brand-600 text-white',
};

export type ChipTone = keyof typeof tones;

export function Chip({ children, tone = 'mint', icon: Icon, className, upper }: { children: ReactNode; tone?: ChipTone; icon?: LucideIcon; className?: string; upper?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold', upper && 'uppercase tracking-wide text-[10.5px]', tones[tone], className)}>
      {Icon && <Icon size={12} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

export function CountBadge({ count, tone = 'danger', className }: { count: number; tone?: 'danger' | 'gold' | 'gray' | 'brand'; className?: string }) {
  if (count <= 0) return null;
  const toneClass = { danger: 'bg-danger text-white', gold: 'bg-gold-500 text-night', gray: 'bg-surface-sunken text-ink-soft', brand: 'bg-brand-600 text-white' }[tone];
  return <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold', toneClass, className)}>{count > 99 ? '99+' : count}</span>;
}
