import { Link } from 'react-router-dom';
import { Music2, Pause, Play, X } from 'lucide-react';
import { player, usePlayer } from '@/store/library';
import { cn } from '@/lib/utils';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Mini-lecteur persistant : reste visible pendant la navigation. */
export function MiniPlayer({ withBottomNav }: { withBottomNav: boolean }) {
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const position = usePlayer((s) => s.position);
  if (!track) return null;
  const progress = position / track.duration;
  return (
    <div className={cn('fixed inset-x-3 z-40 animate-slide-up md:inset-x-auto md:left-1/2 md:w-[440px] md:-translate-x-1/2', withBottomNav ? 'bottom-[76px] md:bottom-5' : 'bottom-4 md:bottom-5')}>
      <div className="overflow-hidden rounded-2xl bg-night text-white shadow-lg ring-1 ring-white/10">
        <div className="flex items-center gap-3 p-2.5 pr-3">
          <Link to={track.to} className="flex min-w-0 flex-1 items-center gap-3">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600', playing && 'animate-pulse')}>
              <Music2 size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{track.title}</span>
              <span className="block truncate text-xs text-white/60">{track.subtitle} · {fmt(position)} / {fmt(track.duration)}</span>
            </span>
          </Link>
          <button onClick={player.toggle} aria-label={playing ? 'Pause' : 'Lecture'} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-night transition hover:scale-105">
            {playing ? <Pause size={18} className="fill-night" /> : <Play size={18} className="ml-0.5 fill-night" />}
          </button>
          <button onClick={player.close} aria-label="Fermer le lecteur" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={track.duration}
          value={position}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Progression"
          className="block h-1 w-full cursor-pointer appearance-none bg-white/15 accent-mint-300"
          style={{ background: `linear-gradient(90deg, rgb(var(--brand-400)) ${progress * 100}%, rgb(255 255 255 / .15) ${progress * 100}%)` }}
        />
      </div>
    </div>
  );
}
