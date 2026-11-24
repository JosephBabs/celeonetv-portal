import { useEffect, useState } from 'react';
import { cn, initials } from '@/lib/utils';
import { getMember } from '@/data/members';
import { accountName, useApp } from '@/store/app';
import type { Member } from '@/data/types';

const sizes = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

interface AvatarProps {
  name: string;
  hue?: number;
  official?: boolean;
  size?: keyof typeof sizes;
  ring?: boolean;
  online?: boolean;
  className?: string;
  src?: string;
}

/** Avatar : logo pour les comptes officiels, sinon initiales sur un dégradé propre à chaque membre. */
export function Avatar({ name, hue = 170, official, size = 'md', ring, online, className, src }: AvatarProps) {
  // Photo introuvable ou illisible : on revient aux initiales (jamais d'icône d'image cassée).
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const face = src && !broken ? (
    <img src={src} alt="" onError={() => setBroken(true)} className={cn('rounded-full object-cover', sizes[size])} />
  ) : official ? (
    <span className={cn('flex items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-line', sizes[size])}>
      <img src={`${import.meta.env.BASE_URL}logo-celeone.svg`} alt="" className="h-[82%] w-[82%] object-contain" />
    </span>
  ) : (
    <span
      className={cn('flex items-center justify-center rounded-full font-bold text-white', sizes[size])}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 52%), hsl(${(hue + 40) % 360} 58% 38%))` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
  return (
    <span className={cn('relative inline-flex shrink-0', className)} title={name}>
      {ring ? <span className="rainbow-ring rounded-full p-[2.5px]"><span className="block rounded-full bg-surface p-[2px]">{face}</span></span> : face}
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-surface" aria-label="En ligne" />}
    </span>
  );
}

export function MemberAvatar({ member, memberId, ...rest }: Omit<AvatarProps, 'name' | 'hue' | 'official'> & { member?: Member; memberId?: string }) {
  const m = member ?? getMember(memberId ?? '');
  return <Avatar name={m.name} hue={m.hue} official={m.official} {...rest} />;
}

/** Avatar du compte connecté (photo importée si disponible). */
export function MeAvatar(props: Omit<AvatarProps, 'name' | 'hue' | 'official' | 'src'>) {
  const account = useApp((s) => s.account);
  if (!account) return null;
  return <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} {...props} />;
}
