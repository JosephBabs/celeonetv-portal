import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Bell, BellRing, Bookmark, ChevronDown, ChevronLeft, Clapperboard, Compass, Download, Eye, History, House, ListMusic, Maximize2, MessageCircle,
  Monitor, Music, Pause, Play, RotateCcw, RotateCw, Send, Settings, Share2, Sparkles, Star, ThumbsUp, TriangleAlert, UserRound, Volume2, VolumeX, X, ArrowRight,
} from 'lucide-react';
import { fmtDuration, streamCategories, type Channel, type Video } from '@/data/streaming';
import { albumSrc, ensureStreaming, isRemoteChannel, isRemoteVideo, officialChannel, useStreaming } from '@/services/streaming';
import { MediaPlayer, VideoCover, isFile } from '@/components/MediaPlayer';
import { getMember } from '@/data/members';
import { media, useMedia } from '@/store/media';
import { player, usePlayer } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { Scene } from '@/components/feed/Scene';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { MemberAvatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { Popover } from '@/components/ui/Popover';
import { Toggle } from '@/components/ui/Toggle';
import { cn, compactNumber, sleep, timeAgo } from '@/lib/utils';

type Tab = 'accueil' | 'explorer' | 'musique' | 'ma-liste' | 'moi';

const tabs: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'accueil', label: 'Accueil', icon: House },
  { id: 'explorer', label: 'Explorer', icon: Compass },
  { id: 'musique', label: 'Musique', icon: Music },
  { id: 'ma-liste', label: 'Ma liste', icon: Bookmark },
  { id: 'moi', label: 'Moi', icon: UserRound },
];

