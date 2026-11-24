import { useRef, useState } from 'react';
import { Check, Clapperboard, Globe, ImagePlus, Music, Type, Users, Video, X } from 'lucide-react';
import { backgroundMusic, textBackgrounds } from '@/data/social';
import type { Audience, SceneVariant } from '@/data/types';
import { accountName, actions, useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { compressImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Overlay';
import { Button, IconButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Scene, sceneLabels } from '@/components/feed/Scene';
import { publishPost } from '@/services/publish';
import { ApiError } from '@/lib/api';

export type ComposerKind = 'publication' | 'cele-vibe' | 'statut';
type MediaType = 'texte' | 'photos' | 'video' | 'cele-vibe';

const sceneChoices: SceneVariant[] = ['choir', 'sunrise', 'drums', 'prayer', 'beach', 'youth', 'candles', 'birthday'];

function Pill({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Type; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition', active ? 'border-night bg-night text-white' : 'border-line bg-surface text-ink-soft hover:border-line-strong')}>
      <Icon size={15} /> {children}
    </button>
  );
}

function AudiencePicker({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="rounded-2xl border border-line bg-mint-50 p-3">
      <p className="mb-2 text-[13px] font-semibold">Audience</p>
      <div className="grid grid-cols-2 gap-2">
        {([['public', 'Public', Globe], ['amis', 'Amis', Users]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={value === id} className={cn('flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition', value === id ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-surface text-brand-700 hover:bg-mint-100')}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BackgroundPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {textBackgrounds.map((b) => (
        <button key={b.id} type="button" onClick={() => onChange(b.id)} aria-label={`Fond ${b.label}`} title={b.label} className={cn('h-9 w-9 shrink-0 rounded-full ring-offset-2 transition', value === b.id && 'ring-2 ring-brand-600')} style={{ background: b.css }} />
      ))}
    </div>
  );
}

function ScenePicker({ value, onChange }: { value: SceneVariant | null; onChange: (s: SceneVariant) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs text-ink-muted">Pour la démo, choisissez une séquence d’exemple (aucune vidéo n’est envoyée) :</p>
      <div className="grid grid-cols-4 gap-2">
        {sceneChoices.map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)} className={cn('relative aspect-[9/14] overflow-hidden rounded-xl ring-offset-2 transition', value === s && 'ring-2 ring-brand-600')}>
            <Scene variant={s} playing={value === s} />
            <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[10.5px] font-semibold text-white">{sceneLabels[s]}</span>
            {value === s && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={12} strokeWidth={3} /></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ComposerModal({ kind, onClose, initialSchedule, initialPhotos }: { kind: ComposerKind; onClose: () => void; initialSchedule?: boolean; initialPhotos?: boolean }) {
  const account = useApp((s) => s.account);
  const [text, setText] = useState('');
  const [type, setType] = useState<MediaType>(kind === 'cele-vibe' ? 'cele-vibe' : initialPhotos ? 'photos' : 'texte');
  const [audience, setAudience] = useState<Audience>('public');
  const [schedule, setSchedule] = useState(!!initialSchedule);
  const [scheduledFor, setScheduledFor] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [useBg, setUseBg] = useState(kind !== 'cele-vibe');
  const [bg, setBg] = useState('menthe');
  const [images, setImages] = useState<string[]>([]);
  const [scene, setScene] = useState<SceneVariant | null>(null);
  const [music, setMusic] = useState<string | null>(kind === 'statut' ? backgroundMusic[0] : null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  // Compte réel (publication classique) : vraie publication sur le serveur, avec une vraie vidéo.
  const real = !!account?.remote && kind === 'publication';
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  if (!account) return null;
  const titles: Record<ComposerKind, string> = { publication: 'Créer une publication', 'cele-vibe': 'Publier un Cele Vibe', statut: 'Créer un statut' };
  const submitLabel = kind === 'statut' ? 'Partager en story' : schedule ? 'Programmer' : 'Publier';
  const textMode = type === 'texte';
  const bgCss = textBackgrounds.find((b) => b.id === bg)?.css;

  const canSubmit = real
    ? type === 'photos' ? images.length > 0 : type === 'video' ? !!videoFile : text.trim().length > 0
    : kind === 'cele-vibe' ? !!scene : type === 'photos' ? images.length > 0 : type === 'video' || type === 'cele-vibe' ? !!scene : text.trim().length > 0;

  const pickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const list = await Promise.all([...files].slice(0, 4 - images.length).map((f) => compressImage(f)));
      setImages((prev) => [...prev, ...list].slice(0, 4));
      setType('photos');
    } catch (e) {
      toast((e as Error).message, { tone: 'danger' });
    }
  };

  const submit = async () => {
    if (real) {
      setLoading(true);
      try {
        await publishPost({
          text: text.trim(),
          audience: audience === 'amis' ? 'friends' : 'public',
          images: type === 'photos' ? images : [],
          video: type === 'video' ? videoFile ?? undefined : undefined,
          onProgress: setProgress,
        });
        toast('Publication partagée sur le fil');
        onClose();
      } catch (e) {
        toast(e instanceof ApiError || e instanceof Error ? e.message : 'Publication impossible pour le moment.', { tone: 'danger' });
      } finally {
        setLoading(false);
        setProgress('');
      }
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    if (kind === 'statut') {
      actions.addStatus({ text: text.trim() || undefined, background: textMode && useBg ? bg : undefined, image: images[0], scene: scene ?? undefined, music: music ?? undefined });
      toast('Votre statut est en ligne pour 24 h');
    } else if (kind === 'cele-vibe' || type === 'cele-vibe') {
      actions.createVibe({ caption: text.trim() || 'Nouveau Cele Vibe', scene: scene!, audience });
      toast('Cele Vibe publié 🎬');
    } else {
      actions.createPost({
        body: text.trim(),
        audience,
        background: textMode && useBg && text.trim().length <= 160 ? bg : undefined,
        images: images.length ? images : undefined,
        scene: type === 'video' ? scene ?? undefined : undefined,
        scheduledFor: schedule ? new Date(scheduledFor).toISOString() : undefined,
      });
      toast(schedule ? 'Publication programmée' : 'Publication partagée sur le fil');
    }
    setLoading(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="md" hideClose className="sm:max-w-xl">
      <div className="-mx-6 -mt-2 mb-4 flex items-center gap-3 border-b border-line px-6 pb-3">
        <IconButton icon={X} label="Fermer" shape="square" onClick={onClose} />
        <h2 className="flex-1 text-center text-[17px] font-extrabold">{titles[kind]}</h2>
        <Button size="sm" className="h-9 rounded-xl px-4" disabled={!canSubmit} loading={loading} loadingText={progress || undefined} onClick={submit}>
          {submitLabel}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="md" />
          <p className="font-bold">{accountName(account)}</p>
        </div>

        {kind !== 'statut' && !real && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Programmer la publication</span>
            <Toggle checked={schedule} onChange={setSchedule} label="Programmer la publication" />
          </div>
        )}
        {schedule && kind !== 'statut' && (
          <input type="datetime-local" value={scheduledFor} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setScheduledFor(e.target.value)} className="field" aria-label="Date de publication" />
        )}

        {kind !== 'cele-vibe' && (
          <div className="flex flex-wrap gap-2">
            <Pill active={type === 'texte'} onClick={() => setType('texte')} icon={Type}>Texte</Pill>
            <Pill active={type === 'photos'} onClick={() => (images.length ? setType('photos') : fileRef.current?.click())} icon={ImagePlus}>Photos</Pill>
            <Pill active={type === 'video'} onClick={() => setType('video')} icon={Video}>Vidéo</Pill>
            {kind === 'publication' && !real && <Pill active={type === 'cele-vibe'} onClick={() => setType('cele-vibe')} icon={Clapperboard}>Cele Vibe</Pill>}
          </div>
        )}

        {kind === 'statut' && (
          <div className="rounded-2xl border border-line bg-mint-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><Music size={15} className="text-brand-600" /> Musique de fond</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button type="button" onClick={() => setMusic(null)} className={cn('h-8 shrink-0 rounded-full border px-3 text-xs font-semibold', !music ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-surface')}>Aucune</button>
              {backgroundMusic.map((m) => (
                <button key={m} type="button" onClick={() => setMusic(m)} className={cn('h-8 shrink-0 rounded-full border px-3 text-xs font-semibold', music === m ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-surface')}>
                  ♪ {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind !== 'statut' && <AudiencePicker value={audience} onChange={setAudience} />}

        {textMode && !real && (
          <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
            <span className="text-sm font-medium">Utiliser un fond</span>
            <Toggle checked={useBg} onChange={setUseBg} label="Utiliser un fond" />
          </div>
        )}

        {textMode && useBg && !real ? (
          <div className="space-y-2">
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl p-6 shadow-sm" style={{ background: bgCss }}>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 160))}
                rows={4}
                placeholder="Partagez une pensée, un témoignage, une annonce…"
                className="w-full resize-none bg-transparent text-center font-display text-2xl font-extrabold text-white outline-none placeholder:text-white/70"
              />
            </div>
            <div className="flex items-center justify-between">
              <BackgroundPicker value={bg} onChange={setBg} />
              <span className="text-xs text-ink-faint">{text.length}/160</span>
            </div>
          </div>
        ) : (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={kind === 'cele-vibe' || type === 'cele-vibe' ? 'Ajoutez une légende à votre Cele Vibe…' : 'Partagez une pensée, un témoignage, une annonce, une photo ou un Cele Vibe…'}
            className="field h-auto resize-none rounded-2xl py-3"
          />
        )}

        {type === 'photos' && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Retirer la photo" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                  <X size={13} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs font-semibold text-ink-muted hover:border-brand-300 hover:text-brand-700">
                <ImagePlus size={20} /> Ajouter
              </button>
            )}
          </div>
        )}

        {real && type === 'video' && (
          <div className="space-y-3">
            {videoPreview ? (
              <div className="relative overflow-hidden rounded-2xl bg-night">
                <video src={videoPreview} controls playsInline className="max-h-80 w-full" />
                <button type="button" aria-label="Retirer la vidéo" onClick={() => { URL.revokeObjectURL(videoPreview); setVideoPreview(''); setVideoFile(null); }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"><X size={15} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => videoRef.current?.click()} className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-ink-muted hover:border-brand-300 hover:text-brand-700">
                <Video size={22} /> Choisir une vidéo sur l'appareil
              </button>
            )}
            {videoFile && <p className="text-xs text-ink-muted">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo</p>}
          </div>
        )}

        {!real && (type === 'video' || type === 'cele-vibe' || kind === 'cele-vibe') && (
          <div className="space-y-3">
            <button type="button" onClick={() => videoRef.current?.click()} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold shadow-xs hover:bg-surface-sunken">
              <Video size={18} className="text-brand-600" /> Ajouter une vidéo depuis l'appareil
            </button>
            <ScenePicker value={scene} onChange={setScene} />
          </div>
        )}

      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { pickImages(e.target.files); e.target.value = ''; }} />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && real) {
            // Vidéo réelle : 200 Mo au plus.
            if (f.size > 200 * 1024 * 1024) toast('Vidéo trop lourde (200 Mo au maximum).', { tone: 'danger' });
            else {
              if (videoPreview) URL.revokeObjectURL(videoPreview);
              setVideoFile(f);
              setVideoPreview(URL.createObjectURL(f));
              setType('video');
            }
          } else if (f) {
            setScene(scene ?? sceneChoices[Math.floor(Math.random() * sceneChoices.length)]);
            toast(`« ${f.name} » sélectionnée — aperçu de démonstration utilisé`);
          }
          e.target.value = '';
        }}
      />
    </Modal>
  );
}
