import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo-celeone.svg`} alt="CélèOne" className={cn('h-9 w-9 object-contain', className)} draggable={false} />;
}

export function Logo({ to = '/accueil', onClick, compact, light, className, wordmarkClassName }: { to?: string; onClick?: () => void; compact?: boolean; light?: boolean; className?: string; wordmarkClassName?: string }) {
  return (
    <Link to={to} onClick={onClick} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="CélèOne — Accueil">
      <span className="relative">
        <LogoMark className="h-10 w-10 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" />
      </span>
      {!compact && (
        <span className={cn('leading-none', wordmarkClassName)}>
          <span className={cn('block font-display text-[21px] font-black tracking-tight', light ? 'text-white' : 'text-brand-900')}>
            Cèlè<span className={light ? 'text-mint-300' : 'text-brand-600'}>One</span>
          </span>
          <span className={cn('mt-0.5 block text-[11px] font-medium', light ? 'text-white/70' : 'text-ink-muted')}>Réseau des célestes</span>
        </span>
      )}
    </Link>
  );
}
