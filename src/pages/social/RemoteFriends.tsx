import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ellipsis, RefreshCw, RotateCw, Search, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { friendActions, loadFriends, personHue, searchSuggestions, useFriends, type Person } from '@/services/friends';
import { confirmDialog } from '@/store/ui';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { cn, normalize } from '@/lib/utils';

type Tab = 'amis' | 'suggestions' | 'recues' | 'envoyees';

const tabs: { id: Tab; label: string; empty: string; emptyText: string }[] = [
  { id: 'amis', label: 'Mes amis', empty: "Vous n'avez pas encore d'amis sur CélèOne", emptyText: 'Parcourez les suggestions pour retrouver les membres de votre paroisse.' },
  { id: 'suggestions', label: 'Suggestions', empty: 'Aucune suggestion pour le moment', emptyText: 'Revenez plus tard, de nouveaux membres rejoignent CélèOne chaque jour.' },
  { id: 'recues', label: 'Demandes reçues', empty: "Aucune demande d'amis", emptyText: "Vous n'avez aucune demande d'amis en attente." },
  { id: 'envoyees', label: 'Demandes envoyées', empty: 'Aucune demande envoyée', emptyText: 'Les demandes que vous envoyez apparaîtront ici.' },
];

type Entry = { key: string; person: Person; requestId?: string };

function PersonCard({ e, tab }: { e: Entry; tab: Tab }) {
  const p = e.person;
  const hue = personHue(p);
  const request = { id: e.requestId ?? p.uid, person: p };
  const to = `/social/membre/${encodeURIComponent(p.uid)}`;
  return (
    <div className="card group flex flex-col overflow-hidden rounded-2xl transition hover:shadow-md">
      <Link to={to} state={p} className="relative flex h-28 items-end justify-center" style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 88%), hsl(${(hue + 40) % 360} 50% 80%))` }}>
        <Avatar name={p.name} hue={hue} src={p.avatar} size="xl" className="translate-y-10 rounded-full ring-4 ring-surface" />
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-12 text-center">
        <Link to={to} state={p} className="truncate font-bold hover:underline">{p.name}</Link>
        <p className="truncate text-xs text-ink-muted">{p.place ?? ' '}</p>
        {p.mutual !== undefined && <p className="mt-0.5 text-xs text-ink-faint">{p.mutual} ami{p.mutual > 1 ? 's' : ''} en commun</p>}
        <div className="mt-auto flex gap-2 pt-4">
          {tab === 'amis' && (
            <Popover className="w-56" trigger={({ toggle, open }) => <Button size="sm" variant={open ? "secondary" : "soft"} icon={Ellipsis} block onClick={toggle}>Options</Button>}>
              {(close) => (
                <div className="p-1.5 text-left">
                  <MenuItem
                    icon={UserMinus}
                    tone="danger"
                    onClick={async () => {
                      close();
                      if (await confirmDialog({ title: `Retirer ${p.name} de vos amis ?`, confirmLabel: 'Retirer', tone: 'danger' })) void friendActions.remove(p);
                    }}
                  >
                    Retirer cet ami
                  </MenuItem>
                </div>
              )}
            </Popover>
          )}
          {tab === 'suggestions' && (
            <>
              <Button size="sm" icon={UserPlus} className="flex-1" onClick={() => void friendActions.send(p)}>Ajouter</Button>
              <IconButton icon={X} label="Masquer la suggestion" size="sm" onClick={() => friendActions.dismiss(p)} />
            </>
          )}
          {tab === 'recues' && (
            <>
              <Button size="sm" className="flex-1" onClick={() => void friendActions.accept(request)}>Confirmer</Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => void friendActions.reject(request)}>Supprimer</Button>
            </>
          )}
          {tab === 'envoyees' && <Button size="sm" variant="ghost" block disabled={request.id.startsWith('tmp-')} onClick={() => void friendActions.cancel(request)}>Annuler la demande</Button>}
        </div>
      </div>
    </div>
  );
}

/** Page Amis d'un compte réel : amis, suggestions (recherche côté serveur), demandes reçues et envoyées. */
export function RemoteFriendsPage() {
  const st = useFriends((s) => s);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const tab = (params.get('onglet') as Tab) || 'amis';

  // Suggestions : la recherche interroge le serveur (tous les membres), avec un court délai de frappe.
  useEffect(() => {
    if (tab !== 'suggestions') return;
    const q = query.trim();
    if (q === st.suggestQuery) return;
    const t = window.setTimeout(() => void searchSuggestions(q), 350);
    return () => window.clearTimeout(t);
  }, [query, tab, st.suggestQuery]);

  const lists: Record<Tab, Entry[]> = useMemo(() => {
    const taken = new Set([...st.friends.map((p) => p.uid), ...st.incoming.map((r) => r.person.uid), ...st.outgoing.map((r) => r.person.uid), ...st.dismissed]);
    return {
      amis: st.friends.map((p) => ({ key: p.uid, person: p })),
      recues: st.incoming.map((r) => ({ key: r.id, person: r.person, requestId: r.id })),
      envoyees: st.outgoing.map((r) => ({ key: r.id, person: r.person, requestId: r.id })),
      suggestions: st.suggestions.filter((p) => !taken.has(p.uid)).map((p) => ({ key: p.uid, person: p })),
    };
  }, [st.friends, st.incoming, st.outgoing, st.suggestions, st.dismissed]);

  const q = normalize(query.trim());
  const visible = tab === 'suggestions' ? lists.suggestions : lists[tab].filter((e) => normalize(`${e.person.name} ${e.person.place ?? ''}`).includes(q));
  const meta = tabs.find((t) => t.id === tab)!;
  const loading = st.status === 'idle' || st.status === 'loading';

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
          onClick={async () => {
            setRefreshing(true);
            await loadFriends();
            setRefreshing(false);
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
              {!loading && <span className={cn('rounded-full px-1.5 text-xs', tab === t.id ? 'bg-white/20' : 'bg-surface text-ink-muted')}>{lists[t.id].length}{t.id === 'suggestions' && st.suggestMore ? '+' : ''}</span>}
            </button>
          ))}
        </div>
        <label className="mt-3 flex h-11 items-center gap-2.5 rounded-full bg-surface-sunken px-4">
          <Search size={17} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === 'suggestions' ? 'Rechercher un membre de CélèOne' : 'Rechercher un ami'} className="h-full flex-1 bg-transparent text-sm outline-none" aria-label="Rechercher" />
          {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={15} /></button>}
        </label>
      </div>

      {loading || (tab === 'suggestions' && st.suggestLoading && visible.length === 0) ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[250px] rounded-2xl" />)}</div>
      ) : st.status === 'error' ? (
        <div className="card rounded-2xl"><EmptyState icon={Users} title="Amis indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void loadFriends()}>Réessayer</Button>} /></div>
      ) : visible.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState icon={Users} title={query ? `Aucun résultat pour « ${query} »` : meta.empty} text={query ? undefined : meta.emptyText} action={tab === 'amis' && !query ? <Button onClick={() => setParams({ onglet: 'suggestions' })}>Voir les suggestions</Button> : undefined} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((e) => <PersonCard key={e.key} e={e} tab={tab} />)}
          </div>
          {tab === 'suggestions' && st.suggestMore && (
            <div className="flex justify-center">
              <Button variant="soft" loading={st.suggestLoading} onClick={() => void searchSuggestions(query.trim(), true)}>Voir plus de membres</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
