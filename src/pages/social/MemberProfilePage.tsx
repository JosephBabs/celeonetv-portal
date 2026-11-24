import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Check, ChevronLeft, Church, CircleCheck, Clock, Film, Flag, Images, Info, MapPin, MessageCircle, Newspaper, Play, UserMinus, UserPlus, UserRoundCheck } from 'lucide-react';
import { REAL_DISCUSSIONS, openDirect } from '@/services/conversations';
import { api } from '@/lib/api';
import type { Post } from '@/data/types';
import { useApp } from '@/store/app';
import { confirmDialog } from '@/store/ui';
import { remoteFeedStore, toPost } from '@/services/feed';
import { friendActions, personHue, useFriends, type Person } from '@/services/friends';
import { rememberFollow, toggleFollow, useFollowBusy, useFollowing, type FollowKind } from '@/services/follows';
import { useFullProfile, type PublicProfile } from '@/services/profiles';
import { absolute } from '@/services/streaming';
import { VideoCover } from '@/components/MediaPlayer';
import { PostCard, PostDetailModal } from '@/components/feed/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState, PostSkeleton } from '@/components/ui/Feedback';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { cn, compactNumber, formatDate } from '@/lib/utils';

type Tab = 'apropos' | 'posts' | 'photos' | 'videos';
type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
const num = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'number' && Number.isFinite(v)) return v;
  return undefined;
};

/* ───────────── Données ───────────── */

/** Fiche d'une page (GET /v1/pages/{id}). */
function usePageProfile(id: string, enabled: boolean) {
  const [profile, setProfile] = useState<PublicProfile & { verified?: boolean; category?: string }>();
  const [loading, setLoading] = useState(enabled);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    api
      .get<unknown>(`/v1/pages/${encodeURIComponent(id)}`)
      .then((raw) => {
        if (!alive) return;
        const r = isObj(raw) && isObj(raw.page) ? raw.page : isObj(raw) ? raw : {};
        const d: Raw = { ...(isObj(r.data) ? r.data : {}), ...(isObj(r.legacy_data) ? r.legacy_data : {}), ...r };
        const following = d.isFollowing ?? d.following ?? d.viewerFollowing;
        if (typeof following === 'boolean') rememberFollow('page', id, following);
        setProfile({
          name: str(d.name, d.title, d.displayName, d.pageName) || undefined,
          avatar: absolute(str(d.avatar, d.avatarUrl, d.logo, d.logoUrl, d.photoURL, d.profileImage, d.image, d.imageUrl)) || undefined,
          cover: absolute(str(d.cover, d.coverUrl, d.coverURL, d.coverImage, d.banner, d.bannerUrl)) || undefined,
          bio: str(d.description, d.bio, d.about) || undefined,
          place: [str(d.city), str(d.country)].filter(Boolean).join(', ') || undefined,
          followers: num(d.followersCount, d.followers_count, d.followerCount),
          posts: num(d.postsCount, d.posts_count),
          verified: d.verified === true || d.isVerified === true,
          category: str(d.category, d.type) || undefined,
        });
      })
      .catch(() => alive && setProfile({}))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, enabled]);
  return { profile, loading };
}

