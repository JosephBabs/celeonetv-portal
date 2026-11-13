import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, Pause, Play, Radio, Share2, Volume1, Volume2, VolumeX } from 'lucide-react';
import { radioStations } from '@/data/streaming';
import { media, useMedia } from '@/store/media';
import { player, usePlayer } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { Popover } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

export function RadioPage() {
  const navigate = useNavigate();
  const stationId = useMedia((s) => s.radioStation);
  const volume = useMedia((s) => s.radioVolume);
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const [chooser, setChooser] = useState(false);
  const station = radioStations.find((s) => s.id === stationId) ?? radioStations[0];
  const trackId = `radio-${station.id}`;
  const isPlaying = track?.id === trackId && playing;

  const toggle = () => {
    if (!station.online) return;
    if (track?.id === trackId) return player.toggle();
    player.play({ id: trackId, title: station.name, subtitle: `En direct · ${station.frequency}`, to: '/radio', duration: 3600 });
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="relative flex min-h-[calc(100dvh-var(--header-h))] flex-col bg-surface">
      <div className="flex items-center justify-between p-4">
        <IconButton icon={ChevronLeft} label="Retour" shape="square" onClick={() => navigate(-1)} />
        <IconButton icon={volume === 0 ? VolumeX : Volume2} label={volume === 0 ? 'Rétablir le son' : 'Couper le son'} shape="square" onClick={() => media.set({ radioVolume: volume === 0 ? 70 : 0 })} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="relative">
          {isPlaying && <span className="absolute inset-[-18px] animate-ping rounded-full bg-brand-200/40" />}
          <div className={cn('relative flex h-60 w-60 items-center justify-center rounded-full bg-surface-sunken shadow-lg ring-8 ring-white sm:h-72 sm:w-72', isPlaying && 'animate-[spin_30s_linear_infinite]')}>
            <img src={`${import.meta.env.BASE_URL}logo-celeone.svg`} alt="" className="h-[82%] w-[82%]" />
          </div>
        </div>
        <h1 className="mt-8 text-[30px] font-black">{station.name}</h1>
        <p className="mt-1 flex items-center gap-2 text-lg text-ink-muted">
          {station.frequency} •
          <span className={cn('inline-flex items-center gap-1.5 font-semibold', station.online ? 'text-brand-700' : 'text-danger-700')}>
            <span className={cn('h-2 w-2 rounded-full', station.online ? 'bg-brand-500' : 'bg-danger')} />
            {station.online ? 'Online' : 'Offline'}
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-faint">{station.online ? `En ce moment : ${station.program}` : 'Le flux de cette station est momentanément interrompu.'}</p>

        <div className="mt-8 flex items-center gap-6">
          <Popover align="left" className="w-56 p-4" trigger={({ toggle: t }) => <IconButton icon={VolumeIcon} label="Volume" size="lg" className="h-14 w-14" onClick={t} />}>
            <div>
              <p className="mb-2 text-sm font-semibold">Volume · {volume} %</p>
              <input type="range" min={0} max={100} value={volume} onChange={(e) => media.set({ radioVolume: Number(e.target.value) })} className="w-full accent-brand-600" aria-label="Volume" />
            </div>
          </Popover>
          <button onClick={toggle} disabled={!station.online} aria-label={isPlaying ? 'Pause' : 'Écouter'} className="flex h-24 w-24 items-center justify-center rounded-full bg-night text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40">
            {isPlaying ? <Pause size={36} className="fill-white" /> : <Play size={36} className="ml-1.5 fill-white" />}
          </button>
          <IconButton icon={Radio} label="Choisir la station" size="lg" className="h-14 w-14" onClick={() => setChooser(true)} />
        </div>
        <button onClick={() => openShare({ title: `Écoutez ${station.name} (${station.frequency}) sur Cèlè One`, url: '/radio' })} className="mt-8 inline-flex items-center gap-2 rounded-full bg-surface-sunken px-5 py-2.5 text-sm font-semibold hover:bg-line">
          <Share2 size={16} /> Partager la radio
        </button>
      </div>
      <Modal open={chooser} onClose={() => setChooser(false)} title="Stations" description="Choisissez la station à écouter" size="sm">
        <div className="space-y-1.5">
          {radioStations.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                media.set({ radioStation: s.id });
                setChooser(false);
                if (track?.id.startsWith('radio-')) player.close();
                toast(s.online ? `${s.name} sélectionnée` : `${s.name} est hors ligne`, { tone: s.online ? 'success' : 'danger' });
              }}
              className={cn('flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left', station.id === s.id ? 'bg-mint-100' : 'hover:bg-surface-sunken')}
            >
              <span className={cn('h-2.5 w-2.5 rounded-full', s.online ? 'bg-brand-500' : 'bg-danger')} />
              <span className="flex-1">
                <span className="block font-bold">{s.name}</span>
                <span className="block text-xs text-ink-muted">{s.frequency} · {s.city} · {s.online ? 'Online' : 'Offline'}</span>
              </span>
              {station.id === s.id && <Check size={18} className="text-brand-700" />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
