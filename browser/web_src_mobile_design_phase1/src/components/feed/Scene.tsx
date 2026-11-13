import { useEffect, useRef, useState } from 'react';
import { Cake, Drum, Flame, Maximize2, Mic2, Music2, Pause, Play, Sun, Volume2, VolumeX, Waves, Sparkles } from 'lucide-react';
import type { SceneVariant } from '@/data/types';
import { cn } from '@/lib/utils';

const scenes: Record<SceneVariant, { bg: string; icon: typeof Sun; label: string }> = {
  choir: { bg: 'linear-gradient(160deg,#1e3a8a,#1D8A8F 70%,#facc15)', icon: Music2, label: 'Chorale' },
  sunrise: { bg: 'linear-gradient(180deg,#ffb26b 0%,#f2706b 45%,#4b3f72 100%)', icon: Sun, label: 'Lever du jour' },
  drums: { bg: 'linear-gradient(150deg,#1d4ed8,#facc15 65%,#1d4ed8)', icon: Drum, label: 'Tambours' },
  prayer: { bg: 'linear-gradient(170deg,#c7d2fe,#e0f2fe 40%,#94a3b8)', icon: Mic2, label: 'Louange' },
  beach: { bg: 'linear-gradient(180deg,#7dd3fc,#38bdf8 45%,#fde68a 46%,#fcd34d)', icon: Waves, label: 'Plage' },
  youth: { bg: 'linear-gradient(160deg,#0f1b2d,#312e81 60%,#7c3aed)', icon: Sparkles, label: 'Jeunesse' },
  candles: { bg: 'radial-gradient(circle at 50% 70%,#fbbf24 0%,#92400e 30%,#1c1917 70%)', icon: Flame, label: 'Veillée' },
  birthday: { bg: 'linear-gradient(160deg,#3b0764,#6d28d9 55%,#f59e0b)', icon: Cake, label: 'Anniversaire' },
};

/** Visuel animé tenant lieu de vidéo dans la démo. */
export function Scene({ variant, playing = true, className, caption }: { variant: SceneVariant; playing?: boolean; className?: string; caption?: string }) {
  const s = scenes[variant];
  return (
    <div className={cn('relative isolate h-full w-full overflow-hidden', className)} style={{ background: s.bg }}>
      <div className={cn('absolute inset-[-20%] opacity-40 mix-blend-overlay', playing && 'animate-[spin_24s_linear_infinite]')} style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,.6), transparent 30%)' }} />
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={cn('absolute rounded-full bg-white/50', playing && 'animate-float')}
          style={{ width: 4 + (i % 4) * 3, height: 4 + (i % 4) * 3, left: `${(i * 23) % 95}%`, top: `${(i * 37) % 90}%`, animationDelay: `${-i}s`, opacity: 0.25 + (i % 3) * 0.15 }}
        />
      ))}
      <s.icon className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 text-white/85 drop-shadow-lg" strokeWidth={1.3} />
      {caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-sm font-semibold text-white">{caption}</p>}
    </div>
  );
}

export const sceneLabels = Object.fromEntries(Object.entries(scenes).map(([k, v]) => [k, v.label])) as Record<SceneVariant, string>;

/** Lecteur vidéo simulé : lecture/pause, son, plein écran et progression. */
export function VideoFrame({ scene, className, onExpand, duration = 42 }: { scene: SceneVariant; className?: string; onExpand?: () => void; duration?: number }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number>();

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => setProgress((p) => (p >= 1 ? 0 : p + 1 / (duration * 4))), 250);
    return () => window.clearInterval(timer.current);
  }, [playing, duration]);

  const elapsed = Math.round(progress * duration);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={cn('group relative aspect-[4/3] overflow-hidden rounded-xl bg-night', className)}>
      <button type="button" onClick={() => setPlaying((p) => !p)} className="absolute inset-0" aria-label={playing ? 'Mettre en pause' : 'Lire la vidéo'}>
        <Scene variant={scene} playing={playing} />
      </button>
      {!playing && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
          <Play size={28} className="ml-1 fill-white" />
        </span>
      )}
      <div className={cn('absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2.5 pt-10 text-white transition', playing && 'sm:opacity-0 sm:group-hover:opacity-100')}>
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'} className="rounded-full p-1.5 hover:bg-white/15">
          {playing ? <Pause size={17} className="fill-white" /> : <Play size={17} className="fill-white" />}
        </button>
        <span className="text-xs tabular-nums">{fmt(elapsed)} / {fmt(duration)}</span>
        <div className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60">
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label="Plein écran" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60">
            <Maximize2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
