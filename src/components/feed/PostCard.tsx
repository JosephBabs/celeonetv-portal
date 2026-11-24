import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck, Bookmark, ChevronRight, Ellipsis, EyeOff, Flag, Globe, Heart, Link2, MessageCircle, Pencil, Pin, PinOff, Send, Share2,
  RotateCw, ThumbsUp, Trash2, Users,
} from 'lucide-react';
import type { Comment, Post } from '@/data/types';
import { getMember } from '@/data/members';
import { textBackgrounds } from '@/data/social';
import { accountName, actions, findPost, useApp } from '@/store/app';
import { confirmDialog, openShare, toast } from '@/store/ui';
import { Avatar, MemberAvatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Button, IconButton } from '@/components/ui/Button';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Overlay';
import { cn, compactNumber, copyText, timeAgo } from '@/lib/utils';
import { PosterGrid } from './Poster';
import { fetchRemotePost, findRemotePost, remoteFeedStore } from '@/services/feed';
import { addRemoteComment, commentsStore, loadRemoteComments, toggleRemoteLike, toggleRemoteSave } from '@/services/postActions';
import { toggleFollow, useFollowBusy, useFollowing } from '@/services/follows';
import { deleteRemotePost, editRemotePost, isMyRemotePost } from '@/services/publish';
import { useFriends } from '@/services/friends';
import { VideoFrame } from './Scene';

const hueOf = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const tagTone: Record<Post['kind'], 'gray' | 'gold' | 'lavender' | 'mint'> = { actualite: 'gray', annonce: 'gold', reforme: 'lavender', agenda: 'mint', communaute: 'gray' };

export const postUrl = (p: Post) => p.remote
  ? `/posts/${encodeURIComponent(p.id.replace(/^api-/, ''))}`
  : p.kind === 'communaute' ? `/social?publication=${p.id}` : `/accueil?publication=${p.id}`;
export const bgCss = (id?: string) => textBackgrounds.find((b) => b.id === id)?.css;

/* ───────────── Commentaires ───────────── */

export function CommentRow({ c }: { c: Comment }) {
  const account = useApp((s) => s.account);
  const mine = c.authorId === 'me' && account;
  const name = mine ? accountName(account) : c.author?.name ?? getMember(c.authorId).name;
  // Auteur réel : la photo et le nom mènent à sa page personnelle.
  const memberTo = !mine && c.author?.uid ? `/social/membre/${encodeURIComponent(c.author.uid)}` : null;
  return (
    <div className={cn('flex gap-2.5', c.pending && 'opacity-60')}>
      {mine ? (
        <Avatar name={name} hue={account.hue} src={account.avatar} size="xs" />
      ) : c.author ? (
        memberTo ? <Link to={memberTo} state={{ name, avatar: c.author.avatar }} className="shrink-0"><Avatar name={name} hue={hueOf(name)} src={c.author.avatar} size="xs" /></Link> : <Avatar name={name} hue={hueOf(name)} src={c.author.avatar} size="xs" />
      ) : (
        <MemberAvatar memberId={c.authorId} size="xs" />
      )}
      <div className="min-w-0">
        <div className="rounded-2xl rounded-tl-md bg-surface-sunken px-3 py-2">
          <p className="text-[13px] font-bold">{memberTo ? <Link to={memberTo} state={{ name, avatar: c.author?.avatar }} className="hover:underline">{name}</Link> : name}</p>
          <p className="break-words text-[13.5px] text-ink-soft">{c.text}</p>
        </div>
        <p className="mt-0.5 px-2 text-[11px] text-ink-faint">{c.pending ? 'Envoi…' : timeAgo(c.createdAt)}</p>
      </div>
    </div>
  );
}

