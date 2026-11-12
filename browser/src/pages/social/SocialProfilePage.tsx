import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight, BadgeCheck, Bookmark, Camera, CircleDashed, CirclePlus, Clapperboard, Ellipsis, Flag, Images, Info, LayoutGrid, Lock, MapPin,
  MessageCircle, Mail, Newspaper, Pencil, Phone, Settings, Flag as FlagIcon, UserCheck, UserPlus, UserRound, Users, ChevronRight, Church,
} from 'lucide-react';
import { getMember } from '@/data/members';
import type { Post } from '@/data/types';
import { accountName, actions, useApp } from '@/store/app';
import { chat } from '@/store/chat';
import { confirmDialog, toast } from '@/store/ui';
import { compressImage } from '@/lib/image';
import { Avatar, MemberAvatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Toggle';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { PostCard, PostDetailModal, ReportModal } from '@/components/feed/PostCard';
import { Scene } from '@/components/feed/Scene';
import { ComposerModal } from '@/components/social/Composers';
import { cn, compactNumber } from '@/lib/utils';

type Tab = 'publications' | 'vibes' | 'photos' | 'apropos' | 'enregistrees';

function SocialSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState({ publicProfile: true, friendRequests: true, showOnline: true, tagReview: false, comments: true });
  const rows: [keyof typeof prefs, string, string][] = [
    ['publicProfile', 'Profil public', 'Tout le monde peut voir vos publications publiques'],
    ['friendRequests', "Demandes d'amis", "Autoriser tous les membres à vous envoyer une demande"],
    ['showOnline', 'Statut en ligne', 'Montrer à vos amis quand vous êtes connecté'],
    ['comments', 'Commentaires', 'Autoriser les commentaires sur vos publications'],
    ['tagReview', 'Vérifier les identifications', 'Valider avant d’apparaître dans une publication'],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Paramètres sociaux" description="Contrôlez ce que la communauté voit de vous." footer={<Button onClick={() => { onClose(); toast('Paramètres sociaux enregistrés'); }}>Enregistrer</Button>}>
      <div className="divide-y divide-line">
        {rows.map(([key, label, hint]) => (
          <div key={key} className="flex items-center gap-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-ink-muted">{hint}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} label={label} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function CreatePageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Paroisse');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une page"
      description="Une page publique pour une paroisse, une chorale ou un ministère."
      footer={
        <Button disabled={name.trim().length < 3} onClick={() => { onClose(); setName(''); toast(`Page « ${name.trim()} » créée — en attente de validation`); }}>
          Créer la page
        </Button>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Nom de la page</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Ex. Chorale Béthel de Calavi" />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Catégorie</span>
          <div className="flex flex-wrap gap-2">
            {['Paroisse', 'Chorale', 'Ministère', 'Jeunesse', 'Média'].map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={cn('h-9 rounded-full border px-4 text-sm font-semibold', category === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:bg-surface-sunken')}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** « Menu du compte » du profil social (équivalent de l'écran mobile). */
export function AccountMenuModal({ open, onClose, onCreateStatus, onShowSaved, onShowPosts }: { open: boolean; onClose: () => void; onCreateStatus: () => void; onShowSaved: () => void; onShowPosts: () => void }) {
  const account = useApp((s) => s.account);
  const mode = useApp((s) => s.accountMode);
  const saved = useApp((s) => s.saved);
  const navigate = useNavigate();
  const [settings, setSettings] = useState(false);
  const [page, setPage] = useState(false);
  if (!account) return null;
  const savedCount = Object.values(saved).filter(Boolean).length;
  const rows = [
    { icon: Bookmark, label: 'Publications enregistrées', hint: savedCount ? `${savedCount} élément${savedCount > 1 ? 's' : ''} enregistré${savedCount > 1 ? 's' : ''}` : 'Aucune publication enregistrée', run: onShowSaved },
    { icon: LayoutGrid, label: 'Gérer mes publications', hint: 'Modifiez ou supprimez vos publications et Cele Vibes.', run: onShowPosts },
    { icon: Settings, label: 'Paramètres sociaux', hint: 'Confidentialité, demandes d’amis, commentaires.', run: () => setSettings(true) },
    { icon: FlagIcon, label: 'Créer une page', hint: 'Créez une page publique pour vos publications et Cele Vibes.', run: () => setPage(true) },
  ];
  return (
    <>
      <Modal open={open} onClose={onClose} title={<span><span className="eyebrow block">Profil social</span>Menu du compte</span>}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-line p-4">
            <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{accountName(account)}</p>
              <p className="text-xs text-ink-muted">{mode === 'page' ? 'Mode page' : 'Compte personnel'}</p>
            </div>
            <Button size="sm" variant="soft" icon={ArrowLeftRight} onClick={() => { const next = mode === 'page' ? 'personnel' : 'page'; actions.setAccountMode(next); toast(next === 'page' ? 'Vous publiez maintenant en tant que page' : 'Retour au compte personnel'); }}>
              Changer de mode
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: UserRound, label: 'Voir le profil', run: onClose },
              { icon: CirclePlus, label: 'Créer un statut', run: () => { onClose(); onCreateStatus(); } },
              { icon: Pencil, label: 'Modifier le profil', run: () => { onClose(); navigate('/profil/parametres/profil'); } },
            ].map((t) => (
              <button key={t.label} onClick={t.run} className="flex flex-col items-center gap-2 rounded-2xl border border-line px-2 py-4 text-center text-[13px] font-semibold transition hover:border-brand-300 hover:bg-mint-50">
                <t.icon size={20} className="text-brand-600" /> {t.label}
              </button>
            ))}
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {rows.map((r) => (
              <button key={r.label} onClick={() => { r.run(); if (r.run === onShowSaved || r.run === onShowPosts) onClose(); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-sunken">
                <span className="icon-tile h-10 w-10 rounded-xl"><r.icon size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{r.label}</span>
                  <span className="block text-xs text-ink-muted">{r.hint}</span>
                </span>
                <ChevronRight size={17} className="text-ink-faint" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
      <SocialSettingsModal open={settings} onClose={() => setSettings(false)} />
      <CreatePageModal open={page} onClose={() => setPage(false)} />
    </>
  );
}

export function SocialProfilePage() {
  const { userId } = useParams();
  const isMe = !userId || userId === 'me';
  const account = useApp((s) => s.account);
  const socialPosts = useApp((s) => s.socialPosts);
  const officialPosts = useApp((s) => s.officialPosts);
  const vibes = useApp((s) => s.vibes);
  const friends = useApp((s) => s.friends);
  const received = useApp((s) => s.friendRequests);
  const sent = useApp((s) => s.sentRequests);
  const blocked = useApp((s) => s.blocked);
  const savedMap = useApp((s) => s.saved);
  const following = useApp((s) => (userId ? s.following.includes(userId) : false));
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [composer, setComposer] = useState<'statut' | 'publication' | null>(null);
  const [reporting, setReporting] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const tab = (params.get('onglet') as Tab) || 'publications';
  const setTab = (t: Tab) => setParams({ onglet: t }, { replace: true });
  const openPost = params.get('publication');

  const member = getMember(isMe ? 'me' : userId!);
  const name = isMe && account ? accountName(account) : member.name;
  const id = isMe ? 'me' : userId!;
  const isFriend = friends.includes(id);
  const restricted = !isMe && member.private && !isFriend;

  const posts = useMemo(() => socialPosts.filter((p) => p.authorId === id).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)), [socialPosts, id]);
  const myVibes = useMemo(() => vibes.filter((v) => v.authorId === id), [vibes, id]);
  const photos = useMemo(() => posts.flatMap((p) => p.images ?? []), [posts]);
  const savedPosts = useMemo(() => [...officialPosts, ...socialPosts].filter((p) => savedMap[p.id]), [officialPosts, socialPosts, savedMap]);
  const savedVibes = useMemo(() => vibes.filter((v) => savedMap[v.id]), [vibes, savedMap]);

  if (!account) return null;
  if (!isMe && blocked.includes(id)) {
    return (
      <div className="card rounded-2xl">
        <EmptyState icon={Lock} title="Profil indisponible" text="Vous avez bloqué ce membre." action={<Button variant="ghost" onClick={() => { actions.unblockMember(id); toast('Membre débloqué'); }}>Débloquer</Button>} />
      </div>
    );
  }

  const upload = async (file: File | undefined, field: 'avatar' | 'cover') => {
    if (!file) return;
    try {
      const data = await compressImage(file, field === 'cover' ? 1400 : 480);
      actions.updateAccount({ [field]: data });
      toast(field === 'cover' ? 'Photo de couverture mise à jour' : 'Photo de profil mise à jour');
    } catch (e) {
      toast((e as Error).message, { tone: 'danger' });
    }
  };

  const friendButton = () => {
    if (isFriend)
      return (
        <Popover className="w-56" trigger={({ toggle }) => <Button variant="soft" icon={UserCheck} onClick={toggle}>Amis</Button>}>
          {(close) => (
            <div className="p-1.5">
              <MenuItem icon={Users} onClick={async () => { close(); if (await confirmDialog({ title: `Retirer ${name} de vos amis ?`, confirmLabel: 'Retirer', tone: 'danger' })) { actions.removeFriend(id); toast('Ami retiré'); } }}>Retirer de mes amis</MenuItem>
            </div>
          )}
        </Popover>
      );
    if (received.includes(id)) return <Button icon={UserCheck} onClick={() => { actions.acceptFriend(id); toast(`Vous êtes maintenant ami avec ${name}`); }}>Répondre · Confirmer</Button>;
    if (sent.includes(id)) return <Button variant="ghost" icon={UserCheck} onClick={() => { actions.cancelFriendRequest(id); toast('Demande annulée'); }}>Demande envoyée</Button>;
    return <Button icon={UserPlus} onClick={() => { actions.sendFriendRequest(id); toast(`Demande envoyée à ${name}`); }}>Ajouter en ami</Button>;
  };

  const tabs: { id: Tab; label: string; icon: typeof Newspaper; count?: number }[] = [
    { id: 'publications', label: 'Publications', icon: Newspaper, count: posts.length },
    { id: 'vibes', label: 'Cele Vibes', icon: Clapperboard, count: myVibes.length },
    { id: 'photos', label: 'Photos', icon: Images, count: photos.length },
    { id: 'apropos', label: 'À propos', icon: Info },
    ...(isMe ? [{ id: 'enregistrees' as Tab, label: 'Enregistrées', icon: Bookmark, count: savedPosts.length + savedVibes.length }] : []),
  ];

  const cover = isMe ? account.cover : undefined;
  const PostsList = ({ list, empty }: { list: Post[]; empty: string }) =>
    list.length === 0 ? (
      <div className="card rounded-2xl"><EmptyState icon={Newspaper} title={empty} /></div>
    ) : (
      <div className="space-y-4">{list.map((p) => <PostCard key={p.id} post={p} onOpen={() => setParams({ onglet: tab, publication: p.id })} />)}</div>
    );

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-3xl">
        <div className="relative h-40 sm:h-52" style={cover ? undefined : { background: `linear-gradient(120deg, hsl(${member.hue} 55% 42%), hsl(${(member.hue + 50) % 360} 60% 60%))` }}>
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
          {!cover && <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 80% 20%, white 0, transparent 40%)' }} />}
          {isMe && (
            <Button size="sm" variant="white" icon={Camera} className="absolute bottom-3 right-3" onClick={() => coverInput.current?.click()}>
              <span className="hidden sm:inline">Modifier la couverture</span>
            </Button>
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative -mt-12 w-fit shrink-0">
              {isMe ? <Avatar name={name} hue={account.hue} src={account.avatar} size="xl" className="rounded-full ring-4 ring-surface" /> : <MemberAvatar member={member} size="xl" className="rounded-full ring-4 ring-surface" />}
              {isMe && (
                <IconButton icon={Camera} label="Changer la photo de profil" size="sm" variant="white" className="absolute bottom-1 right-1 ring-1 ring-line" onClick={() => avatarInput.current?.click()} />
              )}
            </div>
            <div className="min-w-0 flex-1 sm:pt-3">
              <h1 className="flex items-center gap-1.5 text-[26px] font-black leading-tight">
                {name} {member.verified && !isMe && <BadgeCheck size={22} className="fill-brand-600 text-white" />}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted"><Church size={14} /> {isMe ? account.parish || 'Paroisse non renseignée' : member.parish}</p>
              {!restricted && (
                <p className="mt-1 text-sm text-ink-soft">
                  <b>{isMe ? friends.length : (member.mutualFriends ?? 0) + 40}</b> amis · <b>{posts.length}</b> publications · <b>{compactNumber(isMe ? 12 : 128 + member.hue)}</b> abonnés
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">
              {isMe ? (
                <>
                  <Button icon={CircleDashed} onClick={() => setComposer('statut')}>Créer un statut</Button>
                  <Button variant="ghost" icon={Pencil} to="/profil/parametres/profil">Modifier le profil</Button>
                  <IconButton icon={Ellipsis} label="Menu du compte" onClick={() => setMenuOpen(true)} />
                </>
              ) : (
                <>
                  {friendButton()}
                  {!restricted && <Button variant="ghost" icon={MessageCircle} onClick={() => navigate(`/discussions/${chat.ensureDirect(id)}`)}>Message</Button>}
                  <Popover className="w-56" trigger={({ toggle, open }) => <IconButton icon={Ellipsis} label="Plus d'options" active={open} onClick={toggle} />}>
                    {(close) => (
                      <div className="p-1.5">
                        <MenuItem icon={UserCheck} onClick={() => { close(); toast(actions.toggleFollow(id) ? `Vous suivez ${name}` : `Vous ne suivez plus ${name}`); }}>{following ? 'Ne plus suivre' : 'Suivre'}</MenuItem>
                        <MenuItem icon={Flag} tone="danger" onClick={() => { close(); setReporting(true); }}>Signaler le profil</MenuItem>
                      </div>
                    )}
                  </Popover>
                </>
              )}
            </div>
          </div>
        </div>
        {!restricted && (
          <div className="flex gap-1 overflow-x-auto border-t border-line px-3 scrollbar-none" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn('relative inline-flex h-12 shrink-0 items-center gap-2 px-3 text-sm font-semibold transition', tab === t.id ? 'text-brand-700' : 'text-ink-muted hover:text-ink')}>
                <t.icon size={16} /> {t.label} {t.count !== undefined && <span className="text-xs opacity-70">{t.count}</span>}
                {tab === t.id && <span className="rainbow-bar absolute inset-x-2 bottom-0 h-[3px] rounded-full" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {restricted ? (
        <div className="card rounded-2xl">
          <EmptyState icon={Lock} title="Ce profil est privé" text={`Ajoutez ${name.split(' ')[0]} en ami pour voir ses publications, Cele Vibes et photos.`} action={friendButton()} />
        </div>
      ) : (
        <>
          {tab === 'publications' && (
            <>
              {isMe && (
                <button onClick={() => setComposer('publication')} className="card flex w-full items-center gap-3 rounded-2xl p-4 text-left">
                  <Avatar name={name} hue={account.hue} src={account.avatar} size="md" />
                  <span className="h-11 flex-1 rounded-full bg-surface-sunken px-5 leading-[44px] text-ink-faint">Quoi de neuf aujourd'hui ?</span>
                </button>
              )}
              <PostsList list={posts} empty={isMe ? "Vous n'avez encore rien publié" : 'Aucune publication pour le moment'} />
            </>
          )}
          {tab === 'vibes' &&
            (myVibes.length === 0 ? (
              <div className="card rounded-2xl"><EmptyState icon={Clapperboard} title="Aucun Cele Vibe pour le moment" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myVibes.map((v) => (
                  <Link key={v.id} to={`/social/cele-vibes?v=${v.id}`} className="relative aspect-[9/16] overflow-hidden rounded-xl">
                    <Scene variant={v.scene} playing={false} />
                    <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow">▶ {compactNumber(v.views)}</span>
                  </Link>
                ))}
              </div>
            ))}
          {tab === 'photos' &&
            (photos.length === 0 ? (
              <div className="card rounded-2xl"><EmptyState icon={Images} title="Aucune photo pour le moment" text={isMe ? 'Les photos de vos publications apparaîtront ici.' : undefined} /></div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />)}
              </div>
            ))}
          {tab === 'apropos' && (
            <div className="card space-y-4 rounded-2xl p-5">
              <h2 className="text-lg font-extrabold">À propos</h2>
              {[
                { icon: Church, label: 'Paroisse', value: isMe ? account.parish || 'Non renseignée' : member.parish },
                { icon: MapPin, label: 'Ville', value: isMe ? 'Lokossa, Bénin' : member.city ?? 'Non renseignée' },
                { icon: Info, label: 'Bio', value: isMe ? account.bio || 'Ajoutez une courte présentation depuis votre profil.' : member.bio ?? '—' },
                { icon: Users, label: 'Membre depuis', value: 'Janvier 2025' },
                ...(isMe ? [
                  { icon: Phone, label: 'Téléphone', value: account.hidePhone ? 'Masqué sur votre profil' : account.phone || 'Non renseigné' },
                  { icon: Mail, label: 'E-mail', value: account.hideEmail ? 'Masqué sur votre profil' : account.email || account.identifier },
                ] : []),
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <span className="icon-tile h-10 w-10 rounded-xl"><r.icon size={18} /></span>
                  <div><p className="text-xs text-ink-muted">{r.label}</p><p className="text-sm font-semibold">{r.value}</p></div>
                </div>
              ))}
              {isMe && <Button variant="soft" icon={Pencil} to="/profil/parametres/profil">Modifier mes informations</Button>}
            </div>
          )}
          {tab === 'enregistrees' && isMe && (
            <>
              {savedVibes.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {savedVibes.map((v) => (
                    <Link key={v.id} to={`/social/cele-vibes?v=${v.id}`} className="relative aspect-[9/16] overflow-hidden rounded-xl"><Scene variant={v.scene} playing={false} /></Link>
                  ))}
                </div>
              )}
              <PostsList list={savedPosts} empty="Aucune publication enregistrée" />
            </>
          )}
        </>
      )}

      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0], 'avatar'); e.target.value = ''; }} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0], 'cover'); e.target.value = ''; }} />
      <AccountMenuModal open={menuOpen} onClose={() => setMenuOpen(false)} onCreateStatus={() => setComposer('statut')} onShowSaved={() => setTab('enregistrees')} onShowPosts={() => setTab('publications')} />
      {composer && <ComposerModal kind={composer} onClose={() => setComposer(null)} />}
      <ReportModal open={reporting} onClose={() => setReporting(false)} subject="le profil" />
      <PostDetailModal postId={openPost} onClose={() => setParams({ onglet: tab })} />
    </div>
  );
}
