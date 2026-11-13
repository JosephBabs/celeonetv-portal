import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ban, Ellipsis, MessageCircle, RefreshCw, Search, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { getMember, members } from '@/data/members';
import type { Member } from '@/data/types';
import { actions, useApp } from '@/store/app';
import { chat } from '@/store/chat';
import { confirmDialog, toast } from '@/store/ui';
import { MemberAvatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { cn, normalize } from '@/lib/utils';
import { RemoteFriendsPage } from './RemoteFriends';

type Tab = 'amis' | 'suggestions' | 'recues' | 'envoyees';

const tabs: { id: Tab; label: string; empty: string; emptyText: string }[] = [
  { id: 'amis', label: 'Mes amis', empty: "Vous n'avez pas encore d'amis sur CélèOne", emptyText: 'Parcourez les suggestions pour retrouver les membres de votre paroisse.' },
  { id: 'suggestions', label: 'Suggestions', empty: 'Aucune suggestion pour le moment', emptyText: 'Revenez plus tard, de nouveaux membres rejoignent CélèOne chaque jour.' },
  { id: 'recues', label: 'Demandes reçues', empty: "Aucune demande d'amis", emptyText: "Vous n'avez aucune demande d'amis en attente." },
  { id: 'envoyees', label: 'Demandes envoyées', empty: 'Aucune demande envoyée', emptyText: 'Les demandes que vous envoyez apparaîtront ici.' },
];

function FriendCard({ m, tab }: { m: Member; tab: Tab }) {
  const navigate = useNavigate();
  const message = () => navigate(`/discussions/${chat.ensureDirect(m.id)}`);
  return (
    <div className="card group flex flex-col overflow-hidden rounded-2xl transition hover:shadow-md">
      <Link to={`/social/profil/${m.id}`} className="relative flex h-28 items-end justify-center" style={{ background: `linear-gradient(135deg, hsl(${m.hue} 55% 88%), hsl(${(m.hue + 40) % 360} 50% 80%))` }}>
        <MemberAvatar member={m} size="xl" className="translate-y-10 rounded-full ring-4 ring-surface" online={m.online && tab === 'amis'} />
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-12 text-center">
        <Link to={`/social/profil/${m.id}`} className="truncate font-bold hover:underline">{m.name}</Link>
        <p className="truncate text-xs text-ink-muted">{m.parish}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{m.mutualFriends ?? 0} amis en commun</p>
        <div className="mt-4 flex gap-2">
          {tab === 'amis' && (
            <>
              <Button size="sm" variant="soft" icon={MessageCircle} className="flex-1" onClick={message}>Message</Button>
              <Popover className="w-56" trigger={({ toggle, open }) => <IconButton icon={Ellipsis} label={`Options pour ${m.name}`} size="sm" active={open} onClick={toggle} />}>
                {(close) => (
                  <div className="p-1.5 text-left">
                    <MenuItem
                      icon={UserMinus}
                      onClick={async () => {
                        close();
                        if (await confirmDialog({ title: `Retirer ${m.name} de vos amis ?`, confirmLabel: 'Retirer', tone: 'danger' })) {
                          actions.removeFriend(m.id);
                          toast(`${m.name} a été retiré de vos amis`);
                        }
                      }}
                    >
                      Retirer cet ami
                    </MenuItem>
                    <MenuItem
                      icon={Ban}
                      tone="danger"
                      onClick={async () => {
                        close();
                        if (await confirmDialog({ title: `Bloquer ${m.name} ?`, message: 'Cette personne ne pourra plus voir votre profil ni vous écrire.', confirmLabel: 'Bloquer', tone: 'danger' })) {
                          actions.blockMember(m.id);
                          toast(`${m.name} est bloqué`, { action: { label: 'Annuler', onClick: () => { actions.unblockMember(m.id); actions.acceptFriend(m.id); } } });
                        }
                      }}
                    >
                      Bloquer
                    </MenuItem>
                  </div>
                )}
              </Popover>
            </>
          )}
          {tab === 'suggestions' && (
            <>
              <Button size="sm" icon={UserPlus} className="flex-1" onClick={() => { actions.sendFriendRequest(m.id); toast(`Demande envoyée à ${m.name}`); }}>Ajouter</Button>
              <IconButton icon={X} label="Masquer la suggestion" size="sm" onClick={() => { actions.dismissSuggestion(m.id); toast('Suggestion masquée'); }} />
            </>
          )}
          {tab === 'recues' && (
            <>
              <Button size="sm" className="flex-1" onClick={() => { actions.acceptFriend(m.id); toast(`Vous êtes maintenant ami avec ${m.name}`); }}>Confirmer</Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => { actions.declineFriend(m.id); toast('Demande supprimée'); }}>Supprimer</Button>
            </>
          )}
          {tab === 'envoyees' && (
            <Button size="sm" variant="ghost" block onClick={() => { actions.cancelFriendRequest(m.id); toast('Demande annulée'); }}>Annuler la demande</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compte réel : amis de l'API ; démonstration : membres fictifs. */
export function FriendsPage() {
  const remote = useApp((s) => !!s.account?.remote);
  return remote ? <RemoteFriendsPage /> : <DemoFriendsPage />;
}

function DemoFriendsPage() {
  const friends = useApp((s) => s.friends);
  const received = useApp((s) => s.friendRequests);
  const sent = useApp((s) => s.sentRequests);
  const blocked = useApp((s) => s.blocked);
  const dismissed = useApp((s) => s.dismissedSuggestions);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const tab = (params.get('onglet') as Tab) || 'amis';

  const lists: Record<Tab, string[]> = useMemo(() => {
    const taken = new Set([...friends, ...received, ...sent, ...blocked, ...dismissed, 'me']);
    return {
      amis: friends,
      recues: received,
      envoyees: sent,
      suggestions: members.filter((m) => !m.official && !taken.has(m.id) && m.id !== 'chorale').map((m) => m.id),
    };
  }, [friends, received, sent, blocked, dismissed]);

  const visible = lists[tab].map(getMember).filter((m) => normalize(`${m.name} ${m.parish}`).includes(normalize(query)));
  const meta = tabs.find((t) => t.id === tab)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <IconButton icon={ArrowLeft} label="Retour" variant="white" onClick={() => navigate(-1)} />
        <div className="flex-1">
          <h1 className="text-[26px] font-black leading-tight">Amis</h1>
          <p className="text-sm text-ink-muted">Voir qui veut se connecter avec vous.</p>
        </div>
        <IconButton
          icon={RefreshCw}
          label="Actualiser"
          variant="white"
          className={cn(refreshing && '[&>svg]:animate-spin')}
          onClick={() => {
            setRefreshing(true);
            window.setTimeout(() => {
              setRefreshing(false);
              toast('Liste à jour');
            }, 800);
          }}
        />
      </div>

      <div className="card rounded-2xl p-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setParams({ onglet: t.id }, { replace: true })}
              className={cn('inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition', tab === t.id ? 'bg-brand-700 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-xs', tab === t.id ? 'bg-white/20' : 'bg-surface text-ink-muted')}>{lists[t.id].length}</span>
            </button>
          ))}
        </div>
        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-full bg-surface-sunken px-4">
          <Search size={17} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un ami" className="h-full flex-1 bg-transparent text-sm outline-none" aria-label="Rechercher un ami" />
          {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={15} /></button>}
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState icon={Users} title={query ? `Aucun résultat pour « ${query} »` : meta.empty} text={query ? undefined : meta.emptyText} action={tab === 'amis' && !query ? <Button onClick={() => setParams({ onglet: 'suggestions' })}>Voir les suggestions</Button> : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((m) => (
            <FriendCard key={m.id} m={m} tab={tab} />
          ))}
        </div>
      )}

      {blocked.length > 0 && tab === 'amis' && (
        <div className="card rounded-2xl p-4">
          <p className="mb-2 text-sm font-bold">Membres bloqués</p>
          {blocked.map((id) => (
            <div key={id} className="flex items-center gap-3 py-1.5">
              <MemberAvatar memberId={id} size="sm" />
              <span className="flex-1 text-sm font-medium">{getMember(id).name}</span>
              <Button size="sm" variant="ghost" onClick={() => { actions.unblockMember(id); toast('Membre débloqué'); }}>Débloquer</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