/** Avatar de chaîne : logo réel si fourni, sinon scène illustrée. */
function ChannelAvatar({ c, className }: { c: Channel; className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden rounded-full bg-white', className)}>
      {isRemoteChannel(c) ? (c.avatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center ring-1 ring-line"><LogoMark className="h-3/4 w-3/4" /></span>) : <Scene variant={c.scene} playing={false} />}
    </span>
  );
}

function VideoThumb({ v, compact }: { v: Video; compact?: boolean }) {
  const { getChannel } = useStreaming();
  const ch = getChannel(v.channelId);

  return (
    <Link to={`/streaming/live/${v.id}`} className={cn('group flex gap-3', !compact && 'flex-col')}>
      <span className={cn('relative block shrink-0 overflow-hidden rounded-xl', compact ? 'aspect-video w-40' : 'aspect-video w-full')}>
        {isRemoteVideo(v) ? <VideoCover image={v.thumbnail} sources={v.sources} logoClass={compact ? 'h-10 w-10' : 'h-14 w-14'} className="transition duration-300 group-hover:scale-105" /> : <Scene variant={v.scene} playing={false} className="transition duration-300 group-hover:scale-105" />}
        {v.live ? <span className="absolute left-2 top-2 rounded bg-danger px-1.5 py-0.5 text-[10px] font-black text-white">EN DIRECT</span> : v.durationSec > 0 && <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">{fmtDuration(v.durationSec)}</span>}
      </span>
      <span className="min-w-0">
        <span className={cn('line-clamp-2 font-bold leading-snug text-ink', compact ? 'text-[13.5px]' : 'text-[15px]')}>{v.title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">{ch?.name}</span>
        <span className="block text-xs text-ink-muted">{[v.views > 0 && `${compactNumber(v.views)} vues`, v.live ? 'En direct' : timeAgo(v.publishedAt)].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  );
}

function CreatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const request = useMedia((s) => s.creatorRequest);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Musique');
  const [loading, setLoading] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Devenir créateur" description="Demandez l'accès pour publier des vidéos, chansons, albums ou films sur Cèlè One." size="sm"
      footer={request ? <Button onClick={onClose}>Fermer</Button> : (
        <Button loading={loading} loadingText="Envoi…" disabled={name.trim().length < 2} onClick={async () => { setLoading(true); await sleep(800); media.requestCreator(name.trim(), kind); setLoading(false); toast('Demande envoyée à l’administration'); }}>
          Envoyer la demande
        </Button>
      )}
    >
      {request ? (
        <div className="rounded-2xl bg-mint-100 p-4 text-sm text-brand-900">
          Demande « {request.name} » ({request.kind}) envoyée — statut : <b>{request.status}</b>. Vous serez notifié dès sa validation.
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Nom de créateur ou de groupe</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Ex. Chorale Béthel" />
          </label>
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold">Type de contenu</span>
            <div className="flex flex-wrap gap-2">
              {['Musique', 'Films', 'Vidéos', 'Podcasts'].map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} className={cn('h-9 rounded-full border px-4 text-sm font-semibold', kind === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{k}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

const chatSeed = ['Amen 🙏', 'Bonsoir depuis Cotonou !', 'Alléluia', 'Que Dieu vous bénisse', 'Merci pour la retransmission', '🔥🔥🔥'];

function LiveChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ id: number; who: string; text: string }[]>([]);
  const [text, setText] = useState('');
  useEffect(() => {
    const t = window.setInterval(() => {
      const who = ['grace', 'joel', 'rachel', 'ruth', 'samuel', 'fiacre'][Math.floor(Math.random() * 6)];
      setMessages((m) => [...m.slice(-30), { id: Date.now(), who, text: chatSeed[Math.floor(Math.random() * chatSeed.length)] }]);
    }, 2200);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="card flex h-[520px] flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-extrabold">Chat en direct</p>
        <IconButton icon={X} label="Fermer le chat" size="sm" onClick={onClose} />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <p key={m.id} className="flex animate-fade-in items-start gap-2 text-sm">
            {m.who === 'me' ? <span className="h-7 w-7 shrink-0 rounded-full bg-brand-600" /> : <MemberAvatar memberId={m.who} size="xs" />}
            <span><b className="mr-1">{m.who === 'me' ? 'Vous' : getMember(m.who).name.split(' ')[0]}</b>{m.text}</span>
          </p>
        ))}
      </div>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setMessages((m) => [...m, { id: Date.now(), who: 'me', text: text.trim() }]); setText(''); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire dans le chat…" className="field h-10 rounded-full" />
        <IconButton icon={Send} label="Envoyer" variant="primary" type="submit" />
      </form>
    </div>
  );
}

function WatchView({ video }: { video: Video }) {
  const navigate = useNavigate();
  const { getChannel, videos } = useStreaming();
  const ch: Channel = getChannel(video.channelId) ?? { id: video.channelId, name: 'Cèlè One', description: '', subscribers: 0, live: false, scene: video.scene };
  const real = isRemoteVideo(video);
  const subscribed = useMedia((s) => s.subscriptions.includes(ch.id));
  const liked = useMedia((s) => s.liked.includes(video.id));
  const fav = useMedia((s) => s.favorites.includes(video.id));
  const inList = useMedia((s) => s.myList.includes(video.id));
  const downloaded = useMedia((s) => s.downloads.includes(video.id));
  const quality = useMedia((s) => s.quality);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [theater, setTheater] = useState(false);
  const [chat, setChat] = useState(false);
  const [creator, setCreator] = useState(false);
  const [failures, setFailures] = useState(!real && video.channelId === 'c1-international' ? 1 : 0);
  const [retrying, setRetrying] = useState(false);
  const [progress, setProgress] = useState(0);
  const unavailable = failures > 0;

  useEffect(() => {
    media.watch(video.id);
    setPlaying(false);
    setProgress(0);
    setFailures(!real && video.channelId === 'c1-international' ? 1 : 0);
  }, [video.id, video.channelId, real]);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setProgress((p) => Math.min(1, p + 1 / video.durationSec)), 1000);
    return () => window.clearInterval(t);
  }, [playing, video.durationSec]);

  const actions = [
    { icon: ThumbsUp, label: 'J’aime', on: liked, run: () => toast(media.toggle('liked', video.id) ? 'Vous aimez cette vidéo' : 'Mention retirée') },
    { icon: Star, label: 'Favoris', on: fav, run: () => toast(media.toggle('favorites', video.id) ? 'Ajoutée aux favoris' : 'Retirée des favoris') },
    { icon: Share2, label: 'Partager', on: false, run: () => openShare({ title: video.title, url: video.live ? `/live/${video.id.replace(/^api-live-/, '').replace(/^api-/, '')}` : `/videos/${video.id.replace(/^api-/, '')}` }) },
    { icon: Download, label: 'Télécharger', on: downloaded, run: () => {
      // Vidéo réelle : seul un fichier (pas un direct ni une vidéo YouTube) peut être téléchargé.
      if (real) return !video.live && video.sources.some(isFile) ? void window.open(video.sources.find(isFile), '_blank', 'noopener') : toast('Le téléchargement n’est pas disponible pour cette vidéo');
      if (downloaded) return toast('Déjà téléchargée — disponible dans « Moi »'); toast('Téléchargement lancé…'); window.setTimeout(() => { media.toggle('downloads', video.id); toast('Vidéo disponible hors connexion'); }, 1400); } },
    { icon: Bookmark, label: 'Ma liste', on: inList, run: () => toast(media.toggle('myList', video.id) ? 'Ajoutée à Ma liste' : 'Retirée de Ma liste') },
  ];
  const suggestions = videos.filter((v) => v.id !== video.id).slice(0, 20);

  return (
    <div className={cn('mx-auto grid max-w-[1400px] gap-6 px-0 sm:px-4 lg:py-4', !theater && 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
      <div className="min-w-0">
        <div className={cn('relative overflow-hidden bg-night sm:rounded-2xl', theater ? 'aspect-[21/9]' : 'aspect-video')}>
          {real ? (
            video.src ? (
              <MediaPlayer key={video.id} sources={video.sources} poster={video.thumbnail} live={video.live} title={video.title} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><TriangleAlert size={30} /></span>
                <p className="text-xl font-black">Lecture indisponible</p>
                <p className="text-sm text-white/70">{video.live ? 'Le direct n’a pas encore commencé.' : 'Cette vidéo n’est pas encore disponible.'}</p>
              </div>
            )
          ) : unavailable ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/25 text-white"><TriangleAlert size={30} /></span>
              <p className="text-xl font-black">Lecture indisponible</p>
              <p className="text-sm text-white/70">La lecture en direct est indisponible pour le moment.</p>
              <Button loading={retrying} loadingText="Connexion…" icon={RotateCcw} onClick={async () => { setRetrying(true); await sleep(1300); setRetrying(false); setFailures((f) => f - 1); if (failures - 1 > 0) toast('Toujours indisponible', { tone: 'danger' }); else toast('Flux rétabli'); }}>Réessayer</Button>
            </div>
          ) : (
            <>
              <button className="absolute inset-0" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'}>
                {playing ? <Scene variant={video.scene} /> : (
                  <div className="flex h-full items-center justify-center bg-brand-600"><LogoMark className="h-24 w-24 opacity-95 sm:h-32 sm:w-32" /></div>
                )}
              </button>
              {!playing && <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"><Play size={34} className="ml-1 fill-white" /></span>}
              <div className="absolute inset-x-0 top-0 flex items-center gap-1 bg-gradient-to-b from-black/50 to-transparent p-3 text-white">
                <IconButton icon={ChevronDown} label="Réduire" variant="glass" size="sm" onClick={() => navigate(-1)} />
                {video.live && <span className="ml-2 flex items-center gap-1 rounded bg-danger px-2 py-0.5 text-[11px] font-black"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />EN DIRECT</span>}
                <span className="flex-1" />
                <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Lecture'} variant="glass" size="sm" onClick={() => setPlaying((p) => !p)} />
                <IconButton icon={Monitor} label="Mode théâtre" variant="glass" size="sm" active={theater} onClick={() => setTheater((t) => !t)} />
                {video.live && !real && <IconButton icon={MessageCircle} label="Chat en direct" variant="glass" size="sm" active={chat} onClick={() => setChat((c) => !c)} />}
                <Popover className="w-44 p-1.5" trigger={({ toggle }) => <IconButton icon={Settings} label="Qualité" variant="glass" size="sm" onClick={toggle} />}>
                  {(close) => (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-bold uppercase text-ink-muted">Qualité</p>
                      {(['auto', '1080p', '720p', '480p'] as const).map((q) => (
                        <button key={q} onClick={() => { media.set({ quality: q }); close(); toast(`Qualité : ${q === 'auto' ? 'automatique' : q}`); }} className={cn('flex w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-surface-sunken', quality === q && 'font-bold text-brand-700')}>
                          {q === 'auto' ? 'Automatique' : q}
                        </button>
                      ))}
                    </div>
                  )}
                </Popover>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 text-white">
                <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'}>{playing ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white" />}</button>
                <span className="text-xs tabular-nums">{video.live ? 'En direct' : `${fmtDuration(Math.round(progress * video.durationSec))} / ${fmtDuration(video.durationSec)}`}</span>
                <input type="range" min={0} max={1000} value={progress * 1000} disabled={video.live} onChange={(e) => setProgress(Number(e.target.value) / 1000)} aria-label="Progression" className="h-1 flex-1 cursor-pointer accent-white" />
                <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activer le son' : 'Couper le son'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
                <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => toast('Plein écran indisponible'))} aria-label="Plein écran"><Maximize2 size={16} /></button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 px-4 pt-4 sm:px-0">
          <div>
            <h1 className="text-[24px] font-black leading-tight">{video.title}</h1>
            <p className="text-sm text-ink-muted">{[video.views > 0 && `${compactNumber(video.views)} vues`, video.live ? 'En direct' : timeAgo(video.publishedAt)].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/streaming/${ch.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              {isRemoteChannel(ch) && ch.avatar ? <ChannelAvatar c={ch} className="h-11 w-11 shrink-0" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line"><LogoMark className="h-8 w-8" /></span>}
              <span className="min-w-0">
                <span className="block truncate font-bold">{ch.name}</span>
                {ch.subscribers + (subscribed ? 1 : 0) > 0 && <span className="block text-xs text-ink-muted">{compactNumber(ch.subscribers + (subscribed ? 1 : 0))} abonnés</span>}
              </span>
            </Link>
            <Button icon={subscribed ? BellRing : Bell} variant={subscribed ? 'soft' : 'primary'} onClick={() => toast(media.toggle('subscriptions', ch.id) ? `Abonné à ${ch.name}` : 'Abonnement annulé')}>
              {subscribed ? 'Abonné' : "S'abonner"}
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {actions.map((a) => (
              <button key={a.label} onClick={a.run} aria-pressed={a.on} className={cn('flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11.5px] font-semibold transition', a.on ? 'border-brand-300 bg-mint-100 text-brand-800' : 'border-line bg-surface hover:bg-surface-sunken')}>
                <a.icon size={19} className={cn(a.on && 'fill-brand-600/20')} /> {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setCreator(true)} className="flex w-full items-center gap-4 rounded-2xl border border-brand-200 bg-mint-50 p-4 text-left transition hover:bg-mint-100">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint-100 text-brand-700"><Sparkles size={22} /></span>
            <span className="flex-1">
              <span className="block font-bold">Devenir créateur</span>
              <span className="block text-sm text-ink-muted">Demandez l'accès pour publier musiques, films, vidéos et podcasts.</span>
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white"><ArrowRight size={18} /></span>
          </button>
          <div className="rounded-2xl bg-surface-sunken p-4 text-sm text-ink-soft">
            <Chip tone="mint" className={cn(video.description && 'mb-2')}>{video.category}</Chip>
            {video.description && <p className="whitespace-pre-line">{video.description}</p>}
          </div>
        </div>
      </div>

      <aside className="space-y-3 px-4 pb-8 sm:px-0">
        {chat && video.live ? <LiveChat onClose={() => setChat(false)} /> : (
          <>
            {suggestions.length > 0 && <p className="font-extrabold">À suivre</p>}
            {suggestions.map((v) => <VideoThumb key={v.id} v={v} compact />)}
          </>
        )}
      </aside>
      <CreatorModal open={creator} onClose={() => setCreator(false)} />
    </div>
  );
}

/** Page Live : la chaîne officielle et son direct (comme l'app mobile). */
function LiveView() {
  const { channels, remote, status } = useStreaming();
  const ch = officialChannel(channels);
  if (!ch) {
    if (remote && status !== 'ready' && status !== 'error') return <div className="mx-auto max-w-[1100px] px-4 py-4" aria-busy="true"><div className="skeleton aspect-video rounded-2xl" /></div>;
    return <div className="p-6"><EmptyState icon={Clapperboard} title="Aucun direct pour le moment" text="Les directs de Cèlè One apparaîtront ici." /></div>;
  }
  return <ChannelView channelId={ch.id} liveMode />;
}

function ChannelView({ channelId, liveMode }: { channelId: string; liveMode?: boolean }) {
  const { getChannel, videos, remote, status } = useStreaming();
  const ch = getChannel(channelId);
  const subscribed = useMedia((s) => s.subscriptions.includes(channelId));
  const [tab, setTab] = useState<'videos' | 'podcasts'>('videos');
  const [creator, setCreator] = useState(false);
  if (!ch && remote && status !== 'ready' && status !== 'error') return <div className="p-6"><EmptyState icon={Clapperboard} title="Chargement de la chaîne…" /></div>;
  if (!ch) return <div className="p-6"><EmptyState icon={Clapperboard} title="Chaîne introuvable" action={<Button to="/streaming">Retour au streaming</Button>} /></div>;
  const list = videos.filter((v) => v.channelId === ch.id && (tab === 'podcasts' ? v.kind === 'podcast' : v.kind !== 'podcast'));
  const live = videos.find((v) => v.channelId === ch.id && v.live);
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <IconButton icon={ChevronLeft} label="Retour" shape="square" to="/streaming" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">{ch.name}</h1>
          {ch.description && <p className="truncate text-sm text-ink-muted">{ch.description}</p>}
        </div>
      </div>
      {live ? <WatchViewHero video={live} /> : liveMode && (
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-night px-6 text-center text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><TriangleAlert size={30} /></span>
          <p className="text-xl font-black">{ch.live ? 'Lecture indisponible' : 'Aucun direct en ce moment'}</p>
          <p className="text-sm text-white/70">{ch.live ? 'Le direct est annoncé mais sa lecture n’est pas disponible pour le moment.' : `Le prochain direct de ${ch.name} s’affichera ici. En attendant, retrouvez ses vidéos ci-dessous.`}</p>
        </div>
      )}
      <div className="card my-4 flex flex-wrap items-center gap-4 rounded-2xl p-4">
        {isRemoteChannel(ch) && ch.avatar ? <ChannelAvatar c={ch} className="h-14 w-14" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-line"><LogoMark className="h-10 w-10" /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black">{ch.name}</p>
          {ch.live && <p className="text-xs font-bold uppercase text-brand-600">En direct maintenant</p>}
          {ch.description && <p className="text-sm text-ink-muted">{ch.description}</p>}
          {ch.subscribers + (subscribed ? 1 : 0) > 0 && <p className="text-sm font-semibold">{compactNumber(ch.subscribers + (subscribed ? 1 : 0))} abonnés</p>}
        </div>
        <Button variant={subscribed ? 'soft' : 'secondary'} icon={subscribed ? BellRing : Bell} onClick={() => toast(media.toggle('subscriptions', ch.id) ? `Abonné à ${ch.name}` : 'Abonnement annulé')}>{subscribed ? 'Abonné' : "S'abonner"}</Button>
      </div>
      <button onClick={() => setCreator(true)} className="mb-4 flex w-full items-center gap-4 rounded-2xl border border-brand-200 bg-mint-50 p-4 text-left hover:bg-mint-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand-700"><Sparkles size={20} /></span>
        <span className="flex-1"><span className="block font-bold">Devenir créateur de contenu</span><span className="block text-sm text-ink-muted">Demandez l'autorisation de publier des vidéos, chansons, albums ou films.</span></span>
        <ChevronDown className="-rotate-90 text-ink-faint" />
      </button>
      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-surface-sunken p-1">
        {(['videos', 'podcasts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('h-11 rounded-xl text-[15px] font-bold', tab === t ? 'bg-surface shadow-sm' : 'text-ink-muted')}>{t === 'videos' ? 'Vidéos' : 'Podcasts'}</button>
        ))}
      </div>
      {list.length === 0 ? <div className="card rounded-2xl"><EmptyState icon={Clapperboard} title="Aucune vidéo pour le moment" text="Revenez plus tard." /></div> : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((v) => <VideoThumb key={v.id} v={v} />)}</div>
      )}
      <CreatorModal open={creator} onClose={() => setCreator(false)} />
    </div>
  );
}

function WatchViewHero({ video }: { video: Video }) {
  const real = isRemoteVideo(video);
  const [failures, setFailures] = useState(!real && video.channelId === 'c1-international' ? 2 : 0);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-night">
      {real ? (
        video.src ? <MediaPlayer key={video.id} sources={video.sources} poster={video.thumbnail} live={video.live} title={video.title} /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white"><p className="text-xl font-black">Lecture indisponible</p><p className="text-sm text-white/70">Le direct n’a pas encore commencé.</p></div>
        )
      ) : failures > 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/25"><TriangleAlert size={30} /></span>
          <p className="text-xl font-black">Lecture indisponible</p>
          <p className="text-sm text-white/70">La lecture en direct est indisponible.</p>
          <Button loading={retrying} loadingText="Connexion…" icon={RotateCcw} onClick={async () => { setRetrying(true); await sleep(1200); setRetrying(false); setFailures((f) => f - 1); toast(failures - 1 > 0 ? 'Toujours indisponible, réessayez' : 'Flux rétabli', { tone: failures - 1 > 0 ? 'danger' : 'success' }); }}>Réessayer</Button>
        </div>
      ) : (
        <button onClick={() => navigate(`/streaming/live/${video.id}`)} className="relative block h-full w-full">
          <Scene variant={video.scene} />
          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"><Play size={34} className="ml-1 fill-white" /></span>
        </button>
      )}
    </div>
  );
}

function ExploreView() {
  const { videos, channels, remote } = useStreaming();
  const [cat, setCat] = useState('Tout');
  const [query, setQuery] = useState('');
  const categories = remote ? ['Tout', ...new Set(videos.map((v) => v.category).filter(Boolean))] : streamCategories;
  const list = videos.filter((v) => (cat === 'Tout' || v.category === cat) && v.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-4">
      <h1 className="mb-3 text-2xl font-black">Explorer</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une vidéo, un film, un podcast…" className="field mb-3 h-12 rounded-2xl" />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => <button key={c} onClick={() => setCat(c)} className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold', cat === c ? 'bg-night text-white' : 'bg-surface-sunken hover:bg-line')}>{c}</button>)}
      </div>
      {channels.length > 0 && <p className="mb-2 font-extrabold">Chaînes</p>}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {channels.map((c) => (
          <Link key={c.id} to={`/streaming/${c.id}`} className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-4 text-center hover:border-brand-300">
            <ChannelAvatar c={c} className="h-16 w-16" />
            <span className="line-clamp-1 text-sm font-bold">{c.name}</span>
            {c.live && <span className="rounded bg-danger px-1.5 text-[10px] font-black text-white">EN DIRECT</span>}
          </Link>
        ))}
      </div>
      {list.length === 0 ? <EmptyState icon={Compass} title="Aucun contenu dans cette catégorie" /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((v) => <VideoThumb key={v.id} v={v} />)}</div>}
    </div>
  );
}

function MusicView() {
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const { albums } = useStreaming();
  const [albumId, setAlbumId] = useState('');
  const album = albums.find((a) => a.id === albumId) ?? albums[0];
  if (!album) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-4">
        <h1 className="mb-4 text-2xl font-black">Musique</h1>
        <div className="card rounded-2xl"><EmptyState icon={Music} title="Aucune musique publiée pour le moment" text="Revenez bientôt pour écouter les louanges et albums de Cèlè One." /></div>
      </div>
    );
  }
  const playTrack = (t: { id: string; title: string; durationSec: number }) => player.play({ id: t.id, title: t.title, subtitle: album.artist, to: '/streaming?onglet=musique', duration: t.durationSec, src: albumSrc(album, t.id) });
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-4">
      <h1 className="mb-4 text-2xl font-black">Musique</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {albums.map((a) => (
          <button key={a.id} onClick={() => setAlbumId(a.id)} className={cn('rounded-2xl p-2 text-left transition', album.id === a.id ? 'bg-mint-100 ring-2 ring-brand-500' : 'hover:bg-surface-sunken')}>
            <span className="block aspect-square overflow-hidden rounded-xl">{'cover' in a && typeof a.cover === 'string' ? <img src={a.cover} alt="" className="h-full w-full object-cover" /> : <Scene variant={a.scene} playing={false} />}</span>
            <span className="mt-2 block truncate font-bold">{a.title}</span>
            <span className="block truncate text-xs text-ink-muted">{a.artist}</span>
          </button>
        ))}
      </div>
      <div className="card rounded-2xl p-2">
        <div className="flex items-center gap-3 p-3">
          <ListMusic className="text-brand-600" />
          <p className="flex-1 font-extrabold">{album.title} · {album.artist}</p>
          <Button size="sm" icon={Play} onClick={() => playTrack(album.tracks[0])}>Tout lire</Button>
        </div>
        {album.tracks.map((t, i) => {
          const current = track?.id === t.id;
          return (
            <button key={t.id} onClick={() => (current ? player.toggle() : playTrack(t))} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-sunken', current && 'bg-mint-50')}>
              <span className="w-6 text-center text-sm text-ink-muted">{current && playing ? <Pause size={15} className="mx-auto fill-brand-600 text-brand-600" /> : i + 1}</span>
              <span className={cn('flex-1 font-semibold', current && 'text-brand-700')}>{t.title}</span>
              <span className="text-sm text-ink-muted">{fmtDuration(t.durationSec)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MyListView() {
  const { getVideo } = useStreaming();
  const myList = useMedia((s) => s.myList);
  const favorites = useMedia((s) => s.favorites);
  const history = useMedia((s) => s.history);
  const section = (title: string, ids: string[], icon: typeof Bookmark, empty: string, extra?: React.ReactNode) => (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold">{title}</h2>{extra}</div>
      {ids.length === 0 ? <div className="card rounded-2xl"><EmptyState icon={icon} title={empty} className="py-8" /></div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{ids.map(getVideo).filter(Boolean).map((v) => <VideoThumb key={v!.id} v={v!} />)}</div>}
    </section>
  );
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-4">
      <h1 className="mb-4 text-2xl font-black">Ma liste</h1>
      {section('À regarder plus tard', myList, Bookmark, 'Votre liste est vide')}
      {section('Favoris', favorites, Star, 'Aucun favori')}
      {section('Historique', history, History, 'Aucune vidéo regardée', history.length > 0 && <Button size="sm" variant="ghost" onClick={() => { media.clearHistory(); toast('Historique effacé'); }}>Effacer</Button>)}
    </div>
  );
}

function MeView() {
  const { getVideo, getChannel } = useStreaming();
  const subs = useMedia((s) => s.subscriptions);
  const downloads = useMedia((s) => s.downloads);
  const request = useMedia((s) => s.creatorRequest);
  const autoplay = useMedia((s) => s.autoplay);
  const [creator, setCreator] = useState(false);
  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-4 py-4">
      <h1 className="text-2xl font-black">Moi</h1>
      <section className="card rounded-2xl p-4">
        <p className="mb-3 font-extrabold">Mes abonnements ({subs.length})</p>
        {subs.length === 0 ? <p className="text-sm text-ink-muted">Aucun abonnement.</p> : subs.map((id) => {
          const c = getChannel(id);
          return c && (
            <div key={id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-0">
              <ChannelAvatar c={c} className="h-10 w-10" />
              <Link to={`/streaming/${c.id}`} className="flex-1 font-semibold hover:underline">{c.name}</Link>
              <Button size="sm" variant="ghost" onClick={() => { media.toggle('subscriptions', c.id); toast('Abonnement annulé'); }}>Se désabonner</Button>
            </div>
          );
        })}
      </section>
      <section className="card rounded-2xl p-4">
        <p className="mb-3 font-extrabold">Téléchargements ({downloads.length})</p>
        {downloads.length === 0 ? <p className="text-sm text-ink-muted">Téléchargez des vidéos pour les regarder hors connexion.</p> : downloads.map((id) => {
          const v = getVideo(id);
          return v && (
            <div key={id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-0">
              <Download size={17} className="text-brand-600" />
              <Link to={`/streaming/live/${v.id}`} className="flex-1 truncate font-semibold hover:underline">{v.title}</Link>
              <Button size="sm" variant="ghost" onClick={() => { media.toggle('downloads', v.id); toast('Téléchargement supprimé'); }}>Supprimer</Button>
            </div>
          );
        })}
      </section>
      <section className="card flex items-center gap-4 rounded-2xl p-4">
        <Sparkles className="text-brand-600" />
        <div className="flex-1"><p className="font-extrabold">Espace créateur</p><p className="text-sm text-ink-muted">{request ? `Demande « ${request.name} » : ${request.status}` : 'Publiez vos contenus sur Cèlè One.'}</p></div>
        <Button size="sm" onClick={() => setCreator(true)}>{request ? 'Voir' : 'Devenir créateur'}</Button>
      </section>
      <section className="card flex items-center gap-4 rounded-2xl p-4">
        <Eye className="text-brand-600" />
        <div className="flex-1"><p className="font-extrabold">Lecture automatique</p><p className="text-sm text-ink-muted">Enchaîner la vidéo suivante</p></div>
        <Toggle checked={autoplay} onChange={(v) => media.set({ autoplay: v })} label="Lecture automatique" />
      </section>
      <CreatorModal open={creator} onClose={() => setCreator(false)} />
    </div>
  );
}

export function StreamingPage() {
  const { chaineId, videoId, liveId, channelName } = useParams();
  const requestedVideoId = videoId ?? liveId;
  const requestedChannelId = chaineId ?? channelName;
  const [params] = useSearchParams();
  const tab = (params.get('onglet') as Tab) || 'accueil';
  const { videos, channels, getVideo, remote, status } = useStreaming();
  const channel = requestedChannelId ? channels.find((item) => {
    const key = (value: string) => value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    return [item.id, item.name].some((value) => key(value) === key(requestedChannelId));
  }) : undefined;
  const resolvedChannelId = channel?.id ?? requestedChannelId;
  // Vidéo demandée, sinon le direct en cours, sinon la plus récente.
  const video = useMemo(() => {
    if (!requestedVideoId) return videos.find((v) => v.live) ?? videos[0];
    const id = requestedVideoId.replace(/^api-live-/, '').replace(/^api-/, '');
    return getVideo(requestedVideoId) ?? videos.find((v) => v.id.replace(/^api-live-/, '').replace(/^api-/, '') === id);
  }, [requestedVideoId, videos, getVideo]);

  let content;
  if (resolvedChannelId === 'direct') content = <LiveView />;
  else if (resolvedChannelId) content = <ChannelView channelId={resolvedChannelId} />;
  else if (tab === 'explorer') content = <ExploreView />;
  else if (tab === 'musique') content = <MusicView />;
  else if (tab === 'ma-liste') content = <MyListView />;
  else if (tab === 'moi') content = <MeView />;
  else if (video) content = <WatchView video={video} />;
  else if (remote && status === 'error') content = <div className="p-6"><EmptyState icon={Clapperboard} title="Vidéos indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void ensureStreaming()}>Réessayer</Button>} /></div>;
  else if (remote && status !== 'ready') content = <div className="mx-auto grid max-w-[1400px] gap-6 px-0 sm:px-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-4" aria-busy="true"><div className="skeleton aspect-video sm:rounded-2xl" /><div className="hidden space-y-3 lg:block">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div></div>;
  else content = <div className="p-6"><EmptyState icon={Clapperboard} title="Aucune vidéo publiée pour le moment" text="Les directs et vidéos de Cèlè One apparaîtront ici." /></div>;

  return (
    <div className="min-h-[calc(100dvh-var(--header-h))] pb-24 md:pb-8">
      <nav className="sticky top-header z-20 hidden border-b border-line bg-surface/95 backdrop-blur md:block" aria-label="Sections du streaming">
        <div className="mx-auto flex max-w-[1400px] gap-1 px-4">
          {tabs.map((t) => (
            <NavLink key={t.id} to={t.id === 'accueil' ? '/streaming' : `/streaming?onglet=${t.id}`} className={() => cn('relative inline-flex h-12 items-center gap-2 px-4 text-sm font-semibold', tab === t.id && !resolvedChannelId ? 'text-brand-700' : 'text-ink-muted hover:text-ink')}>
              <t.icon size={17} /> {t.label}
              {tab === t.id && !resolvedChannelId && <span className="rainbow-bar absolute inset-x-3 bottom-0 h-[3px] rounded-full" />}
            </NavLink>
          ))}
        </div>
      </nav>
      {content}
    </div>
  );
}
