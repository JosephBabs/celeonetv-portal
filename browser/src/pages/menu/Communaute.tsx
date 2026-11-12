import { useEffect, useMemo, useState } from 'react';
import {
  Award, CalendarDays, ChevronDown, CircleAlert, Download, Gift, HandHeart, HeartPulse, Info, Lock, Medal, MonitorSmartphone, Phone, RefreshCw,
  Send, ShieldAlert, Star, Trophy, TriangleAlert, Tv, Unplug,
} from 'lucide-react';
import { candidatesFor } from '@/data/youth';
import { accountName, useApp } from '@/store/app';
import { useLibrary } from '@/store/library';
import { useAgenda } from '@/store/agenda';
import { menu, useMenu } from '@/store/menu';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Toggle } from '@/components/ui/Toggle';
import { Chip } from '@/components/ui/Chip';
import { cn, timeAgo } from '@/lib/utils';
import { MenuShell, Pills, StatTile } from './MenuShell';

/* ───────────── Progression & récompenses ───────────── */

const rivals = [['Grâce Houénou', 10], ['Joël Akpovi', 9], ['Ruth Sossa', 8], ['Fiacre Tchibozo', 7], ['Rachel Dossou', 6], ['Samuel Kpadé', 5]] as const;

export function ClassementQuizPage() {
  const account = useApp((s) => s.account);
  const best = useLibrary((s) => s.quizBest);
  const board = [...rivals.map(([n, s]) => ({ name: n, score: s, me: false })), { name: account ? accountName(account) : 'Vous', score: best, me: true }].sort((a, b) => b.score - a.score);
  return (
    <MenuShell description="Meilleurs scores au quiz biblique" actions={<Button size="sm" to="/jeunesse/quiz">Jouer</Button>}>
      <div className="card rounded-3xl p-2">
        {board.map((r, i) => (
          <div key={r.name} className={cn('flex items-center gap-3 rounded-xl px-4 py-3', r.me && 'bg-mint-100')}>
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-black', i === 0 ? 'bg-gold-500 text-night' : i < 3 ? 'bg-surface-sunken text-ink' : 'text-ink-muted')}>{i < 3 ? <Medal size={16} /> : i + 1}</span>
            <span className="flex-1 font-semibold">{r.name}{r.me && ' (vous)'}</span>
            <span className="font-black tabular-nums">{r.score}/10</span>
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function BadgesPage() {
  const best = useLibrary((s) => s.quizBest);
  const bookmarks = useLibrary((s) => s.bibleBookmarks);
  const hymns = useLibrary((s) => s.hymnRecent);
  const friends = useApp((s) => s.friends);
  const posts = useApp((s) => s.socialPosts);
  const alerts = useAgenda((s) => s.alerts);
  const donations = useMenu((s) => s.donations);
  const badges = [
    { name: 'Premier pas', text: 'Créer son compte', earned: true },
    { name: 'Lecteur assidu', text: 'Ajouter 3 signets bibliques', earned: bookmarks.length >= 3, progress: `${Math.min(3, bookmarks.length)}/3` },
    { name: 'Voix céleste', text: 'Ouvrir 5 cantiques', earned: hymns.length >= 5, progress: `${Math.min(5, hymns.length)}/5` },
    { name: 'Fraternité', text: 'Avoir 10 amis', earned: friends.length >= 10, progress: `${Math.min(10, friends.length)}/10` },
    { name: 'Témoin', text: 'Publier sur le fil Social', earned: posts.some((p) => p.authorId === 'me') },
    { name: 'Érudit', text: 'Obtenir 8/10 au quiz', earned: best >= 8, progress: `${best}/10` },
    { name: 'Organisé', text: 'Créer 3 alertes d’agenda', earned: alerts.length >= 3, progress: `${Math.min(3, alerts.length)}/3` },
    { name: 'Généreux', text: 'Faire un don', earned: donations.length > 0 },
  ];
  const earned = badges.filter((b) => b.earned).length;
  return (
    <MenuShell description={`${earned}/${badges.length} badges obtenus`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <div key={b.name} className={cn('card flex flex-col items-center rounded-3xl p-4 text-center', !b.earned && 'opacity-60')}>
            <span className={cn('mb-2 flex h-16 w-16 items-center justify-center rounded-full', b.earned ? 'rainbow-ring p-[3px]' : 'bg-surface-sunken')}>
              <span className={cn('flex h-full w-full items-center justify-center rounded-full', b.earned ? 'bg-surface text-gold-500' : 'text-ink-faint')}>{b.earned ? <Award size={28} /> : <Lock size={24} />}</span>
            </span>
            <p className="font-extrabold">{b.name}</p>
            <p className="text-xs text-ink-muted">{b.text}</p>
            {!b.earned && b.progress && <Chip tone="gray" className="mt-2">{b.progress}</Chip>}
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function ClassementJeunessePage() {
  const year = useLibrary((s) => s.youthYear);
  const list = useMemo(() => candidatesFor(year).map((c) => ({ ...c, total: Object.values(c.scores).reduce<number>((n, v) => n + (v ?? 0), 0) })).sort((a, b) => b.total - a.total).slice(0, 10), [year]);
  return (
    <MenuShell description={`Top 10 du concours ${year} (cumul des phases)`} actions={<Button size="sm" variant="soft" to="/jeunesse/resultats">Résultats détaillés</Button>}>
      <div className="card rounded-3xl p-2">
        {list.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-black', i === 0 ? 'bg-gold-500 text-night' : 'bg-surface-sunken')}>{i < 3 ? <Trophy size={15} /> : i + 1}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.firstName} {c.lastName}</span><span className="block text-xs text-ink-muted">{c.id} · {c.category}</span></span>
            <span className="font-black tabular-nums">{c.total} pts</span>
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

const rewards = [
  { id: 'r1', name: 'Fond d’écran exclusif', cost: 'Badge « Premier pas »', unlocked: true },
  { id: 'r2', name: 'Cadre de profil arc-en-ciel', cost: '3 badges', unlocked: true },
  { id: 'r3', name: 'Accès anticipé aux nouveaux cantiques', cost: 'Badge « Voix céleste »', unlocked: false },
  { id: 'r4', name: 'Invitation à la finale Jeunesse', cost: 'Top 10 du quiz', unlocked: false },
];

export function RecompensesPage() {
  const claimed = useMenu((s) => s.rewardsClaimed);
  return (
    <MenuShell description="Échangez vos badges contre des récompenses">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rewards.map((r) => {
          const got = claimed.includes(r.id);
          return (
            <div key={r.id} className={cn('card flex items-center gap-4 rounded-3xl p-5', !r.unlocked && 'opacity-60')}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-700"><Gift size={22} /></span>
              <div className="min-w-0 flex-1"><p className="font-extrabold">{r.name}</p><p className="text-xs text-ink-muted">Condition : {r.cost}</p></div>
              <Button size="sm" variant={got ? 'soft' : 'primary'} disabled={!r.unlocked || got} onClick={() => { menu.claimReward(r.id); toast('Récompense obtenue 🎉'); }}>{got ? 'Obtenue' : r.unlocked ? 'Réclamer' : 'Verrouillée'}</Button>
            </div>
          );
        })}
      </div>
    </MenuShell>
  );
}

/* ───────────── Urgences & alertes ───────────── */

const urgent = [
  { id: 'u1', level: 'Critique', title: 'Inondations à Cotonou', text: 'Les cultes du soir dans les paroisses d’Akpakpa sont suspendus jusqu’à nouvel ordre.', region: 'Littoral', date: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: 'u2', level: 'Important', title: 'Pèlerinage : consignes de sécurité', text: 'Prévoir eau, pièce d’identité et respecter les zones balisées.', region: 'Ouémé', date: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: 'u3', level: 'Information', title: 'Coupure de courant programmée', text: 'Le culte de mercredi à Lokossa se tiendra en plein air.', region: 'Mono', date: new Date(Date.now() - 50 * 3600_000).toISOString() },
  { id: 'u4', level: 'Important', title: 'Route Parakou fermée', text: 'Déviation recommandée pour rejoindre la paroisse Galilée.', region: 'Borgou', date: new Date(Date.now() - 80 * 3600_000).toISOString() },
];
const levelStyle: Record<string, string> = { Critique: 'bg-danger text-white', Important: 'bg-gold-500 text-night', Information: 'bg-lavender-50 text-lavender' };
const levelIcon: Record<string, typeof TriangleAlert> = { Critique: TriangleAlert, Important: CircleAlert, Information: Info };

function UrgentCard({ u }: { u: (typeof urgent)[number] }) {
  const Icon = levelIcon[u.level];
  return (
    <div className="card flex gap-4 rounded-2xl p-4">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', levelStyle[u.level])}><Icon size={20} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', levelStyle[u.level])}>{u.level}</span><span className="text-xs text-ink-muted">{u.region} · {timeAgo(u.date)}</span></div>
        <p className="mt-1 font-bold">{u.title}</p><p className="text-sm text-ink-soft">{u.text}</p>
      </div>
    </div>
  );
}

export function AnnoncesUrgentesPage() {
  const [subscribed, setSubscribed] = useState(true);
  return (
    <MenuShell description="Communiqués urgents de l'administration" actions={<div className="flex items-center gap-2 text-sm font-semibold">Alertes <Toggle checked={subscribed} onChange={(v) => { setSubscribed(v); toast(v ? 'Alertes urgentes activées' : 'Alertes urgentes désactivées'); }} label="Recevoir les alertes" /></div>}>
      <div className="space-y-2">{urgent.map((u) => <UrgentCard key={u.id} u={u} />)}</div>
    </MenuShell>
  );
}

export function AlertesRegionalesPage() {
  const regions = ['Toutes', ...new Set(urgent.map((u) => u.region))];
  const [region, setRegion] = useState('Toutes');
  const list = urgent.filter((u) => region === 'Toutes' || u.region === region);
  return (
    <MenuShell description="Filtrez les alertes par région">
      <Pills value={region} onChange={setRegion} options={regions.map((r) => ({ id: r, label: r }))} />
      {list.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={ShieldAlert} title="Aucune alerte dans cette région" /></div> : <div className="space-y-2">{list.map((u) => <UrgentCard key={u.id} u={u} />)}</div>}
    </MenuShell>
  );
}

const emergency = [['Police secours', '117'], ['Sapeurs-pompiers', '118'], ['SAMU', '112'], ['Cellule de crise de l’Église (démo)', '+229 01 21 00 00 09']] as const;

export function CrisePage() {
  const [open, setOpen] = useState<number | null>(0);
  const guides = [
    { t: 'En cas d’inondation', s: 'Rejoignez un point haut, coupez l’électricité, ne traversez pas les zones inondées. Signalez-vous à votre paroisse.' },
    { t: 'En cas d’incendie', s: 'Évacuez sans courir, ne revenez pas chercher vos affaires, appelez le 118.' },
    { t: 'Lors d’un grand rassemblement', s: 'Repérez les sorties, convenez d’un point de rendez-vous avec vos proches, suivez les consignes des encadreurs.' },
  ];
  return (
    <MenuShell description="Numéros utiles et bons réflexes (contenu de démonstration)">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {emergency.map(([n, num]) => (
          <a key={n} href={`tel:${num.replace(/\s/g, '')}`} className="card card-hover flex items-center gap-3 rounded-2xl p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50 text-danger"><Phone size={19} /></span>
            <span className="flex-1"><span className="block font-bold">{n}</span><span className="block text-sm text-ink-muted">{num}</span></span>
          </a>
        ))}
      </div>
      <div className="space-y-2">
        {guides.map((g, i) => (
          <div key={g.t} className="card overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-3 p-4 text-left font-bold"><Info size={18} className="text-brand-600" /><span className="flex-1">{g.t}</span><ChevronDown size={18} className={cn('transition', open === i && 'rotate-180')} /></button>
            {open === i && <p className="border-t border-line px-4 py-3 text-sm text-ink-soft">{g.s}</p>}
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function PrierePage() {
  const prayers = useMenu((s) => s.prayers);
  const prayed = useMenu((s) => s.prayedFor);
  const account = useApp((s) => s.account);
  const [text, setText] = useState('');
  const [urgentFlag, setUrgentFlag] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  return (
    <MenuShell description="Portez ensemble les intentions urgentes de la communauté">
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim().length < 10) return toast('Décrivez votre intention en quelques mots', { tone: 'danger' }); menu.addPrayer({ author: anonymous || !account ? 'Anonyme' : accountName(account), text: text.trim(), urgent: urgentFlag }); setText(''); toast('Intention partagée avec la communauté'); }} className="card mb-4 space-y-3 rounded-3xl p-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="field h-auto py-2.5" placeholder="Votre intention de prière…" />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={urgentFlag} onChange={(e) => setUrgentFlag(e.target.checked)} className="h-4 w-4 accent-brand-600" /> Urgente</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-brand-600" /> Anonyme</label>
          <Button type="submit" size="sm" icon={Send} className="ml-auto">Partager</Button>
        </div>
      </form>
      <div className="space-y-2">
        {prayers.map((p) => {
          const did = prayed.includes(p.id);
          return (
            <div key={p.id} className="card flex gap-4 rounded-2xl p-4">
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', p.urgent ? 'bg-danger-50 text-danger' : 'bg-mint-100 text-brand-700')}><HeartPulse size={20} /></span>
              <div className="min-w-0 flex-1"><p className="text-xs text-ink-muted">{p.author} · {timeAgo(p.date)}{p.urgent && ' · Urgente'}</p><p className="mt-0.5">{p.text}</p></div>
              <Button size="sm" variant={did ? 'soft' : 'ghost'} icon={HandHeart} disabled={did} onClick={() => { menu.pray(p.id); toast('Merci de prier pour cette intention 🙏'); }}>{did ? 'Je prie' : 'Prier'} · {p.count}</Button>
            </div>
          );
        })}
      </div>
    </MenuShell>
  );
}

/* ───────────── Intégrations ───────────── */

export function SyncCalendrierPage() {
  const integrations = useMenu((s) => s.integrations);
  const alerts = useAgenda((s) => s.alerts);
  const exportIcs = () => {
    const pad = (s: string) => s.replace(/[-:]/g, '');
    const events = alerts.map((a) => `BEGIN:VEVENT\nUID:${a.id}@celeone\nDTSTART:${pad(a.date)}T${pad(a.time)}00\nSUMMARY:${a.title}\nEND:VEVENT`).join('\n');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CeleOne//Agenda//FR\n${events}\nEND:VCALENDAR`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    link.download = 'agenda-celeone.ics';
    link.click();
    toast(`${alerts.length} alerte(s) exportée(s)`);
  };
  return (
    <MenuShell description="Synchronisez votre agenda Cèlè One avec vos calendriers">
      <div className="mb-4 space-y-2">
        {[['google', 'Google Agenda'], ['outlook', 'Outlook'], ['apple', 'Calendrier Apple']].map(([k, label]) => (
          <div key={k} className="card flex items-center gap-3 rounded-2xl p-4">
            <span className="icon-tile h-11 w-11 rounded-xl"><CalendarDays size={19} /></span>
            <div className="flex-1"><p className="font-bold">{label}</p><p className="text-xs text-ink-muted">{integrations[k] ? 'Connecté — synchronisation automatique (démo)' : 'Non connecté'}</p></div>
            <Button size="sm" variant={integrations[k] ? 'ghost' : 'primary'} icon={integrations[k] ? Unplug : RefreshCw} onClick={() => toast(menu.toggleIntegration(k) ? `${label} connecté` : `${label} déconnecté`)}>{integrations[k] ? 'Déconnecter' : 'Connecter'}</Button>
          </div>
        ))}
      </div>
      <div className="card flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <Download size={18} className="text-brand-600" />
        <p className="flex-1 text-sm"><b>Exporter au format .ics</b><br /><span className="text-ink-muted">Compatible avec tous les calendriers</span></p>
        <Button size="sm" variant="soft" onClick={exportIcs}>Exporter</Button>
      </div>
    </MenuShell>
  );
}

export function ConnexionComptesPage() {
  const integrations = useMenu((s) => s.integrations);
  return (
    <MenuShell description="Connectez-vous plus rapidement avec vos comptes">
      <div className="space-y-2">
        {[['login-google', 'Google'], ['login-apple', 'Apple']].map(([k, label]) => (
          <div key={k} className="card flex items-center gap-3 rounded-2xl p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken font-display text-lg font-black">{label[0]}</span>
            <div className="flex-1"><p className="font-bold">Connexion avec {label}</p><p className="text-xs text-ink-muted">{integrations[k] ? 'Compte associé' : 'Non associé'}</p></div>
            <Toggle checked={!!integrations[k]} onChange={() => toast(menu.toggleIntegration(k) ? `Compte ${label} associé` : `Compte ${label} dissocié`)} label={`Connexion avec ${label}`} />
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

export function SmartTvPage() {
  const code = useMenu((s) => s.tvCode);
  const paired = useMenu((s) => s.tvPaired);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!code) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [code]);
  const remaining = code ? Math.max(0, Math.round((code.expires - now) / 1000)) : 0;
  return (
    <MenuShell description="Regardez Cèlè One TV sur votre téléviseur">
      {paired ? (
        <div className="card flex items-center gap-4 rounded-3xl p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white"><Tv size={26} /></span>
          <div className="flex-1"><p className="font-extrabold">{paired}</p><p className="text-sm text-ink-muted">Téléviseur associé</p></div>
          <Button variant="danger-soft" onClick={() => { menu.pairTv(null); toast('Téléviseur dissocié'); }}>Dissocier</Button>
        </div>
      ) : (
        <div className="card rounded-3xl p-6 text-center">
          <MonitorSmartphone size={40} className="mx-auto text-brand-600" />
          <p className="mt-3 text-ink-soft">Ouvrez l'application Cèlè One TV sur votre téléviseur, puis saisissez ce code :</p>
          {code && remaining > 0 ? (
            <>
              <p className="my-4 font-mono text-4xl font-black tracking-[0.3em] text-brand-800">{code.code}</p>
              <p className="text-sm text-ink-muted">Expire dans {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</p>
              <Button className="mt-4" onClick={() => { menu.pairTv('Téléviseur du salon'); toast('Téléviseur associé (démo)'); }}>Simuler la saisie sur la TV</Button>
            </>
          ) : (
            <Button className="mt-4" icon={RefreshCw} onClick={() => menu.newTvCode()}>{code ? 'Générer un nouveau code' : 'Générer un code'}</Button>
          )}
        </div>
      )}
    </MenuShell>
  );
}

/* ───────────── Aide ───────────── */

const faq = [
  ['Comment changer de langue ?', 'Depuis l’écran de connexion (icône ⚙) ou dans Paramètres > Profil. Les traductions arrivent progressivement.'],
  ['Comment écouter un cantique ?', 'Ouvrez Cantiques, choisissez une langue, un numéro, puis touchez « Audio ». La lecture continue pendant la navigation.'],
  ['Mes données sont-elles sauvegardées ?', 'Dans cette démonstration, elles restent dans votre navigateur. « Réinitialiser la démo » (menu du profil) remet tout à zéro.'],
  ['Comment inscrire un enfant au concours ?', 'Jeunesse > Inscription. Un identifiant EAJ est généré pour suivre ses résultats.'],
  ['Comment trouver une paroisse proche ?', 'Carte des paroisses ou Menu > GPS & Paroisses > Paroisses proches.'],
];

export function AidePage() {
  const [open, setOpen] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const list = faq.filter(([t, a]) => `${t} ${a}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <MenuShell description="Questions fréquentes et assistance">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Réponse moyenne" value="< 24 h" icon={Star} />
        <StatTile label="Articles d'aide" value={faq.length} icon={Info} />
        <StatTile label="Disponibilité" value="7j/7" icon={Phone} />
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans l'aide…" className="field mb-3 h-12 rounded-2xl" />
      <div className="mb-4 space-y-2">
        {list.map(([t, a], i) => (
          <div key={t} className="card overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-3 p-4 text-left font-bold"><span className="flex-1">{t}</span><ChevronDown size={18} className={cn('transition', open === i && 'rotate-180')} /></button>
            {open === i && <p className="border-t border-line px-4 py-3 text-sm text-ink-soft">{a}</p>}
          </div>
        ))}
        {list.length === 0 && <p className="py-4 text-center text-sm text-ink-muted">Aucun article ne correspond.</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (msg.trim().length < 10) return; setMsg(''); toast('Message envoyé au support'); }} className="card space-y-3 rounded-3xl p-5">
        <p className="font-extrabold">Contacter le support</p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="field h-auto py-2.5" placeholder="Décrivez votre problème…" />
        <Button type="submit" icon={Send} disabled={msg.trim().length < 10}>Envoyer</Button>
      </form>
    </MenuShell>
  );
}
