import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, CircleDashed, Clapperboard, Eye, ImagePlus, Music, PenSquare, Play, Plus,
  Radio, Trash2, Users, Video, X,
} from 'lucide-react';
import { getMember } from '@/data/members';
import { lives, mustSee, textBackgrounds } from '@/data/social';
import type { Status, StatusItem } from '@/data/types';
import { accountName, actions, useApp } from '@/store/app';
import { chat } from '@/store/chat';
import { confirmDialog, toast } from '@/store/ui';
import { Avatar, MemberAvatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal, useEscape } from '@/components/ui/Overlay';
import { Scene } from '@/components/feed/Scene';
import { CommentInput } from '@/components/feed/PostCard';
import { cn, compactNumber, timeAgo } from '@/lib/utils';
import type { ComposerKind } from './Composers';

const bg = (id?: string) => textBackgrounds.find((b) => b.id === id)?.css;

/* ───────────── Choix « Créer » ───────────── */

export function CreateChooser({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (k: ComposerKind) => void }) {
  const options: { kind: ComposerKind; icon: typeof Plus; label: string; hint: string }[] = [
    { kind: 'cele-vibe', icon: Clapperboard, label: 'Cele Vibe', hint: 'Une vidéo courte à partager' },
    { kind: 'statut', icon: CircleDashed, label: 'Statut', hint: 'Visible 24 h par vos amis' },
    { kind: 'publication', icon: PenSquare, label: 'Publication', hint: 'Texte, photos ou vidéo' },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Créer" description="Que voulez-vous partager aujourd'hui ?" size="sm">
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.kind}
            onClick={() => {
              onClose();
              onPick(o.kind);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-brand-300 hover:bg-mint-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <o.icon size={20} />
            </span>
            <span>
              <span className="block font-bold">{o.label}</span>
              <span className="block text-xs text-ink-muted">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ───────────── Statuts ───────────── */

function StatusVisual({ item, className }: { item: StatusItem; className?: string }) {
  if (item.image) return <img src={item.image} alt="" className={cn('h-full w-full object-cover', className)} />;
  if (item.scene) return <Scene variant={item.scene} className={className} />;
  return <div className={cn('h-full w-full', className)} style={{ background: bg(item.background) ?? bg('teal') }} />;
}

export function StatusStrip({ onCreate }: { onCreate: () => void }) {
  const account = useApp((s) => s.account);
  const statuses = useApp((s) => s.statuses);
  const myStatus = useApp((s) => s.myStatus);
  const seen = useApp((s) => s.seenStatuses);
  const [viewing, setViewing] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const all: Status[] = useMemo(() => (myStatus.length ? [{ authorId: 'me', items: myStatus }, ...statuses] : statuses), [myStatus, statuses]);
  const ordered = useMemo(() => [...all].sort((a, b) => Number(seen.includes(a.authorId)) - Number(seen.includes(b.authorId))), [all, seen]);
  if (!account) return null;
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <section className="relative" aria-label="Statuts">
      <div ref={scroller} className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={onCreate} className="group relative flex h-[190px] w-[112px] shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-xs transition hover:shadow-md">
          <div className="flex h-[128px] items-center justify-center bg-mint-100">
            <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="xl" className="scale-90 transition group-hover:scale-95" />
          </div>
          <span className="absolute left-1/2 top-[112px] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white ring-4 ring-surface">
            <Plus size={19} strokeWidth={2.6} />
          </span>
          <span className="mt-auto pb-3 text-center text-[13px] font-bold">Créer un statut</span>
        </button>
        {ordered.map((st) => {
          const last = st.items[st.items.length - 1];
          const mine = st.authorId === 'me';
          const m = getMember(st.authorId);
          const unseen = !mine && !seen.includes(st.authorId);
          return (
            <button key={st.authorId} onClick={() => setViewing(all.indexOf(st))} className="group relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-2xl text-left shadow-xs transition hover:shadow-md">
              <StatusVisual item={last} className="transition duration-300 group-hover:scale-105" />
              {last.text && !last.image && !last.scene && <p className="absolute inset-x-2 top-1/2 line-clamp-4 -translate-y-1/2 text-center text-[11px] font-bold text-white">{last.text}</p>}
              <span className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
              <span className={cn('absolute left-2 top-2 rounded-full p-[2px]', unseen ? 'rainbow-ring' : 'bg-white/70')}>
                {mine ? <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="xs" className="rounded-full ring-2 ring-white" /> : <MemberAvatar member={m} size="xs" className="rounded-full ring-2 ring-white" />}
              </span>
              <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-[12px] font-bold leading-tight text-white">{mine ? 'Votre statut' : m.name}</span>
            </button>
          );
        })}
      </div>
      {ordered.length > 3 && (
        <>
          <IconButton icon={ChevronLeft} label="Statuts précédents" variant="white" size="sm" className="absolute -left-3 top-[80px] hidden shadow-md md:inline-flex" onClick={() => scroll(-1)} />
          <IconButton icon={ChevronRight} label="Statuts suivants" variant="white" size="sm" className="absolute -right-3 top-[80px] hidden shadow-md md:inline-flex" onClick={() => scroll(1)} />
        </>
      )}
      {viewing !== null && <StatusViewer statuses={all} start={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}

const STATUS_MS = 5000;

export function StatusViewer({ statuses, start, onClose }: { statuses: Status[]; start: number; onClose: () => void }) {
  const account = useApp((s) => s.account);
  const [group, setGroup] = useState(start);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  useEscape(true, onClose);

  const current = statuses[group];
  const item = current?.items[index];
  const mine = current?.authorId === 'me';

  useEffect(() => {
    if (current) actions.markStatusSeen(current.authorId);
  }, [current]);

  const next = () => {
    if (!current) return;
    if (index < current.items.length - 1) setIndex((i) => i + 1);
    else if (group < statuses.length - 1) {
      setGroup((g) => g + 1);
      setIndex(0);
    } else onClose();
    setProgress(0);
  };
  const prev = () => {
    if (index > 0) setIndex((i) => i - 1);
    else if (group > 0) {
      setGroup((g) => g - 1);
      setIndex(0);
    }
    setProgress(0);
  };

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setProgress((p) => p + 100 / STATUS_MS), 100);
    return () => window.clearInterval(t);
  }, [paused, group, index]);
  useEffect(() => {
    if (progress >= 1) next();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current || !item || !account) return null;
  const m = getMember(current.authorId);
  const name = mine ? accountName(account) : m.name;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex animate-fade-in items-center justify-center bg-night/95">
      <IconButton icon={X} label="Fermer" variant="glass" className="absolute right-4 top-4 z-10" onClick={onClose} />
      <IconButton icon={ChevronLeft} label="Précédent" variant="glass" size="lg" className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex" onClick={prev} disabled={group === 0 && index === 0} />
      <IconButton icon={ChevronRight} label="Suivant" variant="glass" size="lg" className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex" onClick={next} />
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-black sm:h-[92vh] sm:rounded-3xl" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
        <div className="absolute inset-0">
          <StatusVisual item={item} />
        </div>
        {item.text && (
          <div className={cn('absolute inset-x-6 flex justify-center', item.image || item.scene ? 'bottom-36' : 'top-1/2 -translate-y-1/2')}>
            <p className={cn('text-center font-display font-extrabold text-white drop-shadow-lg', item.image || item.scene ? 'rounded-xl bg-black/40 px-4 py-2 text-lg' : 'text-[28px] leading-tight')}>{item.text}</p>
          </div>
        )}
        <div className="relative z-10 bg-gradient-to-b from-black/60 to-transparent p-3 pb-8">
          <div className="flex gap-1">
            {current.items.map((it, i) => (
              <span key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <span className="block h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? Math.min(100, progress * 100) : 0}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5 text-white">
            {mine ? <Avatar name={name} hue={account.hue} src={account.avatar} size="sm" /> : <MemberAvatar member={m} size="sm" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="text-[11px] text-white/70">{timeAgo(item.createdAt)}{item.music && ` · ♪ ${item.music}`}</p>
            </div>
            {paused && <Chip tone="night" className="bg-white/20">En pause</Chip>}
          </div>
        </div>
        <button aria-label="Statut précédent" className="absolute bottom-24 left-0 top-24 w-1/3" onClick={prev} />
        <button aria-label="Statut suivant" className="absolute bottom-24 right-0 top-24 w-1/3" onClick={next} />
        <div className="relative z-10 mt-auto bg-gradient-to-t from-black/70 to-transparent p-4 pt-10" onPointerDown={(e) => e.stopPropagation()}>
          {mine ? (
            <div className="flex items-center justify-between text-white">
              <span className="flex items-center gap-1.5 text-sm"><Eye size={16} /> {Math.max(3, item.id.length * 2)} vues</span>
              <Button
                size="sm"
                variant="danger-soft"
                icon={Trash2}
                onClick={async () => {
                  setPaused(true);
                  if (await confirmDialog({ title: 'Supprimer ce statut ?', confirmLabel: 'Supprimer', tone: 'danger' })) {
                    actions.deleteStatus(item.id);
                    toast('Statut supprimé');
                    onClose();
                  } else setPaused(false);
                }}
              >
                Supprimer
              </Button>
            </div>
          ) : (
            <div onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
              <CommentInput
                dark
                placeholder={`Répondre à ${m.name.split(' ')[0]}…`}
                onSubmit={(text) => {
                  const convId = chat.ensureDirect(current.authorId);
                  chat.send(convId, { text, replyTo: { authorId: current.authorId, text: `Statut : ${item.text ?? 'photo'}` } });
                  toast('Réponse envoyée en message');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ───────────── À ne pas manquer ───────────── */

export function MustSee() {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold">À ne pas manquer</h2>
        <Link to="/streaming" className="text-sm font-semibold text-brand-700 hover:underline">Voir plus</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {mustSee.map((c) => (
          <Link key={c.id} to={c.to} className="group w-[220px] shrink-0 rounded-2xl border border-line/70 bg-surface p-3 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-2.5 aspect-[16/10] overflow-hidden rounded-xl bg-violet-50">
              {'scene' in c && c.scene ? (
                <Scene variant={c.scene} playing={false} className="transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-violet">
                  {c.type === 'Quiz' ? <span className="font-display text-4xl font-black">?</span> : <Music size={34} />}
                </div>
              )}
            </div>
            <Chip tone={c.tone} upper>{c.type}</Chip>
            <p className="mt-1.5 line-clamp-1 font-bold">{c.title}</p>
            <p className="line-clamp-1 text-[12.5px] text-ink-muted">{c.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Composeur ───────────── */

export function ComposerCard({ onOpen, onEvent, onLive }: { onOpen: (opts?: { photos?: boolean; schedule?: boolean }) => void; onEvent: () => void; onLive: () => void }) {
  const account = useApp((s) => s.account);
  if (!account) return null;
  const first = account.firstName;
  return (
    <div className="card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Link to="/social/profil">
          <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="md" />
        </Link>
        <button onClick={() => onOpen()} className="h-11 flex-1 rounded-full bg-surface-sunken px-5 text-left text-[15px] text-ink-faint transition hover:bg-line/70">
          Quoi de neuf aujourd'hui, {first} ?
        </button>
        <IconButton icon={ImagePlus} label="Ajouter des photos" variant="plain" className="text-brand-600" onClick={() => onOpen({ photos: true })} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 pt-3">
        <button onClick={() => onOpen({ schedule: true })} className="flex items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-surface-sunken">
          <CalendarClock size={18} className="shrink-0 text-brand-600" /> <span className="sm:hidden">Programmer</span><span className="hidden sm:inline">Publications programmées</span>
        </button>
        <button onClick={onEvent} className="flex items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-surface-sunken">
          <CalendarPlus size={18} className="shrink-0 text-brand-600" /> <span className="sm:hidden">Événement</span><span className="hidden sm:inline">Créer un événement</span>
        </button>
        <button onClick={onLive} className="flex items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-surface-sunken">
          <Video size={18} className="shrink-0 text-danger" /> <span className="sm:hidden">Live</span><span className="hidden sm:inline">Faire un Live</span>
        </button>
      </div>
    </div>
  );
}

export function EventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16));
  const [place, setPlace] = useState('');
  const navigate = useNavigate();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer un événement"
      description="Invitez vos amis à un culte, une veillée ou une rencontre."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              actions.createPost({ body: `📅 ${title.trim()}\n${new Date(date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}${place ? `\n📍 ${place}` : ''}`, audience: 'public', background: 'nuit' });
              actions.pushNotification({ category: 'evenements', title: 'Événement créé', body: title.trim(), action: { label: 'Voir les événements', to: '/evenements' } });
              onClose();
              setTitle('');
              setPlace('');
              toast('Événement créé et partagé', { action: { label: 'Voir', onClick: () => navigate('/evenements') } });
            }}
          >
            Créer l'événement
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Titre</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="Ex. Veillée de prière des jeunes" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Date et heure</span>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Lieu</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} className="field" placeholder="Ex. Paroisse Sion, Porto-Novo" />
        </label>
      </div>
    </Modal>
  );
}

/* ───────────── Directs ───────────── */

export function GoLiveModal({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: (title: string) => void }) {
  const [title, setTitle] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Faire un Live"
      description="Diffusez en direct auprès de vos amis et abonnés."
      size="sm"
      footer={
        <Button
          variant="danger"
          icon={Radio}
          onClick={() => {
            onStart(title.trim() || 'Live de louange');
            setTitle('');
          }}
        >
          Démarrer le direct
        </Button>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold">Titre du direct</span>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="Ex. Prière du matin" />
      </label>
      <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">Démo : la caméra n'est pas activée, un aperçu animé simule la diffusion.</p>
    </Modal>
  );
}

const liveComments = ['Amen 🙏', 'Bonsoir à tous !', 'Que Dieu vous bénisse', 'On vous suit depuis Lomé 🇹🇬', 'Alléluia !!', '🔥🔥', 'Merci pour ce moment'];

export function LiveStudio({ title, onEnd }: { title: string; onEnd: (stats: { seconds: number; viewers: number }) => void }) {
  const [seconds, setSeconds] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState<{ id: number; who: string; text: string }[]>([]);
  useEffect(() => {
    const t = window.setInterval(() => {
      setSeconds((s) => s + 1);
      setViewers((v) => v + Math.floor(Math.random() * 3));
    }, 1000);
    const c = window.setInterval(() => {
      const who = ['grace', 'joel', 'rachel', 'ruth', 'fiacre'][Math.floor(Math.random() * 5)];
      setComments((prev) => [...prev.slice(-5), { id: Date.now(), who, text: liveComments[Math.floor(Math.random() * liveComments.length)] }]);
    }, 2600);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
    };
  }, []);
  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-night">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden sm:h-[92vh] sm:rounded-3xl">
        <Scene variant="candles" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-4 text-white">
          <span className="flex items-center gap-1.5 rounded-md bg-danger px-2 py-1 text-xs font-black"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />EN DIRECT</span>
          <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-semibold tabular-nums">{fmt}</span>
          <span className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 text-xs"><Users size={13} /> {viewers}</span>
          <span className="ml-auto truncate text-sm font-bold">{title}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/70 to-transparent p-4 pt-20">
          {comments.map((c) => (
            <p key={c.id} className="flex animate-slide-up items-center gap-2 text-sm text-white">
              <MemberAvatar memberId={c.who} size="xs" />
              <span className="font-bold">{getMember(c.who).name.split(' ')[0]}</span> {c.text}
            </p>
          ))}
          <Button variant="danger" block className="mt-3" onClick={() => onEnd({ seconds, viewers })}>
            Terminer le direct
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LiveSection({ onGoLive }: { onGoLive: () => void }) {
  return (
    <section className="py-1">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[18px] font-extrabold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" /> En direct</h2>
          <p className="text-[13px] text-ink-muted">Membres et pages qui diffusent en ce moment</p>
        </div>
        <Button variant="danger" size="sm" icon={Video} onClick={onGoLive}>Faire un Live</Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={onGoLive} className="flex h-[150px] w-[130px] shrink-0 flex-col justify-between rounded-2xl bg-[linear-gradient(160deg,#0a6b60,#14a394)] p-3.5 text-left text-white shadow-sm transition hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Video size={19} /></span>
          <span className="font-display text-lg font-black">Go Live</span>
        </button>
        {lives.map((l) => {
          const m = getMember(l.authorId);
          return (
            <Link key={l.id} to="/streaming/direct" className="group relative h-[150px] w-[200px] shrink-0 overflow-hidden rounded-2xl shadow-sm">
              <Scene variant={l.id === 'l1' ? 'candles' : 'choir'} playing={false} className="transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              <span className="absolute left-2.5 top-2.5 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-black text-white">LIVE</span>
              <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md bg-black/40 px-1.5 py-0.5 text-[11px] text-white"><Eye size={12} /> {compactNumber(l.viewers)}</span>
              <span className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2 text-white">
                <MemberAvatar member={m} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold">{m.name}</span>
                  <span className="block truncate text-[11px] text-white/75">{l.title}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────── Cele Vibes ───────────── */

export function VibesStrip({ onCreate }: { onCreate: () => void }) {
  const vibes = useApp((s) => s.vibes);
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-[18px] font-extrabold">Cele Vibes</h2>
          <p className="text-[13px] text-ink-muted">{vibes.length} vidéos</p>
        </div>
        <Link to="/social/cele-vibes" className="text-sm font-semibold text-brand-700 hover:underline">Voir tout</Link>
      </div>
      {vibes.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-center text-sm text-ink-muted">Aucun Cele Vibe pour le moment — soyez le premier à publier</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={onCreate} className="flex h-[200px] w-[130px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(160deg,#0a6b60,#14a394)] p-3 text-center text-white shadow-sm transition hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/15"><Plus size={24} /></span>
            <span className="font-display text-[17px] font-black leading-tight">Publier un Cele Vibe</span>
          </button>
          {vibes.map((v) => {
            const m = getMember(v.authorId);
            return (
              <Link key={v.id} to={`/social/cele-vibes?v=${v.id}`} className="group relative h-[200px] w-[130px] shrink-0 overflow-hidden rounded-2xl shadow-sm">
                <Scene variant={v.scene} playing={false} className="transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white"><Play size={13} className="ml-0.5 fill-white" /></span>
                <span className="absolute inset-x-2.5 bottom-2.5 text-white">
                  <span className="block truncate text-[13px] font-bold">{v.authorId === 'me' ? 'Vous' : m.name}</span>
                  <span className="block text-[11px] text-white/75">{compactNumber(v.views)} vues · {v.likes} réactions</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
