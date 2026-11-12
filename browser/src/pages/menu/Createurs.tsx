import { useMemo, useState } from 'react';
import { BadgeCheck, CalendarClock, Check, Eye, FilePen, Heart, MessageCircle, Plus, Send, Shield, Trash2, TrendingUp, Users, Wallet } from 'lucide-react';
import { actions, useApp } from '@/store/app';
import { menu, useMenu, type Draft } from '@/store/menu';
import { confirmDialog, toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Chip } from '@/components/ui/Chip';
import { cn, compactNumber, formatDate, sleep, timeAgo } from '@/lib/utils';
import { BarChart, MenuShell, Pills, StatTile } from './MenuShell';

function seeded(n: number, base: number, spread: number, seed = 7) {
  return Array.from({ length: n }, (_, i) => Math.round(base + Math.abs(Math.sin((i + 1) * seed)) * spread + i * (spread / n)));
}

export function TableauCreateurPage() {
  const posts = useApp((s) => s.socialPosts);
  const vibes = useApp((s) => s.vibes);
  const mine = posts.filter((p) => p.authorId === 'me');
  const myVibes = vibes.filter((v) => v.authorId === 'me');
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const views = seeded(7, 40, 120).map((value, i) => ({ label: days[i], value }));
  return (
    <MenuShell description="Vue d'ensemble de votre activité (statistiques de démonstration)">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Vues (7 j)" value={compactNumber(views.reduce((n, v) => n + v.value, 0))} icon={Eye} hint="+12 % vs semaine passée" />
        <StatTile label="Abonnés" value="148" icon={Users} hint="+9 cette semaine" />
        <StatTile label="Publications" value={mine.length} icon={FilePen} />
        <StatTile label="Cele Vibes" value={myVibes.length} icon={TrendingUp} />
      </div>
      <BarChart title="Vues par jour" data={views} />
      <div className="card mt-4 rounded-2xl p-4">
        <p className="mb-2 font-extrabold">Vos contenus</p>
        {mine.length + myVibes.length === 0 ? <EmptyState icon={FilePen} title="Publiez votre premier contenu" action={<Button to="/social?creer=publication">Créer une publication</Button>} className="py-6" /> : (
          [...mine.map((p) => ({ id: p.id, title: p.body.slice(0, 60), kind: 'Publication', likes: p.likes, comments: p.comments.length })), ...myVibes.map((v) => ({ id: v.id, title: v.caption, kind: 'Cele Vibe', likes: v.likes, comments: v.comments.length }))].map((c) => (
            <div key={c.id} className="flex items-center gap-3 border-t border-line py-2.5 text-sm first:border-0">
              <Chip tone="gray">{c.kind}</Chip><span className="flex-1 truncate">{c.title}</span>
              <span className="flex items-center gap-1 text-ink-muted"><Heart size={13} />{c.likes}</span>
              <span className="flex items-center gap-1 text-ink-muted"><MessageCircle size={13} />{c.comments}</span>
            </div>
          ))
        )}
      </div>
    </MenuShell>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<'7j' | '30j' | '12m'>('7j');
  const data = useMemo(() => {
    if (period === '7j') return seeded(7, 30, 90, 3).map((value, i) => ({ label: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i], value }));
    if (period === '30j') return seeded(10, 80, 200, 5).map((value, i) => ({ label: `${i * 3 + 1}`, value }));
    return seeded(12, 600, 1800, 2).map((value, i) => ({ label: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i], value }));
  }, [period]);
  const cities = [['Cotonou', 42], ['Porto-Novo', 21], ['Lokossa', 14], ['Lagos', 11], ['Lomé', 7], ['Autres', 5]] as const;
  return (
    <MenuShell description="Audience et engagement (données de démonstration)">
      <Pills value={period} onChange={setPeriod} options={[{ id: '7j', label: '7 jours' }, { id: '30j', label: '30 jours' }, { id: '12m', label: '12 mois' }]} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Vues" value={compactNumber(data.reduce((n, d) => n + d.value, 0))} icon={Eye} />
        <StatTile label="Taux d'engagement" value="6,8 %" icon={Heart} />
        <StatTile label="Temps moyen" value="1 min 42" icon={TrendingUp} />
      </div>
      <BarChart title="Vues" data={data} />
      <div className="card mt-4 rounded-2xl p-4">
        <p className="mb-3 font-extrabold">Audience par ville (%)</p>
        <div className="space-y-2.5">
          {cities.map(([c, v]) => (
            <div key={c} className="grid grid-cols-[100px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
              <span className="font-semibold">{c}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-surface-sunken"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${(v / 42) * 100}%` }} /></span>
              <span className="text-right tabular-nums text-ink-muted">{v} %</span>
            </div>
          ))}
        </div>
      </div>
    </MenuShell>
  );
}

