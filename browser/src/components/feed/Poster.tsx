import { CirclePlay, Film, Mic2, Music2, Radio, Users, Wheat } from 'lucide-react';
import type { PosterVariant } from '@/data/types';
import { cn } from '@/lib/utils';

/** Visuels d'affiche générés en CSS pour les publications de démonstration (aucune image externe). */
export function Poster({ variant, className }: { variant: PosterVariant; className?: string }) {
  const base = cn('relative isolate flex h-full w-full overflow-hidden', className);

  switch (variant) {
    case 'jubilee':
      return (
        <div className={cn(base, 'flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#fffdf5,#f6ead0_55%,#e9d6a8)] text-center')}>
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2 w-1 rounded-sm"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, transform: `rotate(${i * 41}deg)`, background: i % 3 ? '#d6a634' : '#f3cf6b', opacity: 0.75 }}
            />
          ))}
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#9a7420]">1947 — 2026</span>
          <span className="font-display text-[118px] font-black leading-[0.9] sm:text-[150px]" style={{ background: 'linear-gradient(180deg,#f7d774,#c9921c 55%,#8a5f0c)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 10px rgba(138,95,12,.25))' }}>
            79
          </span>
          <span className="-mt-2 font-display text-4xl font-black italic text-[#b98318]">ans</span>
          <span className="mt-3 rounded-full bg-white/70 px-4 py-1.5 text-[13px] font-semibold text-[#6d4f12] backdrop-blur">de grâce, de lumière et d'espérance</span>
          <span className="rainbow-bar absolute inset-x-0 bottom-0 h-1.5" />
        </div>
      );

    case 'program': {
      const rows = [
        ['Mardi 29', '22 h', 'Exode 19 : 1-9', '#f4a582'],
        ['Mercredi 30', '19 h', 'Job 1 : 1-12', '#5fb3e8'],
        ['Jeudi 1er', 'Minuit', 'Genèse 3 : 1-7', '#8fd16e'],
        ['Vendredi 2', '7 h', 'Exode 32 : 1-8', '#8fd16e'],
        ['Dimanche 4', '10 h', 'Ézéchiel 28 : 12-19', '#f7e463'],
      ];
      return (
        <div className={cn(base, 'flex-col justify-center bg-white p-4 sm:p-6')}>
          <div className="mb-3 text-center">
            <span className="mb-1.5 inline-block rounded-md bg-orange px-2 py-0.5 text-[10px] font-black tracking-wide text-white">URGENT</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-muted">Semaine 40 · Thème : Origine et Source</p>
            <p className="font-display text-lg font-black text-ink">OCTOBRE 2026</p>
          </div>
          <div className="overflow-hidden rounded-md border border-ink/30 text-[11px] sm:text-xs">
            <div className="grid grid-cols-[1.1fr_.7fr_1.6fr] bg-surface-sunken font-bold">
              <span className="border-r border-ink/20 px-2 py-1.5">Jour</span>
              <span className="border-r border-ink/20 px-2 py-1.5">Heure</span>
              <span className="px-2 py-1.5">1re lecture</span>
            </div>
            {rows.map(([d, h, r, c], i) => (
              <div key={i} className="grid grid-cols-[1.1fr_.7fr_1.6fr] border-t border-ink/20" style={{ background: c }}>
                <span className="border-r border-ink/20 px-2 py-1.5 font-semibold">{d}</span>
                <span className="border-r border-ink/20 px-2 py-1.5">{h}</span>
                <span className="px-2 py-1.5">{r}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10.5px] font-semibold text-ink-muted">Cantiques Bénin : 46 bis · 7 · 91 · 173 · 239 · 230 · 172</p>
        </div>
      );
    }

    case 'artists':
      return (
        <div className={cn(base, 'flex-col justify-between bg-[linear-gradient(160deg,#0b7a6e,#063c36)] p-4 text-white')}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-brand-400/20" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint-300">Votre talent, notre plateforme</p>
            <p className="mt-2 font-display text-[30px] font-black leading-[0.95] sm:text-4xl">
              Appel aux
              <br />
              <span className="text-[#ffb347]">Artistes</span>
            </p>
            <p className="mt-2 max-w-[90%] text-[11px] leading-snug text-white/80">Chantres, musiciens, réalisateurs, créateurs de contenu : diffusez vos œuvres sur Cèlè One.</p>
          </div>
          <div className="flex gap-1.5">
            {[Music2, Film, Radio, CirclePlay, Users].map((I, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <I size={13} />
              </span>
            ))}
          </div>
          <span className="self-start rounded-full bg-[#ff8a1f] px-3 py-1.5 text-[11px] font-black uppercase">Publiez vos contenus</span>
        </div>
      );

    case 'youth':
      return (
        <div className={cn(base, 'flex-col items-start justify-end bg-[linear-gradient(170deg,#1b2940,#0f1b2d)] p-4 text-white')}>
          <Mic2 size={70} strokeWidth={1.2} className="absolute right-3 top-3 text-white/10" />
          <span className="rainbow-bar mb-3 h-1 w-16 rounded-full" />
          <p className="font-display text-[26px] font-black italic leading-tight sm:text-3xl">
            Exprimez.
            <br />
            Partagez.
            <br />
            <span className="rainbow-text">Rayonnez.</span>
          </p>
          <p className="mt-2 text-[11px] text-white/70">Streaming monétisé · Films & musiques sur Cèlè One</p>
        </div>
      );

    case 'founder':
      return (
        <div className={cn(base, 'items-stretch bg-[linear-gradient(120deg,#eaf4f7,#d5e7ee)]')}>
          <div className="flex flex-1 flex-col justify-center p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-700">Héritage · Témoignage · Générations</p>
            <p className="mt-2 font-display text-3xl font-black leading-none text-night sm:text-[40px]">« Qui était Oshoffa ? »</p>
            <p className="mt-3 text-sm font-semibold text-night/70">Avant l'Église, il y avait un homme.</p>
            <p className="mt-4 font-display text-lg italic text-brand-700">Un héritage vivant pour le monde.</p>
          </div>
          <div className="relative hidden w-[38%] items-end justify-center bg-[linear-gradient(180deg,transparent,rgba(14,140,126,.18))] sm:flex">
            <div className="mb-0 h-[78%] w-[78%] rounded-t-full bg-[linear-gradient(180deg,#9bb7c0,#5d8793)] opacity-80" />
            <span className="absolute bottom-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-night">1909 · Porto-Novo</span>
          </div>
        </div>
      );

    case 'harvest':
      return (
        <div className={cn(base, 'flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_110%,#f6c94c,#5c9c3b_60%,#2e6b2a)] text-center text-white')}>
          <Wheat size={64} strokeWidth={1.4} className="mb-2 text-[#fde58a]" />
          <p className="font-display text-3xl font-black sm:text-4xl">Fête des moissons</p>
          <p className="mt-1 text-sm font-semibold text-white/85">Action de grâce · 2026</p>
          <span className="mt-4 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur">En direct sur Cèlè One TV</span>
        </div>
      );
  }
}

export function PosterGrid({ media, onOpen }: { media: PosterVariant[]; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={cn('grid w-full gap-1 overflow-hidden rounded-xl text-left', media.length > 1 ? 'grid-cols-2' : 'grid-cols-1')} aria-label="Agrandir le visuel">
      {media.map((v) => (
        <div key={v} className={cn('transition duration-300 hover:brightness-[1.03]', media.length > 1 ? 'aspect-[4/5]' : 'aspect-[16/11]')}>
          <Poster variant={v} />
        </div>
      ))}
    </button>
  );
}
