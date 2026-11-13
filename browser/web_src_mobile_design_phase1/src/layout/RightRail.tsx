import { Link } from 'react-router-dom';
import { Search, UserCheck } from 'lucide-react';
import { quickAccess } from '@/data/navigation';
import { getMember } from '@/data/members';
import { actions, useApp } from '@/store/app';
import { useUnreadChats } from '@/store/chat';
import { toast } from '@/store/ui';
import { MemberAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CountBadge } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { friendActions, personHue, useFriends } from '@/services/friends';

export function QuickAccessGrid({ columns = 2, onNavigate }: { columns?: 2 | 4; onNavigate?: () => void }) {
  const unread = useUnreadChats();
  return (
    <div className={cn('grid gap-2', columns === 4 ? 'grid-cols-4' : 'grid-cols-2')}>
      {quickAccess.map((q) => (
        <Link
          key={q.id}
          to={q.to}
          onClick={onNavigate}
          className={cn(
            'group relative flex items-center gap-2.5 rounded-xl border border-line/70 bg-surface px-2.5 py-2.5 text-[13px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm',
            columns === 4 && 'flex-col gap-1.5 px-1.5 text-center text-[11.5px]',
          )}
        >
          <span className="icon-tile h-9 w-9 rounded-lg transition group-hover:bg-brand-600 group-hover:text-white">
            <q.icon size={18} strokeWidth={1.9} />
          </span>
          <span className="leading-tight">{q.label}</span>
          {q.id === 'discussions' && <CountBadge count={unread} tone="gold" className="absolute -right-1.5 -top-1.5 ring-2 ring-canvas" />}
        </Link>
      ))}
    </div>
  );
}

/** Compte réel : demandes reçues de l'API (Confirmer / Supprimer). */
function RemoteRequestsWidget() {
  const requests = useFriends((s) => s.incoming);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-extrabold text-ink">
          Demandes d'amis {requests.length > 0 && <span className="ml-1 text-brand-600">{requests.length}</span>}
        </h2>
        <Link to="/social/amis?onglet=recues" className="text-[13px] font-semibold text-brand-700 hover:underline">Voir tout</Link>
      </div>
      {requests.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-5 text-center text-[13px] text-ink-muted">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-2">
          {requests.slice(0, 2).map((r) => (
            <div key={r.id} className="flex gap-3 rounded-xl bg-surface p-3 shadow-xs">
              <Link to={`/social/membre/${encodeURIComponent(r.person.uid)}`} state={r.person} className="shrink-0"><Avatar name={r.person.name} hue={personHue(r.person)} src={r.person.avatar} size="lg" /></Link>
              <div className="min-w-0 flex-1">
                <Link to={`/social/membre/${encodeURIComponent(r.person.uid)}`} state={r.person} className="block truncate text-sm font-bold hover:underline">{r.person.name}</Link>
                {r.person.mutual !== undefined && <p className="text-xs text-ink-muted">{r.person.mutual} ami{r.person.mutual > 1 ? 's' : ''} en commun</p>}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => void friendActions.accept(r)}>Confirmer</Button>
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => void friendActions.reject(r)}>Supprimer</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Compte réel : amis (l'API ne donne pas la présence en ligne). */
function RemoteContacts() {
  const friends = useFriends((s) => s.friends);
  return (
    <section>
      <div className="mb-1 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-extrabold text-ink">Mes amis {friends.length > 0 && <span className="ml-1 text-ink-muted">{friends.length}</span>}</h2>
        <Link to="/social/amis" className="text-[13px] font-semibold text-brand-700 hover:underline">Voir tout</Link>
      </div>
      {friends.length === 0 ? (
        <p className="flex items-center gap-2 px-1 py-3 text-[13px] text-ink-muted"><UserCheck size={15} /> Aucun ami pour le moment.</p>
      ) : (
        <ul>
          {friends.slice(0, 8).map((p) => (
            <li key={p.uid}>
              <Link to={`/social/membre/${encodeURIComponent(p.uid)}`} state={p} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-surface hover:text-ink">
                <Avatar name={p.name} hue={personHue(p)} src={p.avatar} size="sm" />
                <span className="truncate">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FriendRequestsWidget() {
  const requests = useApp((s) => s.friendRequests);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-extrabold text-ink">
          Demandes d'amis {requests.length > 0 && <span className="ml-1 text-brand-600">{requests.length}</span>}
        </h2>
        <Link to="/social/amis" className="text-[13px] font-semibold text-brand-700 hover:underline">
          Voir tout
        </Link>
      </div>
      {requests.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-5 text-center text-[13px] text-ink-muted">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-2">
          {requests.slice(0, 2).map((id) => {
            const m = getMember(id);
            return (
              <div key={id} className="flex gap-3 rounded-xl bg-surface p-3 shadow-xs">
                <Link to={`/social/profil/${id}`}>
                  <MemberAvatar member={m} size="lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/social/profil/${id}`} className="block truncate text-sm font-bold hover:underline">
                    {m.name}
                  </Link>
                  <p className="text-xs text-ink-muted">{m.mutualFriends ?? 0} amis en commun</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        actions.acceptFriend(id);
                        toast(`Vous êtes maintenant ami avec ${m.name}`);
                      }}
                    >
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => {
                        actions.declineFriend(id);
                        toast('Demande supprimée');
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OnlineContacts() {
  const friends = useApp((s) => s.friends);
  const online = friends.map(getMember).filter((m) => m.online);
  return (
    <section>
      <div className="mb-1 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-extrabold text-ink">Contacts en ligne</h2>
        <Link to="/discussions" aria-label="Rechercher un contact" className="rounded-full p-1.5 text-ink-muted hover:bg-surface-sunken">
          <Search size={16} />
        </Link>
      </div>
      {online.length === 0 ? (
        <p className="flex items-center gap-2 px-1 py-3 text-[13px] text-ink-muted">
          <UserCheck size={15} /> Aucun contact en ligne.
        </p>
      ) : (
        <ul>
          {online.map((m) => (
            <li key={m.id}>
              <Link to={`/discussions/${m.id}`} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-surface hover:text-ink">
                <MemberAvatar member={m} size="sm" online />
                <span className="truncate">{m.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RightRail({ onNavigate }: { onNavigate?: () => void }) {
  const remote = useApp((s) => !!s.account?.remote);
  return (
    <div className="space-y-6 px-3 py-5">
      <section>
        <h2 className="mb-2 px-1 text-[15px] font-extrabold text-ink">Accès rapides</h2>
        <QuickAccessGrid onNavigate={onNavigate} />
      </section>
      <div className="h-px bg-line" />
      {remote ? <RemoteRequestsWidget /> : <FriendRequestsWidget />}
      <div className="h-px bg-line" />
      {remote ? <RemoteContacts /> : <OnlineContacts />}
    </div>
  );
}
