import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, text, action, className }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="icon-tile mb-4 h-16 w-16 rounded-2xl">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <h3 className="text-base font-extrabold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-4 aspect-[16/10] w-full rounded-lg" />
      <Skeleton className="mt-4 h-3.5 w-4/5" />
      <Skeleton className="mt-2 h-3.5 w-3/5" />
    </div>
  );
}

export function SectionTitle({ title, action, eyebrow, className }: { title: ReactNode; action?: ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
        <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