export function CommentInput({ onSubmit, autoFocus, placeholder = 'Écrire un commentaire…', dark }: { onSubmit: (text: string) => void; autoFocus?: boolean; placeholder?: string; dark?: boolean }) {
  const account = useApp((s) => s.account);
  const location = useLocation();
  const [text, setText] = useState('');
  if (!account) return <Link to="/connexion" state={{ from: location.pathname + location.search }} className="block rounded-xl bg-mint-50 px-4 py-3 text-center text-sm font-semibold text-brand-800">Connectez-vous pour commenter</Link>;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2.5">
      {!dark && <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="xs" />}
      <div className={cn('flex h-10 flex-1 items-center rounded-full pl-4 pr-1 focus-within:ring-2', dark ? 'bg-white/95 text-ink focus-within:ring-white/40' : 'bg-surface-sunken focus-within:ring-brand-500/25')}>
        <input autoFocus={autoFocus} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
        <button type="submit" disabled={!text.trim()} aria-label="Envoyer" className="flex h-8 w-8 items-center justify-center rounded-full text-brand-700 transition hover:bg-mint-100 disabled:opacity-30">
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}

/** Commentaires d'une publication de l'API : lus et envoyés sur le serveur. */
function RemoteComments({ post, autoFocus }: { post: Post; autoFocus?: boolean }) {
  const state = commentsStore.use((s) => s.byPost[post.id]);
  useEffect(() => {
    loadRemoteComments(post);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);
  const items = state?.items ?? [];
  return (
    <div className="space-y-3">
      {!state || (state.loading && items.length === 0) ? (
        <div className="space-y-2.5" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5">
              <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
              <span className="h-12 w-2/3 animate-pulse rounded-2xl bg-surface-sunken" />
            </div>
          ))}
        </div>
      ) : state.error && items.length === 0 ? (
        <p className="flex items-center justify-center gap-2 text-center text-[13px] text-ink-muted">
          Commentaires indisponibles.
          <button onClick={() => loadRemoteComments(post, true)} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
            <RotateCw size={13} /> Réessayer
          </button>
        </p>
      ) : (
        items.length === 0 && <p className="text-center text-[13px] text-ink-muted">Soyez le premier à commenter.</p>
      )}
      {items.map((c) => (
        <CommentRow key={c.id} c={c} />
      ))}
      <CommentInput autoFocus={autoFocus} onSubmit={(t) => addRemoteComment(post, t)} />
    </div>
  );
}

export function CommentsSection({ post, autoFocus }: { post: Post; autoFocus?: boolean }) {
  if (post.remote) return <RemoteComments post={post} autoFocus={autoFocus} />;
  return (
    <div className="space-y-3">
      {post.comments.length === 0 && <p className="text-center text-[13px] text-ink-muted">Soyez le premier à commenter.</p>}
      {post.comments.map((c) => (
        <CommentRow key={c.id} c={c} />
      ))}
      <CommentInput autoFocus={autoFocus} onSubmit={(t) => actions.addComment(post.id, t)} />
    </div>
  );
}

/* ───────────── Modales ───────────── */

