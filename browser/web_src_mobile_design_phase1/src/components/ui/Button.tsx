import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'night' | 'danger' | 'danger-soft' | 'white';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border-[1.5px] border-brand-600 bg-surface text-brand-700 hover:bg-mint-100',
  soft: 'bg-mint-100 text-brand-800 hover:bg-mint-200',
  ghost: 'bg-surface-sunken text-ink hover:bg-line/80',
  night: 'bg-night text-white hover:bg-night-700',
  danger: 'bg-danger text-white hover:bg-danger-700',
  'danger-soft': 'bg-danger-50 text-danger-700 hover:bg-danger/15',
  white: 'bg-surface text-brand-800 shadow-sm hover:bg-mint-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-[15px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  loadingText?: string;
  to?: string;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, loadingText, to, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const classes = cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition duration-150',
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
    variants[variant],
    sizes[size],
    block && 'w-full',
    className,
  );
  const iconSize = size === 'sm' ? 15 : 17;
  const content: ReactNode = (
    <>
      {loading ? <LoaderCircle size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} strokeWidth={2.1} />}
      {loading && loadingText ? loadingText : children}
      {!loading && IconRight && <IconRight size={iconSize} strokeWidth={2.1} />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'ghost' | 'soft' | 'plain' | 'white' | 'primary' | 'danger-soft' | 'glass';
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
  badge?: number;
  active?: boolean;
  to?: string;
}

const iconVariants = {
  ghost: 'bg-surface-sunken text-ink-soft hover:bg-line/80 hover:text-ink',
  soft: 'bg-mint-100 text-brand-700 hover:bg-mint-200',
  plain: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  white: 'bg-surface text-ink shadow-sm hover:bg-mint-50',
  primary: 'bg-brand-600 text-white shadow-glow hover:bg-brand-700',
  'danger-soft': 'bg-danger-50 text-danger hover:bg-danger/15',
  glass: 'bg-black/35 text-white backdrop-blur hover:bg-black/50',
};

const iconSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = 'ghost', shape = 'circle', size = 'md', badge, active, to, className, type = 'button', ...rest },
  ref,
) {
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? '');
  const classes = cn(
    !positioned && 'relative',
    'inline-flex shrink-0 items-center justify-center transition duration-150 disabled:cursor-not-allowed disabled:opacity-45',
    shape === 'circle' ? 'rounded-full' : 'rounded-md',
    iconSizes[size],
    active ? 'bg-mint-100 text-brand-700 ring-1 ring-brand-200' : iconVariants[variant],
    className,
  );
  const inner = (
    <>
      <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 19} strokeWidth={2} />
      {!!badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label}>
        {inner}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} aria-label={label} title={label} className={classes} {...rest}>
      {inner}
    </button>
  );
});