export function BrouillonsPage() {
  const drafts = useMenu((s) => s.drafts);
  const [editing, setEditing] = useState<Partial<Draft> | null>(null);
  return (
    <MenuShell description="Travaillez vos publications avant de les partager" actions={<Button size="sm" icon={Plus} onClick={() => setEditing({ title: '', body: '' })}>Nouveau</Button>}>
      {drafts.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={FilePen} title="Aucun brouillon" /></div> : (
        <div className="space-y-2">
          {drafts.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 rounded-2xl p-4">
              <button onClick={() => setEditing(d)} className="min-w-0 flex-1 text-left"><p className="truncate font-bold">{d.title || 'Sans titre'}</p><p className="truncate text-sm text-ink-muted">{d.body}</p><p className="text-xs text-ink-faint">Modifié {timeAgo(d.updatedAt)}</p></button>
              <Button size="sm" icon={Send} onClick={() => { actions.createPost({ body: d.title ? `${d.title}\n\n${d.body}` : d.body, audience: 'public' }); menu.deleteDraft(d.id); toast('Brouillon publié sur le fil Social'); }}>Publier</Button>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={async () => { if (await confirmDialog({ title: 'Supprimer ce brouillon ?', confirmLabel: 'Supprimer', tone: 'danger' })) menu.deleteDraft(d.id); }} aria-label="Supprimer" />
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing.id ? 'Modifier le brouillon' : 'Nouveau brouillon'} footer={<Button disabled={!editing.body?.trim()} onClick={() => { menu.saveDraft({ id: editing.id, title: editing.title ?? '', body: editing.body ?? '' }); setEditing(null); toast('Brouillon enregistré'); }}>Enregistrer</Button>}>
          <input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Titre" className="field mb-3" />
          <textarea autoFocus value={editing.body ?? ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={7} className="field h-auto py-2.5" placeholder="Votre texte…" />
        </Modal>
      )}
    </MenuShell>
  );
}

export function PublicationProgrammeePage() {
  const posts = useApp((s) => s.socialPosts);
  const scheduled = posts.filter((p) => p.authorId === 'me' && p.scheduledFor);
  return (
    <MenuShell description="Publications en attente de diffusion" actions={<Button size="sm" icon={Plus} to="/social?creer=publication">Programmer</Button>}>
      {scheduled.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={CalendarClock} title="Aucune publication programmée" text="Activez « Programmer la publication » dans le composeur." action={<Button to="/social?creer=publication">Programmer une publication</Button>} /></div> : (
        <div className="space-y-2">
          {scheduled.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 rounded-2xl p-4">
              <span className="icon-tile h-11 w-11 rounded-xl"><CalendarClock size={19} /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.body}</p><p className="text-xs text-ink-muted">Prévue le {new Date(p.scheduledFor!).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
              <Button size="sm" onClick={() => { actions.updatePost(p.id, { scheduledFor: undefined, createdAt: new Date().toISOString() }); toast('Publiée maintenant'); }}>Publier</Button>
              <Button size="sm" variant="ghost" onClick={() => { actions.deletePost(p.id); toast('Programmation annulée'); }}>Annuler</Button>
            </div>
          ))}
        </div>
      )}
    </MenuShell>
  );
}