/** Publications d'un membre (/v1/social/content?authorId=…) ou d'une page (/v1/pages/{id}/content). */
function useProfilePosts(kind: FollowKind, id: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [next, setNext] = useState<number | null>(null);
  const posts = remoteFeedStore.use((s) => s.posts);

  const load = async (cursor?: number) => {
    try {
      const res =
        kind === 'page'
          ? await api.getRaw<Raw>(`/v1/pages/${encodeURIComponent(id)}/content`, { limit: 20, offset: cursor })
          : await api.getRaw<Raw>('/v1/social/content', { type: 'posts', authorId: id, limit: 20, before: cursor });
      const payload = isObj(res.data) ? res.data : res;
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(res.data) ? res.data : [];
      const mapped = items.map((i) => toPost(i, 'communaute')).filter((p): p is Post => !!p);
      remoteFeedStore.set((s) => ({ posts: { ...s.posts, ...Object.fromEntries(mapped.map((p) => [p.id, p])) } }));
      setIds((prev) => (cursor === undefined ? mapped.map((p) => p.id) : [...prev, ...mapped.map((p) => p.id).filter((x) => !prev.includes(x))]));
      const nextCursor = kind === 'page' ? payload.nextOffset : payload.nextCursor;
      setNext(payload.hasMore === true && typeof nextCursor === 'number' ? nextCursor : null);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    setIds([]);
    setStatus('loading');
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);

  const list = useMemo(() => ids.map((x) => posts[x]).filter((p): p is Post => !!p), [ids, posts]);
  return { list, status, more: next !== null, loadMore: () => (next !== null ? load(next) : undefined), reload: () => load() };
}

/* ───────────── Affichage ───────────── */

function Stat({ value, label }: { value?: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-black">{value === undefined ? '—' : compactNumber(value)}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

/** Vignette média (onglets Photos / Vidéos). */
function MediaTile({ image, video, onOpen }: { image?: string; video?: string; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-sunken">
      {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <VideoCover sources={video ? [video] : []} />}
      {video && <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"><Play size={15} className="ml-0.5 fill-white" /></span>}
    </button>
  );
}

/** Page personnelle d'un membre (/social/membre/:uid) ou page publique (/social/page/:pageId). */
export function MemberProfilePage({ kind = 'user' }: { kind?: FollowKind }) {
  const params0 = useParams();
  const id = (kind === 'page' ? params0.pageId : params0.uid) ?? '';
  const me = useApp((s) => s.account);
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('onglet') as Tab) || 'posts';
  const openPost = params.get('publication');
  const hint = (location.state ?? {}) as Partial<Person>;

  const member = useFullProfile(kind === 'user' ? id : '');
  const page = usePageProfile(id, kind === 'page');
  const { profile, loading } = kind === 'page' ? page : member;
  const posts = useProfilePosts(kind, id);
  const friends = useFriends((s) => s.friends);
  const incoming = useFriends((s) => s.incoming);
  const outgoing = useFriends((s) => s.outgoing);
  const following = useFollowing(kind, id);
  const followBusy = useFollowBusy(kind, id);
  const [pageFollowers, setPageFollowers] = useState<number>();
  // Abonnés : le chiffre du serveur, corrigé seulement par les clics faits sur cette page.
  const [delta, setDelta] = useState(0);
  const [opening, setOpening] = useState(false);

  // Fiche d'un membre : sa liste d'abonnés indique si on le suit déjà.
  useEffect(() => {
    if (kind === 'user' && me?.uid && profile?.followerIds) rememberFollow('user', id, profile.followerIds.includes(me.uid));
  }, [kind, id, me?.uid, profile?.followerIds]);

  const known = friends.find((p) => p.uid === id) ?? incoming.find((r) => r.person.uid === id)?.person ?? outgoing.find((r) => r.person.uid === id)?.person;
  const sample = posts.list.find((p) => (kind === 'page' ? p.author?.pageId === id : p.author?.uid === id));
  const name = profile?.name ?? (known && known.name !== 'Membre CélèOne' ? known.name : undefined) ?? hint.name ?? sample?.author?.name ?? (kind === 'page' ? 'Page CélèOne' : 'Membre CélèOne');
  const avatar = profile?.avatar ?? known?.avatar ?? hint.avatar ?? sample?.author?.avatar;
  const person: Person = { uid: id, name, avatar, place: profile?.place ?? known?.place };
  const hue = personHue(person);

  if (kind === 'user' && me?.uid && id === me.uid) return <Navigate to="/social/profil" replace />;

  const isFriend = friends.some((p) => p.uid === id);
  const inReq = incoming.find((r) => r.person.uid === id);
  const outReq = outgoing.find((r) => r.person.uid === id);
  const followers = pageFollowers ?? (profile?.followers !== undefined ? Math.max(0, profile.followers + delta) : undefined);

  const friendButton = kind === 'page' ? null : isFriend ? (
    <Popover className="w-56" trigger={({ toggle }) => <Button variant="soft" icon={CircleCheck} block onClick={toggle}>Amis</Button>}>
      {(close) => (
        <div className="p-1.5">
          <MenuItem icon={UserMinus} tone="danger" onClick={async () => { close(); if (await confirmDialog({ title: `Retirer ${name} de vos amis ?`, confirmLabel: 'Retirer', tone: 'danger' })) void friendActions.remove(person); }}>Retirer cet ami</MenuItem>
        </div>
      )}
    </Popover>
  ) : inReq ? (
    <Button icon={UserRoundCheck} block onClick={() => void friendActions.accept(inReq)}>Confirmer la demande</Button>
  ) : outReq ? (
    <Button variant="soft" icon={Clock} block disabled={outReq.id.startsWith('tmp-')} onClick={() => void friendActions.cancel(outReq)}>Invitation envoyée</Button>
  ) : (
    <Button icon={UserPlus} block onClick={() => void friendActions.send(person)}>Inviter en ami</Button>
  );

  const photos = posts.list.flatMap((p) => (p.images ?? []).map((src) => ({ src, id: p.id })));
  const videos = posts.list.flatMap((p) => (p.videos ?? []).map((src) => ({ src, id: p.id })));
  const tabs: { id: Tab; label: string }[] = [
    { id: 'apropos', label: 'À propos' },
    { id: 'posts', label: 'Posts' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Vidéos' },
  ];
  const open = (postId: string) => setParams({ onglet: tab, publication: postId });
  const postCount = profile?.posts ?? (posts.status === 'ready' && !posts.more ? posts.list.length : undefined);

  const stateView = (icon: typeof Newspaper, empty: string, count: number) =>
    posts.status === 'loading' ? (
      <div className="space-y-4" aria-busy="true"><PostSkeleton /><PostSkeleton /></div>
    ) : posts.status === 'error' ? (
      <div className="card rounded-2xl"><EmptyState icon={icon} title="Publications indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button onClick={() => void posts.reload()}>Réessayer</Button>} /></div>
    ) : count === 0 ? (
      <div className="card rounded-2xl"><EmptyState icon={icon} title={empty} /></div>
    ) : null;
  const more = posts.more && <div className="flex justify-center"><Button variant="soft" onClick={() => void posts.loadMore()}>Voir plus</Button></div>;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-3xl">
        <div className="relative h-40 sm:h-56" style={profile?.cover ? undefined : { background: `linear-gradient(120deg, hsl(${hue} 45% 22%), hsl(${(hue + 50) % 360} 50% 38%))` }}>
          {profile?.cover && <img src={profile.cover} alt="" className="h-full w-full object-cover" />}
          <IconButton icon={ChevronLeft} label="Retour" variant="glass" className="absolute left-3 top-3" onClick={() => navigate(-1)} />
        </div>
        <div className="px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="-mt-14 w-fit shrink-0 rounded-full bg-surface p-1.5">
              <Avatar name={name} hue={hue} src={avatar} size="xl" className="[&_img]:!h-28 [&_img]:!w-28 [&>span]:!h-28 [&>span]:!w-28" />
            </div>
            <div className="min-w-0 flex-1 sm:pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-mint-100 px-3 py-1 text-xs font-semibold text-brand-800">
                {kind === 'page' ? <Flag size={13} /> : <UserRoundCheck size={13} />} {kind === 'page' ? 'Page' : 'Profil personnel'}
              </span>
              <h1 className="mt-1.5 flex items-center gap-1.5 truncate text-[26px] font-black leading-tight">
                {loading && /^(Membre|Page) CélèOne$/.test(name) ? <span className="skeleton inline-block h-7 w-48 rounded" /> : name}
                {kind === 'page' && 'verified' in (profile ?? {}) && (profile as { verified?: boolean }).verified && <BadgeCheck size={22} className="shrink-0 fill-brand-600 text-white" />}
              </h1>
              {kind === 'user' && profile?.creator && <p className="text-sm font-medium text-ink-muted">Profil créateur</p>}
              {kind === 'page' && (profile as { category?: string } | undefined)?.category && <p className="text-sm font-medium text-ink-muted">{(profile as { category?: string }).category}</p>}
            </div>
          </div>

          <div className={cn('mt-4 grid rounded-2xl border border-line py-3', kind === 'page' ? 'grid-cols-2' : 'grid-cols-3')}>
            <Stat value={postCount} label="Publications" />
            <Stat value={followers} label="Abonnés" />
            {kind === 'user' && <Stat value={profile?.following} label="Suivis" />}
          </div>

          <div className={cn('mt-3 grid gap-2', friendButton ? 'grid-cols-2' : 'grid-cols-1')}>
            <Button variant={following ? 'soft' : 'secondary'} icon={following ? Check : UserPlus} loading={followBusy} block onClick={async () => { const after = await toggleFollow(kind, id, name, setPageFollowers); if (after !== following) setDelta((d) => d + (after ? 1 : -1)); }}>
              {following ? 'Suivi' : 'Suivre'}
            </Button>
            {friendButton}
          </div>
          {kind === 'user' && REAL_DISCUSSIONS && (
            <Button
              variant="ghost"
              icon={MessageCircle}
              block
              className="mt-2"
              loading={opening}
              onClick={async () => {
                setOpening(true);
                const convId = await openDirect(id);
                setOpening(false);
                if (convId) navigate(`/discussions/${encodeURIComponent(convId)}`);
              }}
            >
              Message
            </Button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 scrollbar-none" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setParams({ onglet: t.id }, { replace: true })} className={cn('h-10 shrink-0 rounded-full px-5 text-sm font-semibold transition', tab === t.id ? 'bg-night text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Publications à la suite, comme un fil (style X). */}
      {tab === 'posts' &&
        (stateView(Newspaper, 'Aucune publication pour le moment', posts.list.length) ?? (
          <>
            <div className="space-y-4">{posts.list.map((p) => <PostCard key={p.id} post={p} onOpen={() => open(p.id)} />)}</div>
            {more}
          </>
        ))}
      {tab === 'photos' &&
        (stateView(Images, 'Aucune photo pour le moment', photos.length) ?? (
          <>
            <div className="grid grid-cols-3 gap-2">{photos.map((ph, i) => <MediaTile key={`${ph.id}-${i}`} image={ph.src} onOpen={() => open(ph.id)} />)}</div>
            {more}
          </>
        ))}
      {tab === 'videos' &&
        (stateView(Film, 'Aucune vidéo pour le moment', videos.length) ?? (
          <>
            <div className="grid grid-cols-3 gap-2">{videos.map((v, i) => <MediaTile key={`${v.id}-${i}`} video={v.src} onOpen={() => open(v.id)} />)}</div>
            {more}
          </>
        ))}
      {tab === 'apropos' && (
        <div className="card space-y-4 rounded-2xl p-5">
          <h2 className="text-lg font-extrabold">À propos</h2>
          {[
            { icon: Info, label: kind === 'page' ? 'Description' : 'Bio', value: profile?.bio },
            { icon: Church, label: 'Paroisse', value: profile?.parish },
            { icon: MapPin, label: 'Ville', value: profile?.place },
            { icon: Newspaper, label: 'Dernière publication', value: posts.list[0] ? formatDate(posts.list[0].createdAt) : undefined },
          ]
            .filter((r) => r.value)
            .map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <span className="icon-tile h-10 w-10 rounded-xl"><r.icon size={18} /></span>
                <div><p className="text-xs text-ink-muted">{r.label}</p><p className="whitespace-pre-line text-sm font-semibold">{r.value}</p></div>
              </div>
            ))}
          {!profile?.bio && !profile?.parish && !profile?.place && !posts.list.length && <p className="text-sm text-ink-muted">{loading ? 'Chargement…' : `${name} n'a pas encore renseigné ces informations.`}</p>}
        </div>
      )}

      <PostDetailModal postId={openPost} onClose={() => setParams({ onglet: tab })} />
    </div>
  );
}

/** Route /social/page/:pageId. */
export function PageProfilePage() {
  return <MemberProfilePage kind="page" />;
}
