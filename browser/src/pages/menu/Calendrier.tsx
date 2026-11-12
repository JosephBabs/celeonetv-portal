import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarPlus, Check, Clock, Film, ListMusic, Music, Pause, Play, Plus, Podcast, Share2, Star, Trash2 } from 'lucide-react';
import { useWeeklyTheme } from '@/services/weeklyTheme';
import { useApp } from '@/store/app';
import { albums, fmtDuration, videos } from '@/data/streaming';
import { agenda } from '@/store/agenda';
import { menu, useMenu } from '@/store/menu';
import { player, usePlayer } from '@/store/library';
import { confirmDialog, openShare, toast } from '@/store/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Scene } from '@/components/feed/Scene';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { MenuShell, Pills } from './MenuShell';

const ymd = (d: Date) => d.toISOString().slice(0, 10);

const previousThemes = [
  { week: 39, title: 'La foi qui agit', refs: 'Jacques 2 : 14-26' },
  { week: 38, title: 'Marcher dans la lumière', refs: '1 Jean 1 : 5-10' },
  { week: 37, title: 'Le serviteur fidèle', refs: 'Matthieu 25 : 14-30' },
  { week: 36, title: 'La prière persévérante', refs: 'Luc 18 : 1-8' },
];

export function ThemeSemainePage() {
  const day = (new Date().getDay() + 6) % 7;
  const remote = useApp((s) => !!s.account?.remote);
  const { theme, loading } = useWeeklyTheme();
  if (loading) return <MenuShell><div className="skeleton h-56 rounded-3xl" /></MenuShell>;
  if (!theme) return <MenuShell><div className="card rounded-3xl"><EmptyState icon={BookOpen} title="Aucun thème publié pour le moment" text="Le thème de la semaine apparaîtra ici dès sa publication." /></div></MenuShell>;
  return (
    <MenuShell description={[theme.week && `Semaine ${theme.week}`, theme.period].filter(Boolean).join(' · ') || undefined} actions={<IconButton icon={Share2} label="Partager" onClick={() => openShare({ title: `Thème de la semaine : ${theme.title}`, url: '/menu/calendrier/theme-semaine' })} />}>
      <div className="mb-4 rounded-3xl bg-[linear-gradient(120deg,#0a6b60,#14a394)] p-6 text-white shadow-md">
        <p className="text-sm text-white/75">Thème de la semaine</p>
        <h2 className="font-display text-[34px] font-black leading-tight">{theme.title}</h2>
        {theme.readings.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{theme.readings.map((r) => <Link key={r.ref} to={r.to ?? '/bible'} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25"><BookOpen size={14} /> {r.ref}</Link>)}</div>}
      </div>
      {(theme.summary || theme.meditation.length > 0) && (
        <div className="card mb-4 rounded-3xl p-5">
          {theme.summary && <p className="mb-3 whitespace-pre-line text-ink-soft">{theme.summary}</p>}
          {theme.meditation.length > 0 && (
            <>
              <p className="eyebrow mb-2">Méditations quotidiennes</p>
              <ol className="space-y-1.5">{theme.meditation.map((m, i) => <li key={i} className={cn('rounded-xl px-3 py-2 text-sm', i === day ? 'bg-mint-100 font-semibold text-brand-900' : 'text-ink-soft')}>{m}</li>)}</ol>
            </>
          )}
        </div>
      )}
      {!remote && (
        <>
          <p className="mb-2 font-extrabold">Thèmes précédents</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{previousThemes.map((t) => <div key={t.week} className="card rounded-2xl p-4"><p className="text-xs text-ink-muted">Semaine {t.week}</p><p className="font-bold">{t.title}</p><p className="text-sm text-brand-700">{t.refs}</p></div>)}</div>
        </>
      )}
    </MenuShell>
  );
}

const feasts = [
  { name: 'Anniversaire de l’Église', month: 9, day: 29, text: 'Culte d’action de grâce dans toutes les paroisses.' },
  { name: 'Fête des moissons', month: 10, day: 15, text: 'Offrandes et chants d’action de grâce.' },
  { name: 'Noël', month: 12, day: 25, text: 'Veillée et culte de la Nativité.' },
  { name: 'Nouvel an — veillée', month: 12, day: 31, text: 'Veillée de passage à la nouvelle année.' },
  { name: 'Pâques', month: 4, day: 5, text: 'Célébration de la Résurrection (date de démonstration).' },
  { name: 'Pentecôte', month: 5, day: 24, text: 'Fête de l’Esprit Saint (date de démonstration).' },
];

function nextDate(month: number, day: number) {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day, 10);
  if (d < now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function JoursFetePage() {
  const list = feasts.map((f) => ({ ...f, date: nextDate(f.month, f.day) })).sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    <MenuShell description="Les grandes fêtes de l'année et le temps restant">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((f, i) => {
          const days = Math.ceil((f.date.getTime() - Date.now()) / 86400000);
          return (
            <div key={f.name} className={cn('card rounded-3xl p-5', i === 0 && 'ring-2 ring-gold-500')}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="flex items-center gap-1.5 font-extrabold"><Star size={15} className="text-gold-500" />{f.name}</p><p className="text-sm text-ink-muted">{f.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <span className="rounded-2xl bg-mint-100 px-3 py-2 text-center text-brand-800"><span className="block font-display text-2xl font-black leading-none">{days}</span><span className="text-[11px] font-semibold">jours</span></span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{f.text}</p>
              <Button size="sm" variant="soft" icon={CalendarPlus} className="mt-3" onClick={() => { agenda.add({ type: 'fete', title: f.name, date: ymd(f.date), time: '10:00', repeat: 'annuelle', notify: true }); toast('Fête ajoutée à votre agenda (chaque année)'); }}>Me le rappeler</Button>
            </div>
          );
        })}
      </div>
    </MenuShell>
  );
}

const weekly = [
  { day: 'Lundi', items: ['06:00 — Prière matinale', '19:00 — Répétition de chorale'] },
  { day: 'Mardi', items: ['06:00 — Prière matinale', '18:30 — École biblique'] },
  { day: 'Mercredi', items: ['06:00 — Prière matinale', '19:00 — Culte de miséricorde'] },
  { day: 'Jeudi', items: ['06:00 — Prière matinale', '18:00 — Réunion des jeunes'] },
  { day: 'Vendredi', items: ['06:00 — Prière matinale', '21:00 — Veillée de prière'] },
  { day: 'Samedi', items: ['09:00 — Travaux communautaires', '16:00 — Répétition générale'] },
  { day: 'Dimanche', items: ['10:00 — Culte dominical', '16:00 — Visite des malades'] },
];

export function ProgrammesHebdoPage() {
  const today = (new Date().getDay() + 6) % 7;
  return (
    <MenuShell description="Programme type d'une paroisse (démonstration)">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weekly.map((w, i) => (
          <div key={w.day} className={cn('card rounded-2xl p-4', i === today && 'ring-2 ring-brand-500')}>
            <p className="mb-2 flex items-center justify-between font-extrabold">{w.day}{i === today && <Chip>Aujourd'hui</Chip>}</p>
            {w.items.map((it) => <p key={it} className="flex items-start gap-2 py-1 text-sm text-ink-soft"><Clock size={14} className="mt-0.5 text-brand-600" />{it}</p>)}
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function ProgrammeQuotidienPage() {
  const today = weekly[(new Date().getDay() + 6) % 7];
  const [done, setDone] = useState<string[]>([]);
  const steps = ['05:30 — Lecture de la Parole', ...today.items, '21:30 — Prière du soir'];
  return (
    <MenuShell description={`${today.day} ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}>
      <div className="card rounded-3xl p-5">
        <ol className="relative space-y-4 border-l-2 border-mint-300 pl-6">
          {steps.map((s) => {
            const on = done.includes(s);
            return (
              <li key={s} className="relative">
                <button onClick={() => setDone((d) => (on ? d.filter((x) => x !== s) : [...d, s]))} aria-pressed={on} aria-label={`${on ? 'Décocher' : 'Cocher'} : ${s}`} className={cn('absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-mint-300 bg-surface')}>{on && <Check size={13} strokeWidth={3} />}</button>
                <p className={cn('font-semibold', on && 'text-ink-faint line-through')}>{s}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-sm text-ink-muted">{done.length}/{steps.length} moments accomplis aujourd'hui</p>
      </div>
    </MenuShell>
  );
}

/* ───────────── Media & Streaming ───────────── */

const allTracks = albums.flatMap((a) => a.tracks.map((t) => ({ ...t, artist: a.artist })));

export function PlaylistsPage() {
  const playlists = useMenu((s) => s.playlists);
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const [active, setActive] = useState(playlists[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const current = playlists.find((p) => p.id === active) ?? playlists[0];
  useEffect(() => { if (!current && playlists[0]) setActive(playlists[0].id); }, [current, playlists]);
  const play = (id: string) => {
    const t = allTracks.find((x) => x.id === id)!;
    if (track?.id === id) return player.toggle();
    player.play({ id, title: t.title, subtitle: t.artist, to: '/menu/media/playlists', duration: t.durationSec });
  };
  return (
    <MenuShell description="Composez vos playlists de louange" actions={<Button size="sm" icon={Plus} onClick={() => setCreating(true)}>Nouvelle</Button>}>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{playlists.map((p) => <button key={p.id} onClick={() => setActive(p.id)} className={cn('flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold', current?.id === p.id ? 'bg-brand-700 text-white' : 'bg-surface-sunken hover:bg-line')}><ListMusic size={15} />{p.name} <span className="opacity-70">{p.trackIds.length}</span></button>)}</div>
      {!current ? <div className="card rounded-3xl"><EmptyState icon={ListMusic} title="Aucune playlist" action={<Button onClick={() => setCreating(true)}>Créer une playlist</Button>} /></div> : (
        <div className="card rounded-3xl p-2">
          <div className="flex items-center gap-2 p-3">
            <p className="flex-1 font-extrabold">{current.name}</p>
            <Button size="sm" variant="soft" icon={Plus} onClick={() => setAdding(true)}>Ajouter</Button>
            <IconButton icon={Trash2} label="Supprimer la playlist" size="sm" onClick={async () => { if (await confirmDialog({ title: 'Supprimer cette playlist ?', confirmLabel: 'Supprimer', tone: 'danger' })) { menu.deletePlaylist(current.id); toast('Playlist supprimée'); } }} />
          </div>
          {current.trackIds.length === 0 && <p className="p-6 text-center text-sm text-ink-muted">Ajoutez des titres à cette playlist.</p>}
          {current.trackIds.map((id) => {
            const t = allTracks.find((x) => x.id === id);
            if (!t) return null;
            const on = track?.id === id && playing;
            return (
              <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-sunken">
                <IconButton icon={on ? Pause : Play} label={on ? 'Pause' : 'Lire'} size="sm" variant="soft" onClick={() => play(id)} />
                <span className="flex-1"><span className="block font-semibold">{t.title}</span><span className="block text-xs text-ink-muted">{t.artist}</span></span>
                <span className="text-sm text-ink-muted">{fmtDuration(t.durationSec)}</span>
                <IconButton icon={Trash2} label="Retirer" size="sm" variant="plain" onClick={() => menu.togglePlaylistTrack(current.id, id)} />
              </div>
            );
          })}
        </div>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle playlist" size="sm" footer={<Button disabled={!name.trim()} onClick={() => { const p = menu.createPlaylist(name.trim()); setActive(p.id); setName(''); setCreating(false); toast('Playlist créée'); }}>Créer</Button>}>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la playlist" className="field" />
      </Modal>
      {current && (
        <Modal open={adding} onClose={() => setAdding(false)} title={`Ajouter à « ${current.name} »`} size="sm">
          <div className="max-h-[55vh] overflow-y-auto">
            {allTracks.map((t) => {
              const inList = current.trackIds.includes(t.id);
              return <button key={t.id} onClick={() => menu.togglePlaylistTrack(current.id, t.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-sunken"><Music size={16} className="text-brand-600" /><span className="flex-1 text-sm"><b>{t.title}</b> · {t.artist}</span>{inList && <Check size={16} className="text-brand-700" />}</button>;
            })}
          </div>
        </Modal>
      )}
    </MenuShell>
  );
}

export function FilmsPage() {
  const list = videos.filter((v) => v.kind === 'film' || v.kind === 'clip');
  const [tab, setTab] = useState<'tous' | 'film' | 'clip'>('tous');
  return (
    <MenuShell description="Films et clips chrétiens">
      <Pills value={tab} onChange={setTab} options={[{ id: 'tous', label: 'Tous' }, { id: 'film', label: 'Films' }, { id: 'clip', label: 'Clips' }]} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.filter((v) => tab === 'tous' || v.kind === tab).map((v) => (
          <Link key={v.id} to={`/streaming/live/${v.id}`} className="card card-hover overflow-hidden rounded-3xl">
            <div className="relative aspect-video"><Scene variant={v.scene} playing={false} /><span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 text-xs font-semibold text-white">{fmtDuration(v.durationSec)}</span><Film size={18} className="absolute left-3 top-3 text-white drop-shadow" /></div>
            <div className="p-4"><p className="font-bold">{v.title}</p><p className="text-xs text-ink-muted">{v.category}</p></div>
          </Link>
        ))}
      </div>
    </MenuShell>
  );
}

export function PodcastsPage() {
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const list = videos.filter((v) => v.kind === 'podcast').concat([
    { id: 'p-jeunes', channelId: 'jeunesse-tv', title: 'Parole aux jeunes — épisode 7', kind: 'podcast', category: 'Jeunesse', scene: 'youth', views: 430, durationSec: 1260, publishedAt: new Date().toISOString(), description: 'Échanges entre jeunes de plusieurs paroisses.' },
  ]);
  return (
    <MenuShell description="Écoutez dans le mini-lecteur en continuant à naviguer">
      <div className="space-y-2">
        {list.map((p) => {
          const on = track?.id === p.id && playing;
          return (
            <div key={p.id} className="card flex items-center gap-4 rounded-2xl p-3">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"><Scene variant={p.scene} playing={on} /></span>
              <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 truncate font-bold"><Podcast size={15} className="shrink-0 text-brand-600" />{p.title}</p><p className="truncate text-xs text-ink-muted">{p.description} · {fmtDuration(p.durationSec)}</p></div>
              <IconButton icon={on ? Pause : Play} label={on ? 'Pause' : 'Écouter'} variant="primary" onClick={() => (track?.id === p.id ? player.toggle() : player.play({ id: p.id, title: p.title, subtitle: 'Podcast Cèlè One', to: '/menu/media/podcasts', duration: p.durationSec }))} />
            </div>
          );
        })}
      </div>
    </MenuShell>
  );
}