export function BadgesVerificationPage() {
  const request = useMenu((s) => s.verificationRequest);
  const [kind, setKind] = useState('Créateur de contenu');
  const [sending, setSending] = useState(false);
  const steps = ['Demande envoyée', 'Examen par l’administration', 'Badge attribué'];
  const current = request ? 1 : -1;
  return (
    <MenuShell description="Le badge ✓ confirme l'authenticité d'un compte officiel ou d'un créateur">
      <div className="card rounded-3xl p-5">
        <div className="mb-5 flex items-center gap-2">{steps.map((s, i) => (<div key={s} className="flex flex-1 items-center gap-2"><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', i <= current ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-muted')}>{i < current ? <Check size={15} /> : i + 1}</span><span className="hidden text-xs font-semibold sm:block">{s}</span>{i < steps.length - 1 && <span className="h-0.5 flex-1 bg-line" />}</div>))}</div>
        {request ? (
          <p className="flex items-center gap-2 rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700"><BadgeCheck size={17} /> Demande « {request.kind} » {request.status} (envoyée le {formatDate(request.date)}).</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Type de compte</p>
            <div className="flex flex-wrap gap-2">{['Créateur de contenu', 'Paroisse', 'Chorale', 'Ministère'].map((k) => <button key={k} onClick={() => setKind(k)} className={cn('h-9 rounded-full border px-4 text-sm font-semibold', kind === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{k}</button>)}</div>
            <Button icon={BadgeCheck} loading={sending} loadingText="Envoi…" onClick={async () => { setSending(true); await sleep(800); setSending(false); menu.requestVerification(kind); toast('Demande de badge envoyée'); }}>Demander le badge</Button>
          </div>
        )}
      </div>
    </MenuShell>
  );
}

const licenses = ['Tous droits réservés', 'Partage autorisé (non commercial)', 'Usage libre en paroisse', 'Domaine public'];

export function DroitsPage() {
  const posts = useApp((s) => s.socialPosts);
  const vibes = useApp((s) => s.vibes);
  const rights = useMenu((s) => s.contentRights);
  const items = [
    ...posts.filter((p) => p.authorId === 'me').map((p) => ({ id: p.id, title: p.body.slice(0, 50), kind: 'Publication' })),
    ...vibes.filter((v) => v.authorId === 'me').map((v) => ({ id: v.id, title: v.caption, kind: 'Cele Vibe' })),
    { id: 'demo-album', title: 'Album « Louanges du matin » (exemple)', kind: 'Musique' },
  ];
  return (
    <MenuShell description="Définissez comment vos contenus peuvent être réutilisés">
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="card flex flex-wrap items-center gap-3 rounded-2xl p-4">
            <Shield size={18} className="text-brand-600" />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{it.title}</p><p className="text-xs text-ink-muted">{it.kind}</p></div>
            <select value={rights[it.id] ?? licenses[0]} onChange={(e) => { menu.setRight(it.id, e.target.value); toast('Licence mise à jour'); }} className="field h-10 w-auto min-w-[220px] text-sm">{licenses.map((l) => <option key={l}>{l}</option>)}</select>
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function MonetisationPage() {
  const request = useMenu((s) => s.verificationRequest);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [balance, setBalance] = useState(12_450);
  const criteria = [
    { label: '100 abonnés', done: true },
    { label: '1 000 vues sur 30 jours', done: true },
    { label: 'Badge de vérification', done: !!request },
    { label: 'Respect des règles de la communauté', done: true },
  ];
  const ok = criteria.filter((c) => c.done).length;
  return (
    <MenuShell description="Recevez une rémunération pour vos contenus (simulation)">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Solde disponible" value={`${balance.toLocaleString('fr-FR')} FCFA`} icon={Wallet} />
        <StatTile label="Revenus du mois" value="4 300 FCFA" icon={TrendingUp} />
        <StatTile label="Éligibilité" value={`${ok}/${criteria.length}`} icon={BadgeCheck} />
      </div>
      <div className="card mb-4 rounded-3xl p-5">
        <p className="mb-3 font-extrabold">Conditions d'éligibilité</p>
        {criteria.map((c) => <p key={c.label} className="flex items-center gap-2 py-1.5 text-sm"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full', c.done ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-muted')}>{c.done && <Check size={13} strokeWidth={3} />}</span>{c.label}</p>)}
        {!request && <Button size="sm" variant="soft" className="mt-2" to="/menu/outils-createurs/badges-verification">Obtenir le badge</Button>}
      </div>
      <Button icon={Wallet} disabled={balance < 5000} onClick={() => setWithdrawOpen(true)}>Retirer mes gains</Button>
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Retrait vers Mobile Money" size="sm" footer={<Button onClick={() => { setBalance(0); setWithdrawOpen(false); toast('Retrait demandé — réception sous 24 h'); }}>Confirmer le retrait</Button>}>
        <p className="mb-3 text-sm">Montant : <b>{balance.toLocaleString('fr-FR')} FCFA</b></p>
        <input placeholder="Numéro Mobile Money" className="field" />
      </Modal>
    </MenuShell>
  );
}