export function ReportModal({ open, onClose, subject = 'la publication' }: { open: boolean; onClose: () => void; subject?: string }) {
  const reasons = ['Contenu inapproprié', 'Fausse information', 'Spam ou arnaque', 'Atteinte à une personne', 'Autre raison'];
  const [reason, setReason] = useState<string | null>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Signaler ${subject}`}
      description="Votre signalement est anonyme et sera examiné par l'administration."
      size="sm"
      footer={
        <Button
          disabled={!reason}
          onClick={() => {
            onClose();
            setReason(null);
            toast('Merci, votre signalement a été envoyé');
          }}
        >
          Envoyer le signalement
        </Button>
      }
    >
      <div className="space-y-1.5">
        {reasons.map((r) => (
          <label key={r} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition', reason === r ? 'border-brand-400 bg-mint-50' : 'border-line hover:bg-surface-sunken')}>
            <input type="radio" name="reason" className="accent-brand-600" checked={reason === r} onChange={() => setReason(r)} />
            {r}
          </label>
        ))}
      </div>
    </Modal>
  );
}

function EditPostModal({ post, open, onClose }: { post: Post; open: boolean; onClose: () => void }) {
  const [body, setBody] = useState(post.body);
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier la publication"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!body.trim() || saving}
            loading={saving}
            onClick={async () => {
              if (post.remote) {
                // Publication réelle : modifiée sur le serveur.
                setSaving(true);
                try {
                  await editRemotePost(post, body.trim());
                  onClose();
                  toast('Publication mise à jour');
                } catch (e) {
                  toast((e as Error).message, { tone: 'danger' });
                } finally {
                  setSaving(false);
                }
                return;
              }
              actions.updatePost(post.id, { body: body.trim() });
              onClose();
              toast('Publication mise à jour');
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="field h-auto resize-none py-3" />
    </Modal>
  );
}

/* ───────────── En-tête & actions ───────────── */

export function PostHeader({ post }: { post: Post }) {
  const author = post.author ? { ...getMember(post.authorId), name: post.author.name, verified: post.author.verified } : getMember(post.authorId);
  const account = useApp((s) => s.account);
  const saved = useApp((s) => !!s.saved[post.id]);
  const following = useApp((s) => s.following.includes(post.authorId));
  const isFriend = useApp((s) => s.friends.includes(post.authorId));
  const [reporting, setReporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const myRemote = isMyRemotePost(post);
  const mine = post.authorId === 'me' || myRemote;
  const social = post.kind === 'communaute';
  const name = mine && account ? accountName(account) : author.name;
  const profileTo = mine ? '/social/profil' : `/social/profil/${post.authorId}`;
  // Publication de l'API : la photo et le nom mènent à la page du membre ou de la page qui l'a publiée.
  const authorUid = post.remote && post.author?.uid && post.author.uid !== account?.uid ? post.author.uid : '';
  const authorPage = post.remote ? post.author?.pageId ?? '' : '';
  const memberTo = authorUid ? `/social/membre/${encodeURIComponent(authorUid)}` : authorPage ? `/social/page/${encodeURIComponent(authorPage)}` : null;
  const followKind = authorPage ? 'page' : 'user';
  const followId = authorPage || authorUid;
  const followingAuthor = useFollowing(followKind, followId);
  const followBusy = useFollowBusy(followKind, followId);
  const isRemoteFriend = useFriends((s) => !!authorUid && s.friends.some((f) => f.uid === authorUid));
  const requireLogin = () => navigate('/connexion', { state: { from: location.pathname + location.search } });
  // Bouton « Suivre » : auteur réel que l'on ne suit pas encore et qui n'est pas déjà un ami.
  const showFollow = !!followId && !isRemoteFriend;

  return (
    <div className="flex items-start gap-3">
      {post.remote && memberTo ? (
        <Link to={memberTo} state={{ name, avatar: post.author?.avatar }} className="shrink-0" aria-label={`Profil de ${name}`}><Avatar name={name} hue={hueOf(name)} src={post.author?.avatar} official={post.author?.official} size="md" /></Link>
      ) : post.remote ? (
        <span className="shrink-0"><Avatar name={name} hue={hueOf(name)} src={post.author?.avatar} official={post.author?.official} size="md" /></span>
      ) : social ? (
        <Link to={profileTo} className="shrink-0" aria-label={`Profil de ${name}`}>
          {mine && account ? <Avatar name={name} hue={account.hue} src={account.avatar} size="md" /> : <MemberAvatar member={author} size="md" />}
        </Link>
      ) : (
        <span className="shrink-0"><MemberAvatar member={author} size="md" /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-[15px] font-bold text-ink">
          {memberTo ? <Link to={memberTo} state={{ name, avatar: post.author?.avatar }} className="truncate hover:underline">{name}</Link> : social && !post.remote ? <Link to={profileTo} className="truncate hover:underline">{name}</Link> : <span className="truncate">{name}</span>}
          {author.verified && !mine && <BadgeCheck size={16} className="shrink-0 fill-brand-600 text-white" />}
          {post.pinned && <Pin size={13} className="shrink-0 text-brand-600" aria-label="Épinglée" />}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
          {social ? (
            <>
              {post.audience === 'amis' ? <Users size={12} /> : <Globe size={12} />}
              <span>{post.audience === 'amis' ? 'Amis' : 'Public'}</span>
            </>
          ) : (
            <Chip tone={tagTone[post.kind]}>{post.tag}</Chip>
          )}
          <span>·</span>
          <time dateTime={post.createdAt}>{post.scheduledFor ? `Programmée · ${timeAgo(post.scheduledFor)}` : timeAgo(post.createdAt)}</time>
        </div>
      </div>
      {showFollow && (
        <button
          disabled={followBusy}
          onClick={() => account ? void toggleFollow(followKind, followId, name) : requireLogin()}
          className={cn('h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition disabled:opacity-60', followingAuthor ? 'bg-surface-sunken text-ink-soft hover:bg-line' : 'bg-mint-100 text-brand-800 hover:bg-mint-200')}
        >
          {followingAuthor ? 'Suivi' : 'Suivre'}
        </button>
      )}
      {social && !mine && !isFriend && !post.remote && (
        <button
          onClick={() => toast(actions.toggleFollow(post.authorId) ? `Vous suivez ${author.name}` : `Vous ne suivez plus ${author.name}`)}
          className={cn('h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition', following ? 'bg-surface-sunken text-ink-soft hover:bg-line' : 'bg-mint-100 text-brand-800 hover:bg-mint-200')}
        >
          {following ? 'Suivi' : 'Suivre'}
        </button>
      )}
      <Popover className="w-64" trigger={({ toggle, open }) => <IconButton icon={Ellipsis} label="Options de la publication" size="sm" active={open} onClick={toggle} />}>
        {(close) => (
          <div className="p-1.5">
            {mine ? (
              <>
                <MenuItem icon={Pencil} onClick={() => { close(); setEditing(true); }}>Modifier</MenuItem>
                {!post.remote && (
                  <MenuItem icon={post.pinned ? PinOff : Pin} onClick={() => { close(); actions.togglePin(post.id); toast(post.pinned ? 'Publication désépinglée' : 'Publication épinglée en haut de votre profil'); }}>
                    {post.pinned ? 'Désépingler' : 'Épingler'}
                  </MenuItem>
                )}
                <MenuItem
                  icon={Trash2}
                  tone="danger"
                  onClick={async () => {
                    close();
                    if (await confirmDialog({ title: 'Supprimer la publication ?', message: 'Elle sera retirée de votre profil et du fil.', confirmLabel: 'Supprimer', tone: 'danger' })) {
                      if (post.remote) {
                        try {
                          await deleteRemotePost(post);
                          toast('Publication supprimée');
                        } catch (e) {
                          toast((e as Error).message, { tone: 'danger' });
                        }
                        return;
                      }
                      actions.deletePost(post.id);
                      toast('Publication supprimée');
                    }
                  }}
                >
                  Supprimer
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem icon={Bookmark} onClick={() => { close(); if (!account) requireLogin(); else if (post.remote) toggleRemoteSave(post); else toast(actions.toggleSave(post.id) ? 'Publication enregistrée' : 'Retirée de vos enregistrements'); }}>
                  {(post.remote ? post.savedByMe : saved) ? 'Retirer des enregistrements' : 'Enregistrer la publication'}
                </MenuItem>
                <MenuItem
                  icon={Link2}
                  onClick={async () => {
                    close();
                    const ok = await copyText(`${window.location.origin}${postUrl(post)}`);
                    toast(ok ? 'Lien copié' : 'Copie impossible', { tone: ok ? 'success' : 'danger' });
                  }}
                >
                  Copier le lien
                </MenuItem>
                <MenuItem
                  icon={EyeOff}
                  hint="Ne plus voir cette publication"
                  onClick={() => {
                    close();
                    actions.hidePost(post.id);
                    toast('Publication masquée', { action: { label: 'Annuler', onClick: () => actions.unhidePost(post.id) } });
                  }}
                >
                  Masquer
                </MenuItem>
                <MenuItem icon={Flag} tone="danger" onClick={() => { close(); setReporting(true); }}>Signaler</MenuItem>
              </>
            )}
          </div>
        )}
      </Popover>
      <ReportModal open={reporting} onClose={() => setReporting(false)} />
      {editing && <EditPostModal post={post} open onClose={() => setEditing(false)} />}
    </div>
  );
}

export function PostActions({ post, onComment, onOpen }: { post: Post; onComment: () => void; onOpen?: () => void }) {
  const account = useApp((s) => s.account);
  const navigate = useNavigate();
  const location = useLocation();
  const localLiked = useApp((s) => !!s.liked[post.id]);
  const localSaved = useApp((s) => !!s.saved[post.id]);
  const liked = post.remote ? !!post.likedByMe : localLiked;
  const saved = post.remote ? !!post.savedByMe : localSaved;
  const social = post.kind === 'communaute';
  const likes = post.remote ? post.likes : post.likes + (liked ? 1 : 0);
  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13.5px] font-semibold transition hover:bg-surface-sunken';
  const LikeIcon = social ? Heart : ThumbsUp;
  const reactors = post.reactors ?? [];
  const requireLogin = () => navigate('/connexion', { state: { from: location.pathname + location.search } });

  return (
    <div className="flex items-center gap-0.5 border-t border-line/70 pt-2">
      <button
        className={cn(btn, liked ? (social ? 'text-danger' : 'text-brand-700') : 'text-ink-soft')}
        onClick={() => !account ? requireLogin() : post.remote ? toggleRemoteLike(post) : actions.toggleLike(post.id)}
        aria-pressed={liked}
        aria-label={liked ? "Je n'aime plus" : "J'aime"}
      >
        <LikeIcon size={19} className={cn(liked && 'animate-like-pop', liked && (social ? 'fill-danger' : 'fill-brand-600/15'))} strokeWidth={liked ? 2.3 : 1.9} />
        {compactNumber(likes)}
      </button>
      <button className={cn(btn, 'text-ink-soft')} onClick={() => account ? onComment() : requireLogin()} aria-label="Commenter">
        <MessageCircle size={19} strokeWidth={1.9} />
        {post.commentsCount ?? post.comments.length}
      </button>
      <button
        className={cn(btn, 'text-ink-soft')}
        aria-label="Partager"
        onClick={() => openShare({ title: post.title ?? post.body.slice(0, 70), url: postUrl(post), onShared: () => actions.sharePost(post.id) })}
      >
        {social ? <Send size={18} strokeWidth={1.9} /> : <Share2 size={18} strokeWidth={1.9} />}
        {post.shares > 0 && post.shares}
      </button>
      <button
        className={cn(btn, saved ? 'text-brand-700' : 'text-ink-soft')}
        aria-pressed={saved}
        aria-label={saved ? 'Retirer des enregistrements' : 'Enregistrer'}
        onClick={() => !account ? requireLogin() : post.remote ? toggleRemoteSave(post) : toast(actions.toggleSave(post.id) ? 'Publication enregistrée' : 'Retirée de vos enregistrements')}
      >
        <Bookmark size={18} strokeWidth={1.9} className={cn(saved && 'fill-brand-600')} />
      </button>
      {social ? (
        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-ink-muted">
          {reactors.length > 0 && (
            <span className="flex -space-x-2">
              {reactors.slice(0, 3).map((r) => (
                <MemberAvatar key={r} memberId={r} size="xs" className="rounded-full ring-2 ring-surface" />
              ))}
            </span>
          )}
          {likes} réaction{likes > 1 ? 's' : ''}
        </span>
      ) : (
        onOpen && (
          <button onClick={onOpen} className="ml-auto inline-flex h-9 items-center gap-1 rounded-full bg-surface-sunken px-3.5 text-[13px] font-semibold text-ink-soft transition hover:bg-line">
            Voir plus <ChevronRight size={15} />
          </button>
        )
      )}
    </div>
  );
}

/* ───────────── Corps ───────────── */

export function PostBody({ post, clamp, onOpen }: { post: Post; clamp?: boolean; onOpen?: () => void }) {
  const navigate = useNavigate();
  const bg = bgCss(post.background);
  if (bg && !post.images?.length && !post.videos?.length && !post.scene && !post.media) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl p-8 text-center" style={{ background: bg }}>
        <p className="font-display text-[22px] font-extrabold leading-snug text-white drop-shadow sm:text-2xl">{post.body}</p>
      </div>
    );
  }
  return (
    <>
      {post.title && <h3 className="font-display text-[17px] font-extrabold leading-snug text-ink">{post.title}</h3>}
      <p className={cn('whitespace-pre-line break-words text-[14.5px] leading-relaxed text-ink-soft', clamp && 'line-clamp-3')}>{post.body}</p>
      {post.media && <PosterGrid media={post.media} onOpen={onOpen} />}
      {post.images && post.images.length > 0 && (
        <button type="button" onClick={onOpen} className={cn('grid w-full gap-1 overflow-hidden rounded-xl', post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {post.images.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" className={cn('w-full object-cover', post.images!.length > 1 ? 'aspect-square' : 'max-h-[520px]')} />
          ))}
        </button>
      )}
      {post.scene && <VideoFrame scene={post.scene} onExpand={() => navigate('/social/cele-vibes')} />}
      {post.videos?.map((src, i) => <video key={src} src={src} poster={post.videoPosters?.[i] || undefined} controls preload="metadata" playsInline className="max-h-[560px] w-full rounded-xl bg-night" />)}
    </>
  );
}

export function PostCard({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const social = post.kind === 'communaute';
  return (
    <article id={`publication-${post.id}`} className={cn('card animate-fade-in p-4 sm:p-5', social && 'rounded-2xl')}>
      <PostHeader post={post} />
      <div className="mt-3 space-y-3">
        <PostBody post={post} clamp onOpen={onOpen} />
        <PostActions post={post} onComment={() => setShowComments((v) => !v)} onOpen={onOpen} />
        {social && !post.remote && post.comments.length > 0 && !showComments && (
          <button onClick={() => setShowComments(true)} className="text-[13px] font-semibold text-ink-muted hover:underline">
            Voir les {post.comments.length} commentaire{post.comments.length > 1 ? 's' : ''}
          </button>
        )}
        {showComments && (
          <div className="animate-fade-in border-t border-line/70 pt-3">
            <CommentsSection post={post} autoFocus />
          </div>
        )}
      </div>
    </article>
  );
}

export function PostDetailModal({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  // Abonnement aux deux listes pour suivre les mises à jour (commentaires, likes).
  useApp((s) => s.officialPosts);
  useApp((s) => s.socialPosts);
  remoteFeedStore.use((s) => s.posts);
  const { pathname } = useLocation();
  const [fetching, setFetching] = useState<string | null>(null);
  // Publication de l'API absente du fil chargé (ex. ouverte depuis une notification) : on la demande au serveur.
  useEffect(() => {
    if (!postId?.startsWith('api-') || findRemotePost(postId)) return;
    setFetching(postId);
    fetchRemotePost(postId, pathname.startsWith('/social') ? 'communaute' : 'actualite')
      .catch(() => null)
      .finally(() => setFetching(null));
  }, [postId, pathname]);
  if (!postId) return null;
  const post = findPost(postId) ?? findRemotePost(postId);
  if (!post && fetching === postId) {
    return (
      <Modal open onClose={onClose} size="lg">
        <p className="py-10 text-center text-sm text-ink-muted">Chargement de la publication…</p>
      </Modal>
    );
  }
  if (!post) {
    return (
      <Modal open onClose={onClose} title="Publication introuvable" size="sm">
        <p className="text-sm text-ink-muted">Cette publication n'existe plus ou a été retirée.</p>
      </Modal>
    );
  }
  return (
    <Modal open onClose={onClose} size="lg">
      <div className="space-y-4">
        <PostHeader post={post} />
        <PostBody post={post} />
        <PostActions post={post} onComment={() => document.getElementById('detail-comment')?.querySelector('input')?.focus()} />
        <div id="detail-comment">
          <CommentsSection post={post} />
        </div>
      </div>
    </Modal>
  );
}
