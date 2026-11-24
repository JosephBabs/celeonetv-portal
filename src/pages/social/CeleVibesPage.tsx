import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Camera, ChevronDown, ChevronUp, Clapperboard, Heart, MessageCircle, Play, Send, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { getMember } from '@/data/members';
import type { Vibe } from '@/data/types';
import { accountName, actions, useApp } from '@/store/app';
import { confirmDialog, openShare, toast } from '@/store/ui';
import { Scene } from '@/components/feed/Scene';
import { CommentInput, CommentRow } from '@/components/feed/PostCard';
import { Avatar, MemberAvatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/Feedback';
import { Button, IconButton } from '@/components/ui/Button';
import { ComposerModal } from '@/components/social/Composers';
import { cn, compactNumber, timeAgo } from '@/lib/utils';

function ActionButton({ icon: Icon, label, count, active, activeClass, onClick }: { icon: typeof Heart; label: string; count?: number | string; active?: boolean; activeClass?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className="flex flex-col items-center gap-1 text-white">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur transition hover:bg-black/50 md:bg-white/10">
        <Icon size={24} className={cn(active && activeClass)} />
      </span>
      {count !== undefined && <span className="text-xs font-semibold drop-shadow">{count}</span>}
    </button>
  );
}

function VibeSlide({ vibe, active, muted, onToggleMute, onComments }: { vibe: Vibe; active: boolean; muted: boolean; onToggleMute: () => void; onComments: () => void }) {
  const account = useApp((s) => s.account);
  const liked = useApp((s) => !!s.liked[vibe.id]);
  const saved = useApp((s) => !!s.saved[vibe.id]);
  const following = useApp((s) => s.following.includes(vibe.authorId));
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const mine = vibe.authorId === 'me';
  const m = getMember(vibe.authorId);
  const name = mine && account ? accountName(account) : m.name;
  const playing = active && !paused;

  useEffect(() => {
    if (active) actions.viewVibe(vibe.id);
    setProgress(0);
    setPaused(false);
  }, [active, vibe.id]);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setProgress((p) => (p >= 1 ? 0 : p + 0.01)), 150);
    return () => window.clearInterval(t);
  }, [playing]);

  const like = () => {
    if (!liked) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 700);
    }
    actions.toggleLike(vibe.id);
  };

  return (
    <div className="relative mx-auto h-full w-full max-w-[460px] overflow-hidden bg-black md:rounded-3xl md:shadow-lg">
      <button className="absolute inset-0" aria-label={playing ? 'Pause' : 'Lecture'} onClick={() => setPaused((p) => !p)} onDoubleClick={like}>
        <Scene variant={vibe.scene} playing={playing} />
      </button>
      {paused && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white">
          <Play size={36} className="ml-1 fill-white" />
        </span>
      )}
      {burst && <Heart size={110} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-like-pop fill-white text-white drop-shadow-xl" />}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-5 pt-24 text-white">
        <div className="pointer-events-auto flex items-center gap-2.5 pr-16">
          <Link to={mine ? '/social/profil' : `/social/profil/${vibe.authorId}`} className="flex min-w-0 items-center gap-2.5">
            {mine && account ? <Avatar name={name} hue={account.hue} src={account.avatar} size="sm" /> : <MemberAvatar member={m} size="sm" />}
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold">{name}</span>
              <span className="block text-xs text-white/75">{compactNumber(vibe.views)} vues · {timeAgo(vibe.createdAt)}</span>
            </span>
          </Link>
          {!mine && (
            <button onClick={() => toast(actions.toggleFollow(vibe.authorId) ? `Vous suivez ${m.name}` : `Vous ne suivez plus ${m.name}`)} className={cn('ml-1 h-7 shrink-0 rounded-full border px-3 text-xs font-bold', following ? 'border-white/40 text-white/80' : 'border-white bg-white text-night')}>
              {following ? 'Suivi' : 'Suivre'}
            </button>
          )}
        </div>
        <p className="mt-2 pr-16 text-[14px] leading-snug">{vibe.caption}</p>
        <div className="pointer-events-auto mt-3 flex items-center gap-2 text-[11px] tabular-nums text-white/80">
          <span>{`0:${String(Math.round(progress * 30)).padStart(2, '0')}`}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
          <span>0:30</span>
        </div>
      </div>

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4">
        <ActionButton icon={Heart} label={liked ? "Je n'aime plus" : "J'aime"} count={vibe.likes + (liked ? 1 : 0)} active={liked} activeClass="fill-danger text-danger" onClick={like} />
        <ActionButton icon={MessageCircle} label="Commentaires" count={vibe.comments.length} onClick={onComments} />
        <ActionButton icon={Send} label="Partager" count={vibe.shares} onClick={() => openShare({ title: vibe.caption, url: `/social/cele-vibes?v=${vibe.id}`, onShared: () => actions.shareVibe(vibe.id) })} />
        <ActionButton icon={Bookmark} label={saved ? 'Retirer des enregistrements' : 'Enregistrer'} active={saved} activeClass="fill-white" onClick={() => toast(actions.toggleSave(vibe.id) ? 'Cele Vibe enregistré' : 'Retiré de vos enregistrements')} />
        {mine && (
          <ActionButton
            icon={Trash2}
            label="Supprimer"
            onClick={async () => {
              if (await confirmDialog({ title: 'Supprimer ce Cele Vibe ?', confirmLabel: 'Supprimer', tone: 'danger' })) {
                actions.deleteVibe(vibe.id);
                toast('Cele Vibe supprimé');
              }
            }}
          />
        )}
      </div>
      <button onClick={onToggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="absolute right-3 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}

function CommentsPanel({ vibe, onClose }: { vibe: Vibe; onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[70%] animate-slide-up flex-col rounded-t-3xl bg-surface md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[380px] md:animate-slide-right md:rounded-none md:rounded-l-3xl">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-extrabold">{vibe.comments.length} commentaire{vibe.comments.length > 1 ? 's' : ''}</h2>
        <IconButton icon={X} label="Fermer les commentaires" size="sm" onClick={onClose} />
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {vibe.comments.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">Aucun commentaire. Lancez la conversation !</p>}
        {vibe.comments.map((c) => (
          <CommentRow key={c.id} c={c} />
        ))}
      </div>
      <div className="border-t border-line p-4">
        <CommentInput autoFocus onSubmit={(t) => actions.commentVibe(vibe.id, t)} />
      </div>
    </div>
  );
}

export function CeleVibesPage() {
  const vibes = useApp((s) => s.vibes);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(params.get('v') ?? vibes[0]?.id ?? null);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Positionne le défilement sur la vidéo demandée dans l'URL.
  useEffect(() => {
    const id = params.get('v');
    if (id) document.getElementById(`vibe-${id}`)?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.intersectionRatio > 0.6 && setActiveId(e.target.getAttribute('data-id'))),
      { root, threshold: [0.6] },
    );
    root.querySelectorAll('[data-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [vibes.length]);

  useEffect(() => {
    if (activeId && params.get('v') !== activeId) setParams({ v: activeId }, { replace: true });
  }, [activeId, params, setParams]);

  const go = (dir: number) => {
    const idx = vibes.findIndex((v) => v.id === activeId);
    const target = vibes[Math.min(vibes.length - 1, Math.max(0, idx + dir))];
    if (target) document.getElementById(`vibe-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (commentsFor || creating || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const commentVibe = vibes.find((v) => v.id === commentsFor);

  return (
    <div className="relative h-[calc(100dvh-var(--header-h)-64px)] bg-night md:h-[calc(100dvh-var(--header-h))]">
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-3 md:p-4">
        <IconButton icon={ArrowLeft} label="Retour" variant="glass" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/social'))} />
        <span className="rounded-full bg-black/35 px-4 py-1.5 text-sm font-bold text-white backdrop-blur">Cele Vibes</span>
        <IconButton icon={Camera} label="Publier un Cele Vibe" variant="glass" onClick={() => setCreating(true)} />
      </div>

      {vibes.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="rounded-3xl bg-surface p-4">
            <EmptyState icon={Clapperboard} title="Aucun Cele Vibe pour le moment" text="Soyez le premier à publier !" action={<Button onClick={() => setCreating(true)}>Publier un Cele Vibe</Button>} />
          </div>
        </div>
      ) : (
        <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-auto scrollbar-none">
          {vibes.map((v) => (
            <section key={v.id} id={`vibe-${v.id}`} data-id={v.id} className="h-full snap-start snap-always md:py-4">
              <VibeSlide vibe={v} active={v.id === activeId} muted={muted} onToggleMute={() => setMuted((m) => !m)} onComments={() => setCommentsFor(v.id)} />
            </section>
          ))}
        </div>
      )}

      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <IconButton icon={ChevronUp} label="Vidéo précédente" variant="glass" size="lg" onClick={() => go(-1)} />
        <IconButton icon={ChevronDown} label="Vidéo suivante" variant="glass" size="lg" onClick={() => go(1)} />
      </div>

      {commentVibe && <CommentsPanel vibe={commentVibe} onClose={() => setCommentsFor(null)} />}
      {creating && <ComposerModal kind="cele-vibe" onClose={() => setCreating(false)} />}
    </div>
  );
}
