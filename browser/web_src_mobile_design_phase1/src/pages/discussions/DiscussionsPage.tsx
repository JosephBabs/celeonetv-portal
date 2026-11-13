import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive, ArchiveRestore, ArrowLeft, BellOff, Check, ChevronDown, CircleDashed, Ellipsis, MessageCircle, MessageSquarePlus, Mic, MicOff, Phone,
  PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing, Pin, PinOff, Plus, Search, Settings, Star, Trash2, UserPlus, Users, Video, VideoOff,
  Volume2, X, CheckCheck, MailOpen, Mail,
} from 'lucide-react';
import { getMember, members } from '@/data/members';
import type { Conversation, Status } from '@/data/types';
import { accountName, useApp } from '@/store/app';
import { chat, conversationTitle, useChat, useLive, type ChatSettings } from '@/store/chat';
import { confirmDialog, toast } from '@/store/ui';
import { Avatar, MemberAvatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { LogoMark } from '@/components/ui/Logo';
import { Modal } from '@/components/ui/Overlay';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { Toggle } from '@/components/ui/Toggle';
import { Scene } from '@/components/feed/Scene';
import { StatusViewer } from '@/components/social/SocialWidgets';
import { cn, normalize, timeAgo } from '@/lib/utils';
import { RemoteDiscussionsPage } from './RemoteDiscussions';
import { REAL_DISCUSSIONS } from '@/services/conversations';
import { ContactInfoPanel, ConvAvatar, ConversationPane, StatusTicks, wallpaperClass } from './ConversationPane';

type View = 'discussions' | 'appels' | 'personnes' | 'parametres';
type Filter = 'toutes' | 'non-lues' | 'favoris' | 'groupes';

function lastMessagePreview(c: Conversation) {
  const m = c.messages[c.messages.length - 1];
  if (!m) return { text: 'Aucun message pour le moment', mine: false, m };
  const text = m.deleted ? 'Message supprimé' : m.text ?? (m.image ? '📷 Photo' : m.voice ? '🎤 Message vocal' : m.file ? `📄 ${m.file.name}` : '');
  const prefix = c.isGroup && m.authorId !== 'me' && m.authorId !== 'system' ? `${getMember(m.authorId).name.split(' ')[0]} : ` : '';
  return { text: prefix + text, mine: m.authorId === 'me', m };
}

function shortTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

/* ───────────── Nouvel échange ───────────── */

function NewChatModal({ open, onClose, startWithGroup }: { open: boolean; onClose: () => void; startWithGroup?: boolean }) {
  const friends = useApp((s) => s.friends);
  const navigate = useNavigate();
  const [step, setStep] = useState<'pick' | 'group'>(startWithGroup ? 'group' : 'pick');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (open) {
      setStep(startWithGroup ? 'group' : 'pick');
      setSelected([]);
      setTitle('');
      setQuery('');
    }
  }, [open, startWithGroup]);
  const people = members.filter((m) => !m.official && m.id !== 'me' && normalize(m.name).includes(normalize(query))).sort((a, b) => Number(friends.includes(b.id)) - Number(friends.includes(a.id)));
  const close = () => onClose();

  return (
    <Modal open={open} onClose={close} title={step === 'group' ? 'Nouveau groupe' : 'Nouvelle discussion'} size="sm"
      footer={step === 'group' ? (
        <Button
          disabled={selected.length < 2 || !title.trim()}
          icon={Check}
          onClick={() => {
            const id = chat.createGroup(title.trim(), selected);
            close();
            navigate(`/discussions/${id}`);
            toast(`Groupe « ${title.trim()} » créé`);
          }}
        >
          Créer le groupe
        </Button>
      ) : undefined}
    >
      {step === 'group' && (
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom du groupe" className="field mb-3" aria-label="Nom du groupe" />
      )}
      <label className="mb-3 flex h-10 items-center gap-2 rounded-full bg-surface-sunken px-4">
        <Search size={16} className="text-ink-muted" />
        <input autoFocus={step === 'pick'} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un nom" className="flex-1 bg-transparent text-sm outline-none" />
      </label>
      {step === 'pick' && (
        <button onClick={() => setStep('group')} className="mb-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-sunken">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><Users size={18} /></span>
          <span className="font-semibold">Nouveau groupe</span>
        </button>
      )}
      {step === 'group' && selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-mint-100 py-1 pl-1 pr-2 text-xs font-semibold text-brand-800">
              <MemberAvatar memberId={id} size="xs" /> {getMember(id).name.split(' ')[0]}
              <button aria-label="Retirer" onClick={() => setSelected((s) => s.filter((x) => x !== id))}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Contacts sur CélèOne</p>
      <div className="max-h-[45vh] overflow-y-auto">
        {people.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                if (step === 'group') setSelected((s) => (on ? s.filter((x) => x !== m.id) : [...s, m.id]));
                else {
                  const id = chat.ensureDirect(m.id);
                  close();
                  navigate(`/discussions/${id}`);
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-sunken"
            >
              <MemberAvatar member={m} size="sm" online={m.online} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{m.name}</span>
                <span className="block truncate text-xs text-ink-muted">{friends.includes(m.id) ? 'Ami' : m.parish}</span>
              </span>
              {step === 'group' && <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong')}>{on && <Check size={13} strokeWidth={3} />}</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ───────────── Appel en cours ───────────── */

export function CallOverlay() {
  const call = useLive((s) => s.call);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  useEffect(() => {
    if (!call) return;
    setElapsed(0);
    setMuted(false);
    setCamOff(false);
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - call.startedAt) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [call]);
  if (!call) return null;
  const m = getMember(call.memberId);
  const connected = elapsed >= 3;
  const fmt = `${String(Math.floor((elapsed - 3) / 60)).padStart(2, '0')}:${String(Math.max(0, elapsed - 3) % 60).padStart(2, '0')}`;
  const video = call.kind === 'video';
  return (
    <div className="fixed inset-0 z-[85] flex animate-fade-in flex-col items-center justify-between bg-night px-6 py-12 text-white">
      {video && connected && !camOff && <div className="absolute inset-0"><Scene variant="youth" /><div className="absolute inset-0 bg-gradient-to-b from-night/70 via-transparent to-night/80" /></div>}
      <div className="relative flex flex-col items-center text-center">
        <span className={cn('rounded-full p-1.5', !connected && 'animate-pulse bg-white/10')}>
          <MemberAvatar member={m} size="xl" />
        </span>
        <h2 className="mt-5 text-2xl font-black">{m.name}</h2>
        <p className="mt-1 text-white/70">{connected ? `${video ? 'Appel vidéo' : 'Appel audio'} · ${fmt}` : 'Appel en cours…'}</p>
      </div>
      {video && connected && (
        <div className="absolute right-5 top-5 h-36 w-24 overflow-hidden rounded-2xl border-2 border-white/30 bg-night-700">
          {camOff ? <div className="flex h-full items-center justify-center text-white/60"><VideoOff size={22} /></div> : <Scene variant="sunrise" />}
        </div>
      )}
      <div className="relative flex items-center gap-4">
        <IconButton icon={muted ? MicOff : Mic} label={muted ? 'Réactiver le micro' : 'Couper le micro'} size="lg" variant="glass" className={cn('h-14 w-14', muted && 'bg-white text-night hover:bg-white')} onClick={() => setMuted((v) => !v)} />
        {video ? (
          <IconButton icon={camOff ? VideoOff : Video} label={camOff ? 'Activer la caméra' : 'Couper la caméra'} size="lg" variant="glass" className={cn('h-14 w-14', camOff && 'bg-white text-night hover:bg-white')} onClick={() => setCamOff((v) => !v)} />
        ) : (
          <IconButton icon={Volume2} label="Haut-parleur" size="lg" variant="glass" className={cn('h-14 w-14', speaker && 'bg-white text-night hover:bg-white')} onClick={() => setSpeaker((v) => !v)} />
        )}
        <button
          onClick={() => {
            const d = chat.endCall() ?? 0;
            toast(d > 3 ? `Appel terminé · ${Math.max(1, Math.round((d - 3) / 60))} min` : 'Appel annulé');
          }}
          aria-label="Raccrocher"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-lg transition hover:bg-danger-700"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}

/* ───────────── Colonne liste ───────────── */

function ConversationRow({ c, active }: { c: Conversation; active: boolean }) {
  const navigate = useNavigate();
  const typing = useLive((s) => s.typing[c.id] ?? null);
  const { text, mine, m } = lastMessagePreview(c);
  return (
    <div className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition', active ? 'bg-mint-100' : 'hover:bg-surface-sunken')}>
      <Link to={`/discussions/${c.id}`} className="absolute inset-0 rounded-xl" aria-label={`Ouvrir ${conversationTitle(c)}`} />
      <ConvAvatar conv={c} />
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('flex-1 truncate text-[15px]', c.unread ? 'font-extrabold' : 'font-semibold')}>{conversationTitle(c)}</p>
          <span className={cn('shrink-0 text-xs', c.unread ? 'font-bold text-brand-600' : 'text-ink-faint')}>{shortTime(m?.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {typing ? (
            <p className="flex-1 truncate text-[13px] font-semibold text-brand-600">écrit…</p>
          ) : (
            <p className={cn('flex flex-1 items-center gap-1 truncate text-[13px]', c.unread ? 'font-semibold text-ink' : 'text-ink-muted')}>
              {mine && <StatusTicks status={m?.status} className={m?.status === 'read' ? '!text-sky-500' : ''} />}
              <span className="truncate">{c.draft ? <><span className="text-danger">Brouillon : </span>{c.draft}</> : text}</span>
            </p>
          )}
          {c.muted && <BellOff size={13} className="shrink-0 text-ink-faint" />}
          {c.pinned && <Pin size={13} className="shrink-0 text-ink-faint" />}
          {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
        </div>
      </div>
      <div className="relative opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <Popover className="w-56" trigger={({ toggle }) => <IconButton icon={ChevronDown} label="Options de la discussion" size="sm" variant="white" onClick={toggle} />}>
          {(close) => (
            <div className="p-1.5">
              <MenuItem icon={c.pinned ? PinOff : Pin} onClick={() => { close(); chat.togglePin(c.id); }}>{c.pinned ? 'Désépingler' : 'Épingler'}</MenuItem>
              <MenuItem icon={c.archived ? ArchiveRestore : Archive} onClick={() => { close(); chat.toggleArchive(c.id); toast(c.archived ? 'Discussion désarchivée' : 'Discussion archivée', { action: { label: 'Annuler', onClick: () => chat.toggleArchive(c.id) } }); }}>{c.archived ? 'Désarchiver' : 'Archiver'}</MenuItem>
              {c.unread ? (
                <MenuItem icon={MailOpen} onClick={() => { close(); chat.markRead(c.id); }}>Marquer comme lu</MenuItem>
              ) : (
                <MenuItem icon={Mail} onClick={() => { close(); chat.markUnread(c.id); }}>Marquer comme non lu</MenuItem>
              )}
              <MenuItem icon={Star} onClick={() => { close(); chat.toggleFavorite(c.id); }}>{c.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</MenuItem>
              <MenuItem icon={BellOff} onClick={() => { close(); chat.toggleMute(c.id); }}>{c.muted ? 'Réactiver les notifications' : 'Mettre en sourdine'}</MenuItem>
              <MenuItem
                icon={Trash2}
                tone="danger"
                onClick={async () => {
                  close();
                  if (await confirmDialog({ title: 'Supprimer la discussion ?', confirmLabel: 'Supprimer', tone: 'danger' })) {
                    const removed = chat.remove(c.id);
                    if (active) navigate('/discussions');
                    toast('Discussion supprimée', { action: removed ? { label: 'Annuler', onClick: () => chat.restore(removed) } : undefined });
                  }
                }}
              >
                Supprimer
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>
    </div>
  );
}

function StatusRow() {
  const statuses = useApp((s) => s.statuses);
  const myStatus = useApp((s) => s.myStatus);
  const seen = useApp((s) => s.seenStatuses);
  const account = useApp((s) => s.account);
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<number | null>(null);
  const all: Status[] = useMemo(() => (myStatus.length ? [{ authorId: 'me', items: myStatus }, ...statuses] : statuses), [myStatus, statuses]);
  if (!account) return null;
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none">
      <button onClick={() => (myStatus.length ? setViewing(0) : navigate('/social?creer=statut'))} className="flex w-16 shrink-0 flex-col items-center gap-1">
        <span className="relative">
          <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="lg" ring={myStatus.length > 0} />
          {!myStatus.length && <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-surface"><Plus size={12} strokeWidth={3} /></span>}
        </span>
        <span className="w-full truncate text-center text-[11px] font-medium">Votre statut</span>
      </button>
      {statuses.map((st) => {
        const m = getMember(st.authorId);
        const unseen = !seen.includes(st.authorId);
        return (
          <button key={st.authorId} onClick={() => setViewing(all.findIndex((x) => x.authorId === st.authorId))} className="flex w-16 shrink-0 flex-col items-center gap-1">
            {unseen ? <MemberAvatar member={m} size="lg" ring /> : <span className="rounded-full p-[4.5px] ring-2 ring-line"><MemberAvatar member={m} size="lg" /></span>}
            <span className="w-full truncate text-center text-[11px] font-medium">{m.name.split(' ')[0]}</span>
          </button>
        );
      })}
      {viewing !== null && <StatusViewer statuses={all} start={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ChatList({ activeId }: { activeId?: string }) {
  const conversations = useChat((s) => s.conversations);
  const [filter, setFilter] = useState<Filter>('toutes');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [newChat, setNewChat] = useState<null | 'chat' | 'group'>(null);

  const archivedCount = conversations.filter((c) => c.archived).length;
  const unreadCount = conversations.filter((c) => c.unread && !c.archived).length;
  const list = useMemo(() => {
    const q = normalize(query.trim());
    return conversations
      .filter((c) => (showArchived ? c.archived : !c.archived))
      .filter((c) => (filter === 'non-lues' ? c.unread > 0 : filter === 'favoris' ? c.favorite : filter === 'groupes' ? c.isGroup : true))
      .filter((c) => !q || normalize(conversationTitle(c)).includes(q) || c.messages.some((m) => m.text && normalize(m.text).includes(q)))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.messages[b.messages.length - 1]?.createdAt ?? '').localeCompare(a.messages[a.messages.length - 1]?.createdAt ?? ''));
  }, [conversations, filter, query, showArchived]);

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'toutes', label: 'Toutes' },
    { id: 'non-lues', label: 'Non lues', count: unreadCount },
    { id: 'favoris', label: 'Favoris' },
    { id: 'groupes', label: 'Groupes', count: conversations.filter((c) => c.isGroup && !c.archived).length },
  ];

  return (
    <>
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        {showArchived && <IconButton icon={ArrowLeft} label="Retour" variant="plain" onClick={() => setShowArchived(false)} />}
        <h1 className="flex-1 text-[24px] font-black">{showArchived ? 'Archivées' : 'Discussions'}</h1>
        <Popover className="w-60" trigger={({ toggle, open }) => <IconButton icon={Ellipsis} label="Menu des discussions" variant="plain" active={open} onClick={toggle} />}>
          {(close) => (
            <div className="p-1.5">
              <MenuItem icon={Users} onClick={() => { close(); setNewChat('group'); }}>Nouveau groupe</MenuItem>
              <MenuItem icon={Archive} onClick={() => { close(); setShowArchived(true); }}>Discussions archivées</MenuItem>
              <MenuItem icon={CheckCheck} onClick={() => { close(); chat.markAllRead(); toast('Toutes les discussions sont lues'); }}>Tout marquer comme lu</MenuItem>
            </div>
          )}
        </Popover>
        <IconButton icon={MessageSquarePlus} label="Nouvelle discussion" variant="primary" onClick={() => setNewChat('chat')} />
      </div>
      <div className="px-4 pb-3">
        <label className="flex h-10 items-center gap-2.5 rounded-full bg-surface-sunken px-4 focus-within:ring-2 focus-within:ring-brand-500/25">
          <Search size={16} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher ou démarrer une discussion" className="flex-1 bg-transparent text-sm outline-none" aria-label="Rechercher une discussion" />
          {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={15} /></button>}
        </label>
      </div>
      {!showArchived && !query && <StatusRow />}
      {!showArchived && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn('h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition', filter === f.id ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>
              {f.label} {!!f.count && <span className="opacity-75">{f.count}</span>}
            </button>
          ))}
          <IconButton icon={Plus} label="Nouveau groupe" size="sm" onClick={() => setNewChat('group')} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
        {!showArchived && archivedCount > 0 && !query && (
          <button onClick={() => setShowArchived(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-surface-sunken">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-brand-700"><Archive size={18} /></span>
            <span className="flex-1">Archivées</span>
            <span className="text-xs font-bold text-brand-600">{archivedCount}</span>
          </button>
        )}
        {list.length === 0 ? (
          <EmptyState icon={MessageCircle} title={query ? 'Aucun résultat' : filter === 'non-lues' ? 'Aucune discussion non lue' : 'Aucune discussion pour le moment'} className="py-10" action={!query ? <Button size="sm" onClick={() => setNewChat('chat')}>Nouvelle discussion</Button> : undefined} />
        ) : (
          list.map((c) => <ConversationRow key={c.id} c={c} active={c.id === activeId} />)
        )}
      </div>
      <NewChatModal open={newChat !== null} startWithGroup={newChat === 'group'} onClose={() => setNewChat(null)} />
    </>
  );
}

/* ───────────── Vues secondaires ───────────── */

function CallsView() {
  const calls = useChat((s) => s.calls);
  return (
    <>
      <div className="px-4 pb-3 pt-4"><h1 className="text-[24px] font-black">Vos appels</h1></div>
      <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
        {calls.length === 0 ? (
          <EmptyState icon={Phone} title="Aucun appel récent" />
        ) : (
          calls.map((c) => {
            const m = getMember(c.memberId);
            const DirIcon = c.direction === 'manque' ? PhoneMissed : c.direction === 'entrant' ? PhoneIncoming : PhoneOutgoing;
            return (
              <div key={c.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-sunken">
                <MemberAvatar member={m} />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate font-semibold', c.direction === 'manque' && 'text-danger-700')}>{m.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <DirIcon size={13} className={c.direction === 'manque' ? 'text-danger' : 'text-brand-600'} />
                    {c.direction === 'manque' ? 'Manqué' : c.direction === 'entrant' ? 'Entrant' : 'Sortant'} · {timeAgo(c.createdAt)}
                    {c.durationSec ? ` · ${Math.max(1, Math.round(c.durationSec / 60))} min` : ''}
                  </p>
                </div>
                <IconButton icon={Trash2} label="Supprimer de l'historique" size="sm" variant="plain" className="opacity-0 group-hover:opacity-100" onClick={() => chat.deleteCall(c.id)} />
                <IconButton icon={c.kind === 'video' ? Video : Phone} label={`Rappeler ${m.name}`} variant="soft" size="sm" onClick={() => chat.startCall(m.id, c.kind)} />
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function PeopleView() {
  const friends = useApp((s) => s.friends);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const people = friends.map(getMember).filter((m) => normalize(m.name).includes(normalize(query)));
  const online = people.filter((m) => m.online);
  const Row = ({ m }: { m: ReturnType<typeof getMember> }) => (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-sunken">
      <button onClick={() => navigate(`/discussions/${chat.ensureDirect(m.id)}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <MemberAvatar member={m} online={m.online} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{m.name}</span>
          <span className="block truncate text-xs text-ink-muted">{m.parish}</span>
        </span>
      </button>
      <IconButton icon={Phone} label={`Appeler ${m.name}`} size="sm" variant="plain" onClick={() => chat.startCall(m.id, 'audio')} />
      <IconButton icon={Video} label={`Appel vidéo avec ${m.name}`} size="sm" variant="plain" onClick={() => chat.startCall(m.id, 'video')} />
    </div>
  );
  return (
    <>
      <div className="px-4 pb-3 pt-4">
        <h1 className="text-[24px] font-black">Personnes</h1>
        <label className="mt-3 flex h-10 items-center gap-2.5 rounded-full bg-surface-sunken px-4">
          <Search size={16} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un contact" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
        <Link to="/social/amis?onglet=suggestions" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold hover:bg-surface-sunken">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white"><UserPlus size={18} /></span> Ajouter des amis
        </Link>
        {online.length > 0 && <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">En ligne · {online.length}</p>}
        {online.map((m) => <Row key={m.id} m={m} />)}
        <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">Tous vos amis · {people.length}</p>
        {people.map((m) => <Row key={m.id} m={m} />)}
      </div>
    </>
  );
}

function SettingsView() {
  const settings = useChat((s) => s.settings);
  const toggles: [keyof ChatSettings, string, string][] = [
    ['notifications', 'Notifications', 'Recevoir une alerte pour chaque nouveau message'],
    ['previews', 'Aperçu des messages', 'Afficher le contenu dans les notifications'],
    ['readReceipts', 'Confirmations de lecture', 'Les autres voient quand vous avez lu leurs messages'],
    ['enterToSend', 'Entrée pour envoyer', 'Maj + Entrée pour aller à la ligne'],
  ];
  return (
    <>
      <div className="px-4 pb-3 pt-4"><h1 className="text-[24px] font-black">Paramètres</h1></div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-24 md:pb-4">
        <div className="divide-y divide-line rounded-2xl border border-line">
          {toggles.map(([key, label, hint]) => (
            <div key={key} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-ink-muted">{hint}</p>
              </div>
              <Toggle checked={settings[key] as boolean} onChange={(v) => chat.updateSettings({ [key]: v })} label={label} />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold">Fond d'écran des discussions</p>
          <div className="grid grid-cols-4 gap-2">
            {(['motif', 'menthe', 'blanc', 'nuit'] as const).map((w) => (
              <button key={w} onClick={() => chat.updateSettings({ wallpaper: w })} className={cn('flex aspect-square items-end justify-center rounded-xl border-2 pb-1.5 text-[11px] font-semibold capitalize', wallpaperClass[w], settings.wallpaper === w ? 'border-brand-600' : 'border-line', w === 'nuit' && 'text-white')}>
                {w}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold">Taille du texte</p>
          <div className="grid grid-cols-3 gap-2">
            {(['petite', 'normale', 'grande'] as const).map((f) => (
              <button key={f} onClick={() => chat.updateSettings({ fontSize: f })} className={cn('h-10 rounded-xl border text-sm font-semibold capitalize', settings.fontSize === f ? 'border-brand-600 bg-mint-100 text-brand-800' : 'border-line')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <Button
          variant="danger-soft"
          block
          icon={Archive}
          onClick={async () => {
            if (await confirmDialog({ title: 'Archiver toutes les discussions ?', confirmLabel: 'Tout archiver' })) {
              chat.archiveAll(true);
              toast('Toutes les discussions sont archivées', { action: { label: 'Annuler', onClick: () => chat.archiveAll(false) } });
            }
          }}
        >
          Archiver toutes les discussions
        </Button>
      </div>
    </>
  );
}

/* ───────────── Page ───────────── */

/** Compte réel : vraies conversations ; démonstration : messagerie simulée. */
export function DiscussionsPage() {
  const remote = useApp((s) => !!s.account?.remote);
  return REAL_DISCUSSIONS && remote ? <RemoteDiscussionsPage /> : <DemoDiscussionsPage />;
}

function DemoDiscussionsPage() {
  const { conversationId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const account = useApp((s) => s.account);
  const conversations = useChat((s) => s.conversations);
  const [infoOpen, setInfoOpen] = useState(false);
  const view = (params.get('vue') as View) || 'discussions';
  const conv = conversations.find((c) => c.id === conversationId);

  useEffect(() => setInfoOpen(false), [conversationId]);

  const rail: { id: View; icon: typeof MessageCircle; label: string; to: string }[] = [
    { id: 'discussions', icon: MessageCircle, label: 'Discussions', to: '/discussions' },
    { id: 'appels', icon: Phone, label: 'Vos appels', to: '/discussions?vue=appels' },
    { id: 'personnes', icon: Users, label: 'Personnes', to: '/discussions?vue=personnes' },
    { id: 'parametres', icon: Settings, label: 'Paramètres', to: '/discussions?vue=parametres' },
  ];
  const unread = conversations.filter((c) => !c.archived).reduce((n, c) => n + c.unread, 0);

  return (
    <div className="flex h-[calc(100dvh-var(--header-h))] overflow-hidden bg-surface">
      <nav className="hidden w-[68px] shrink-0 flex-col items-center gap-2 border-r border-line bg-surface-sunken/60 py-4 md:flex" aria-label="Sections de la messagerie">
        {rail.map((r) => (
          <Link key={r.id} to={conversationId && r.id === 'discussions' ? `/discussions/${conversationId}` : r.to} title={r.label} aria-label={r.label} className={cn('relative flex h-11 w-11 items-center justify-center rounded-full transition', view === r.id ? 'bg-mint-200 text-brand-800' : 'text-ink-muted hover:bg-surface')}>
            <r.icon size={21} />
            {r.id === 'discussions' && unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        ))}
        <Link to="/social?creer=statut" title="Statuts" aria-label="Créer un statut" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-surface"><CircleDashed size={21} /></Link>
        <div className="mt-auto">
          {account && <Link to="/profil" aria-label="Mon profil"><Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="sm" /></Link>}
        </div>
      </nav>

      <div className={cn('flex w-full flex-col border-r border-line md:w-[380px] md:shrink-0', conv && 'hidden md:flex')}>
        {view === 'discussions' && <ChatList activeId={conversationId} />}
        {view === 'appels' && <CallsView />}
        {view === 'personnes' && <PeopleView />}
        {view === 'parametres' && <SettingsView />}
      </div>

      {conv ? (
        <>
          <div className={cn('min-w-0 flex-1', infoOpen && 'hidden lg:flex')}>
            <ConversationPane conv={conv} onBack={() => navigate('/discussions')} onInfo={() => setInfoOpen((v) => !v)} infoOpen={infoOpen} />
          </div>
          {infoOpen && (
            <div className="fixed inset-0 z-50 lg:static lg:z-auto">
              <ContactInfoPanel conv={conv} onClose={() => setInfoOpen(false)} />
            </div>
          )}
        </>
      ) : conversationId ? (
        <div className="hidden flex-1 md:flex md:items-center md:justify-center">
          <EmptyState icon={MessageCircle} title="Discussion introuvable" action={<Button to="/discussions">Retour aux discussions</Button>} />
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-mint-50 px-8 text-center md:flex">
          <div className="relative mb-6">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-200/40" />
            <LogoMark className="relative h-28 w-28" />
          </div>
          <h2 className="text-2xl font-black">CélèOne Discussions</h2>
          <p className="mt-2 max-w-sm text-ink-muted">Sélectionnez une discussion pour commencer, ou lancez un nouvel échange avec vos frères et sœurs.</p>
          <div className="mt-8 flex gap-6">
            {[
              { icon: MessageSquarePlus, label: 'Nouvelle discussion', run: () => navigate('/discussions?vue=personnes') },
              { icon: Users, label: 'Nouveau groupe', run: () => document.querySelector<HTMLButtonElement>('[aria-label="Nouveau groupe"]')?.click() },
              { icon: UserPlus, label: 'Ajouter un contact', run: () => navigate('/social/amis?onglet=suggestions') },
            ].map((a) => (
              <button key={a.label} onClick={a.run} className="flex w-28 flex-col items-center gap-2 text-sm font-semibold text-ink-soft">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><a.icon size={22} /></span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <CallOverlay />
    </div>
  );
}
