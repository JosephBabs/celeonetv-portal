import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck, Building2, CalendarPlus, ChevronDown, Clock, Copy, Download, Globe, History, LocateFixed, Mail, MapPin, Navigation, Phone, QrCode,
  RotateCcw, RotateCw, Search, Send, Share2, ShieldCheck, Trash2, UserRound, XCircle,
} from 'lucide-react';
import { distanceKm } from '@/data/parishes';
import { ensureParishes, useParishes, type ParishView as Parish } from '@/services/parishes';
import { bibleLanguages } from '@/data/bible';
import { accountName, useApp } from '@/store/app';
import { agenda } from '@/store/agenda';
import { menu, useMenu } from '@/store/menu';
import { library, useLibrary } from '@/store/library';
import { openShare, toast } from '@/store/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { Chip } from '@/components/ui/Chip';
import { cn, copyText, formatDate, normalize } from '@/lib/utils';
import { MenuShell } from './MenuShell';

const COTONOU = { lat: 6.3654, lng: 2.4183 };

function useMyPosition() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'denied'>('idle');
  const locate = () => {
    if (!('geolocation' in navigator)) return setState('denied');
    setState('loading');
    navigator.geolocation.getCurrentPosition((p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setState('idle'); }, () => setState('denied'), { timeout: 8000 });
  };
  return { pos, state, locate };
}

const hueOf = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** Paroisses de l'API en cours de chargement, en erreur ou absentes. Rien quand la liste est prête. */
function ParishesState({ data }: { data: ReturnType<typeof useParishes> }) {
  if (!data.remote || data.list.length > 0) return null;
  if (data.status === 'error') {
    return <div className="card rounded-3xl"><EmptyState icon={Building2} title="Paroisses indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void ensureParishes()}>Réessayer</Button>} /></div>;
  }
  if (data.status === 'ready') return <div className="card rounded-3xl"><EmptyState icon={Building2} title="Aucune paroisse publiée pour le moment" /></div>;
  return <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[76px] rounded-2xl" />)}</div>;
}

function ParishFiche({ p, onClose }: { p: Parish | null; onClose: () => void }) {
  const navigate = useNavigate();
  if (!p) return null;
  return (
    <Modal open onClose={onClose} title={p.name} description={p.address || p.city}
      footer={<><Button variant="ghost" icon={Share2} onClick={() => openShare({ title: p.name, url: `/carte-paroisses?paroisse=${p.id}` })}>Partager</Button><Button icon={Navigation} onClick={() => navigate(`/carte-paroisses?paroisse=${p.id}`)}>{p.located ? 'Itinéraire' : 'Voir la fiche'}</Button></>}>
      <div className="space-y-2 text-sm">
        {p.shepherd && <p className="flex items-center gap-2"><UserRound size={16} className="text-brand-600" /> {p.shepherd}</p>}
        {p.phone && <p className="flex items-center gap-2"><Phone size={16} className="text-brand-600" /> <a className="font-semibold text-brand-700 hover:underline" href={`tel:${p.phone.replace(/\s/g, '')}`}>{p.phone}</a></p>}
        {(p.founded || p.feast) && <p className="flex items-center gap-2"><CalendarPlus size={16} className="text-brand-600" /> {[p.founded && `Fondée le ${formatDate(p.founded)}`, p.feast && `Fête le ${p.feast}`].filter(Boolean).join(' · ')}</p>}
        {p.schedule.length > 0 && <div className="rounded-xl bg-surface-sunken p-3">{p.schedule.map((s, i) => <p key={`${s.day}-${i}`} className="flex gap-2 py-0.5"><Clock size={14} className="mt-0.5 text-brand-600" /><b>{s.day}</b> {s.hours}</p>)}</div>}
        {!p.shepherd && !p.phone && !p.schedule.length && !p.founded && <p className="text-ink-muted">Les informations détaillées de cette paroisse ne sont pas encore renseignées.</p>}
      </div>
    </Modal>
  );
}

function ParishRow({ p, extra, onOpen }: { p: Parish; extra?: string; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card card-hover flex w-full items-center gap-3 rounded-2xl p-4 text-left">
      <span className="icon-tile h-11 w-11 rounded-xl"><Building2 size={19} /></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-bold">{p.name}</span><span className="block truncate text-xs text-ink-muted">{p.address || p.city}</span></span>
      {extra && <span className="shrink-0 text-sm font-bold text-brand-700">{extra}</span>}
    </button>
  );
}

/* ───────────── GPS & Paroisses ───────────── */

export function ParoissesProchesPage() {
  const { pos, state, locate } = useMyPosition();
  const [open, setOpen] = useState<Parish | null>(null);
  const data = useParishes();
  const origin = pos ?? COTONOU;
  const list = useMemo(() => data.list.filter((p) => p.located).map((p) => ({ p, d: distanceKm(origin, p) })).sort((a, b) => a.d - b.d).slice(0, 100), [data.list, origin]);
  return (
    <MenuShell description={pos ? 'Triées depuis votre position' : 'Triées depuis Cotonou — activez la localisation pour plus de précision'} actions={<Button size="sm" icon={LocateFixed} loading={state === 'loading'} onClick={locate}>Ma position</Button>}>
      {state === 'denied' && <p className="mb-3 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-700">Géolocalisation refusée : la liste reste triée depuis Cotonou.</p>}
      <ParishesState data={data} />
      <div className="space-y-2">{list.map(({ p, d }) => <ParishRow key={p.id} p={p} extra={`${d.toFixed(1)} km`} onOpen={() => setOpen(p)} />)}</div>
      <ParishFiche p={open} onClose={() => setOpen(null)} />
    </MenuShell>
  );
}

/** Garde le choix d'un <select> valide quand la liste des paroisses change (chargement de l'API). */
function useParishChoice(list: Parish[], fallbackIndex = 0) {
  const [id, setId] = useState('');
  useEffect(() => {
    if (list.length && !list.some((p) => p.id === id)) setId(list[Math.min(fallbackIndex, list.length - 1)].id);
  }, [list, id, fallbackIndex]);
  return [id, setId] as const;
}

const byName = (a: Parish, b: Parish) => a.name.localeCompare(b.name);

export function GuidagePage() {
  const navigate = useNavigate();
  const data = useParishes();
  const parishes = useMemo(() => data.list.filter((p) => p.located).sort(byName), [data.list]);
  const [to, setTo] = useParishChoice(parishes);
  const [from, setFrom] = useState('me');
  const target = parishes.find((p) => p.id === to);
  const start = from === 'me' ? null : parishes.find((p) => p.id === from);
  if (!target) return <MenuShell description="Choisissez une destination et lancez le guidage"><ParishesState data={data} /></MenuShell>;
  return (
    <MenuShell description="Choisissez une destination et lancez le guidage">
      <div className="card space-y-4 rounded-3xl p-5">
        <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Départ</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="field"><option value="me">Ma position actuelle</option>{parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Destination</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="field">{parishes.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.city}</option>)}</select></label>
        {start && <p className="rounded-xl bg-mint-100 px-4 py-2.5 text-sm font-semibold text-brand-900">Distance estimée : {(distanceKm(start, target) * 1.25).toFixed(1)} km</p>}
        <div className="flex flex-wrap gap-2">
          <Button icon={Navigation} onClick={() => window.open(`https://www.openstreetmap.org/directions?route=${start ? `${start.lat},${start.lng}` : ''};${target.lat},${target.lng}`, '_blank', 'noopener')}>Lancer le guidage</Button>
          <Button variant="ghost" icon={MapPin} onClick={() => navigate(`/carte-paroisses?paroisse=${target.id}`)}>Voir sur la carte</Button>
        </div>
      </div>
    </MenuShell>
  );
}

export function PlanifierVisitePage() {
  const navigate = useNavigate();
  const data = useParishes();
  const parishes = useMemo(() => [...data.list].sort(byName), [data.list]);
  const [parishId, setParishId] = useParishChoice(parishes);
  const [form, setForm] = useState({ date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), time: '10:00', note: '' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = parishes.find((x) => x.id === parishId);
    if (!p) return;
    agenda.add({ type: 'fete', title: `Visite — ${p.name}`, date: form.date, time: form.time, repeat: 'aucune', parishId: p.id, notes: form.note || undefined, notify: true });
    toast('Visite planifiée dans votre agenda', { action: { label: 'Voir', onClick: () => navigate('/agenda') } });
  };
  return (
    <MenuShell description="Ajoutez une visite de paroisse à votre agenda">
      <ParishesState data={data} />
      <form onSubmit={submit} className={cn('card space-y-4 rounded-3xl p-5', !parishes.length && 'hidden')}>
        <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Paroisse</span><select value={parishId} onChange={(e) => setParishId(e.target.value)} className="field">{parishes.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city && ` · ${p.city}`}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" /></label>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Heure</span><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="field" /></label>
        </div>
        <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Note</span><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className="field h-auto py-2.5" placeholder="Ex. fête paroissiale, réunion…" /></label>
        <Button type="submit" icon={CalendarPlus}>Planifier la visite</Button>
      </form>
    </MenuShell>
  );
}

export function HistoriqueVisitesPage() {
  const visits = useMenu((s) => s.visits);
  const [open, setOpen] = useState(false);
  const data = useParishes();
  const parishes = useMemo(() => [...data.list].sort(byName), [data.list]);
  const [parishId, setParishId] = useParishChoice(parishes);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), note: '' });
  return (
    <MenuShell description={`${visits.length} visite${visits.length > 1 ? 's' : ''} enregistrée${visits.length > 1 ? 's' : ''}`} actions={<Button size="sm" icon={History} onClick={() => setOpen(true)}>Ajouter</Button>}>
      {visits.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={History} title="Aucune visite enregistrée" /></div> : (
        <div className="space-y-2">
          {visits.map((v) => {
            const p = data.get(v.parishId);
            return (
              <div key={v.id} className="card flex items-center gap-3 rounded-2xl p-4">
                <span className="icon-tile h-11 w-11 rounded-xl"><MapPin size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{p?.name ?? 'Paroisse'}</p><p className="text-xs text-ink-muted">{formatDate(v.date)}{v.note && ` · ${v.note}`}</p></div>
                <IconButton icon={Trash2} label="Supprimer" size="sm" variant="plain" onClick={() => { menu.removeVisit(v.id); toast('Visite supprimée'); }} />
              </div>
            );
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Enregistrer une visite" size="sm" footer={<Button disabled={!parishId} onClick={() => { menu.addVisit({ parishId, date: new Date(form.date).toISOString(), note: form.note || undefined }); setOpen(false); toast('Visite enregistrée'); }}>Enregistrer</Button>}>
        <div className="space-y-3">
          <select value={parishId} onChange={(e) => setParishId(e.target.value)} className="field">{parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" />
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (facultatif)" className="field" />
        </div>
      </Modal>
    </MenuShell>
  );
}

/* ───────────── Services de l'Église ───────────── */

export function AnnuairePage({ locator }: { locator?: boolean }) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Toutes');
  const [open, setOpen] = useState<Parish | null>(null);
  const data = useParishes();
  const parishes = data.list;
  const cities = useMemo(() => ['Toutes', ...[...new Set(parishes.map((p) => p.city).filter(Boolean))].sort((a, b) => a.localeCompare(b))], [parishes]);
  const list = useMemo(() => parishes.filter((p) => (city === 'Toutes' || p.city === city) && normalize(`${p.name} ${p.city} ${p.address} ${p.shepherd}`).includes(normalize(q))).sort(byName), [parishes, city, q]);
  return (
    <MenuShell description={locator ? 'Trouvez une paroisse par ville ou quartier' : `${parishes.length} paroisses référencées${data.remote ? '' : ' (démonstration)'}`}>
      <ParishesState data={data} />
      <label className="mb-3 flex h-12 items-center gap-2 rounded-2xl bg-surface-sunken px-4"><Search size={17} className="text-ink-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={locator ? 'Ville, quartier…' : 'Nom, ville, berger…'} className="flex-1 bg-transparent outline-none" /></label>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{cities.map((c) => <button key={c} onClick={() => setCity(c)} className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold', city === c ? 'bg-brand-700 text-white' : 'bg-surface-sunken hover:bg-line')}>{c}</button>)}</div>
      {!parishes.length ? null : list.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={Building2} title="Aucune paroisse trouvée" /></div> : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{list.slice(0, 200).map((p) => <ParishRow key={p.id} p={p} extra={locator ? p.city : undefined} onOpen={() => setOpen(p)} />)}</div>}
      <ParishFiche p={open} onClose={() => setOpen(null)} />
    </MenuShell>
  );
}

export function HorairesPage() {
  const [parishId, setParishId] = useState('tous');
  const data = useParishes();
  const parishes = useMemo(() => [...data.list].sort(byName), [data.list]);
  const WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  // Colonnes : les jours réellement présents dans les horaires (par défaut mercredi, vendredi, dimanche).
  const present = new Set(parishes.flatMap((p) => p.schedule.map((s) => s.day)));
  const days = present.size ? WEEK.filter((d) => present.has(d)) : ['Mercredi', 'Vendredi', 'Dimanche'];
  const list = parishes.filter((p) => (parishId === 'tous' ? p.schedule.length > 0 : p.id === parishId)).slice(0, 200);
  return (
    <MenuShell description="Horaires des cultes par paroisse">
      <ParishesState data={data} />
      <select value={parishId} onChange={(e) => setParishId(e.target.value)} className="field mb-4 max-w-sm"><option value="tous">Toutes les paroisses</option>{parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div className="card overflow-x-auto rounded-3xl">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-muted"><th className="px-4 py-3">Paroisse</th>{days.map((d) => <th key={d} className="px-4 py-3">{d}</th>)}</tr></thead>
          <tbody>{list.map((p) => <tr key={p.id} className="border-t border-line"><td className="px-4 py-3 font-semibold">{p.name}<span className="block text-xs font-normal text-ink-muted">{p.city}</span></td>{days.map((d) => <td key={d} className="px-4 py-3 text-ink-soft">{p.schedule.filter((s) => s.day === d).map((s) => s.hours.split(' — ')[0]).join(', ') || '—'}</td>)}</tr>)}</tbody>
        </table>
        {parishes.length > 0 && list.length === 0 && <p className="p-5 text-center text-sm text-ink-muted">Aucun horaire renseigné{parishId === 'tous' ? ' pour le moment' : ' pour cette paroisse'}.</p>}
      </div>
    </MenuShell>
  );
}

export function BergersPage() {
  const [q, setQ] = useState('');
  const [contact, setContact] = useState<Parish | null>(null);
  const [msg, setMsg] = useState('');
  const data = useParishes();
  const list = data.list.filter((p) => p.shepherd && normalize(`${p.shepherd} ${p.name} ${p.city}`).includes(normalize(q))).slice(0, 200);
  return (
    <MenuShell description={data.remote ? 'Responsables des paroisses' : 'Responsables des paroisses (noms fictifs)'}>
      <ParishesState data={data} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un berger ou une paroisse" className="field mb-4 h-12 rounded-2xl" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 rounded-2xl p-4">
            <Avatar name={p.shepherd.replace('Berger fictif ', '')} hue={hueOf(p.shepherd)} size="md" />
            <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.shepherd}</p><p className="truncate text-xs text-ink-muted">{[p.name, p.city].filter(Boolean).join(' · ')}</p></div>
            <Button size="sm" variant="soft" onClick={() => setContact(p)}>Contacter</Button>
          </div>
        ))}
      </div>
      {data.list.length > 0 && list.length === 0 && <div className="card rounded-3xl"><EmptyState icon={UserRound} title={q ? 'Aucun berger ne correspond à votre recherche' : 'Aucun berger renseigné pour le moment'} /></div>}
      <Modal open={!!contact} onClose={() => setContact(null)} title={`Écrire à ${contact?.shepherd ?? ''}`} size="sm" footer={<Button icon={Send} disabled={msg.trim().length < 5} onClick={() => { setContact(null); setMsg(''); toast('Message transmis au secrétariat de la paroisse'); }}>Envoyer</Button>}>
        <textarea autoFocus value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className="field h-auto py-2.5" placeholder="Votre message…" />
      </Modal>
    </MenuShell>
  );
}

const dioceses = [
  { name: 'Diocèse de l’Ouémé', districts: [{ name: 'District de Porto-Novo', parishes: ['sion-porto-novo'] }, { name: 'District de Sèmè', parishes: [] }] },
  { name: 'Diocèse du Littoral', districts: [{ name: 'District de Cotonou Est', parishes: ['jericho-cotonou'] }, { name: 'District de Cotonou Ouest', parishes: ['shiloh-cotonou'] }] },
  { name: 'Diocèse de l’Atlantique', districts: [{ name: 'District de Calavi', parishes: ['bethel-calavi'] }, { name: 'District d’Allada', parishes: ['bethanie-allada', 'emmanuel-ouidah'] }] },
  { name: 'Diocèse du Mono-Couffo', districts: [{ name: 'District de Lokossa', parishes: ['alpha-omega-djegbe'] }] },
  { name: 'Diocèse du Zou', districts: [{ name: 'District de Bohicon', parishes: ['canaan-bohicon', 'galilee-abomey'] }] },
  { name: 'Diocèse du Nord', districts: [{ name: 'District de Parakou', parishes: ['galilee-parakou'] }] },
];

/** Diocèses → districts → paroisses, d'après les champs des paroisses réelles (à défaut : par pays puis ville). */
function groupParishes(list: Parish[]) {
  const byDiocese = list.some((p) => p.diocese);
  const groups = new Map<string, Map<string, string[]>>();
  for (const p of list) {
    const g = byDiocese ? p.diocese || 'Autres paroisses' : p.country || 'Autres pays';
    const sub = byDiocese ? p.district || 'Sans district' : p.city || 'Ville non renseignée';
    if (!groups.has(g)) groups.set(g, new Map());
    const m = groups.get(g)!;
    m.set(sub, [...(m.get(sub) ?? []), p.id]);
  }
  return {
    byDiocese,
    dioceses: [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, subs]) => ({ name, districts: [...subs.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([n, parishes]) => ({ name: n, parishes })) })),
  };
}

export function DiocesesPage() {
  const data = useParishes();
  const real = useMemo(() => (data.remote ? groupParishes(data.list) : null), [data.remote, data.list]);
  const list = real ? real.dioceses : dioceses;
  const [openSet, setOpenSet] = useState<string[]>([]);
  const first = list[0]?.name;
  const opened = openSet.length ? openSet : first ? [first] : [];
  const nameOf = (id: string) => data.get(id)?.name;
  return (
    <MenuShell description={!real ? 'Organisation territoriale (structure de démonstration)' : real.byDiocese ? 'Organisation territoriale' : 'Paroisses regroupées par pays et par ville (les diocèses ne sont pas encore renseignés)'}>
      <ParishesState data={data} />
      <div className="space-y-2">
        {list.map((d) => {
          const open = opened.includes(d.name);
          const count = d.districts.reduce((n, x) => n + x.parishes.length, 0);
          return (
            <div key={d.name} className="card overflow-hidden rounded-2xl">
              <button onClick={() => setOpenSet(open ? opened.filter((x) => x !== d.name) : [...opened, d.name])} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="icon-tile h-10 w-10 rounded-xl"><Globe size={18} /></span>
                <span className="flex-1"><span className="block font-bold">{d.name}</span><span className="block text-xs text-ink-muted">{d.districts.length} {real && !real.byDiocese ? 'ville' : 'district'}{d.districts.length > 1 ? 's' : ''} · {count} paroisse{count > 1 ? 's' : ''}</span></span>
                <ChevronDown className={cn('transition', open && 'rotate-180')} size={18} />
              </button>
              {open && (
                <div className="border-t border-line px-4 pb-4 pt-2">
                  {d.districts.map((x) => (
                    <div key={x.name} className="py-2">
                      <p className="text-sm font-semibold">{x.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">{x.parishes.length ? x.parishes.map((id) => <Link key={id} to={`/carte-paroisses?paroisse=${id}`}><Chip>{nameOf(id) ?? id}</Chip></Link>) : <span className="text-xs text-ink-muted">Paroisses à venir</span>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </MenuShell>
  );
}

const branches = [
  { country: 'Nigeria', city: 'Lagos', contact: 'nigeria@celeone.demo' }, { country: 'Togo', city: 'Lomé', contact: 'togo@celeone.demo' },
  { country: 'Ghana', city: 'Accra', contact: 'ghana@celeone.demo' }, { country: 'Côte d’Ivoire', city: 'Abidjan', contact: 'ci@celeone.demo' },
  { country: 'France', city: 'Paris', contact: 'france@celeone.demo' }, { country: 'Royaume-Uni', city: 'Londres', contact: 'uk@celeone.demo' },
  { country: 'États-Unis', city: 'Houston', contact: 'usa@celeone.demo' }, { country: 'Canada', city: 'Montréal', contact: 'canada@celeone.demo' },
];

export function BranchesPage() {
  return (
    <MenuShell description="Représentations nationales de l'Église (contacts fictifs)">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {branches.map((b) => (
          <div key={b.country} className="card flex items-center gap-3 rounded-2xl p-4">
            <span className="icon-tile h-11 w-11 rounded-xl"><Globe size={19} /></span>
            <div className="min-w-0 flex-1"><p className="font-bold">{b.country}</p><p className="truncate text-xs text-ink-muted">Siège : {b.city} · {b.contact}</p></div>
            <IconButton icon={Mail} label={`Écrire à ${b.country}`} size="sm" variant="soft" onClick={() => { window.location.href = `mailto:${b.contact}`; }} />
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

const officialContacts = [
  { service: 'Secrétariat général', phone: '+229 01 21 00 00 00', email: 'secretariat@celeone.demo' },
  { service: 'Direction des médias (Cèlè One TV)', phone: '+229 01 21 00 00 01', email: 'medias@celeone.demo' },
  { service: 'Service Jeunesse', phone: '+229 01 21 00 00 02', email: 'jeunesse@celeone.demo' },
  { service: 'Support de l’application', phone: '+229 01 21 00 00 03', email: 'support@celeone.demo' },
];

export function ContactsPage() {
  return (
    <MenuShell description="Joindre les services officiels (coordonnées de démonstration)">
      <div className="space-y-2">
        {officialContacts.map((c) => (
          <div key={c.service} className="card flex flex-wrap items-center gap-3 rounded-2xl p-4">
            <div className="min-w-0 flex-1"><p className="font-bold">{c.service}</p><p className="text-sm text-ink-muted">{c.phone} · {c.email}</p></div>
            <IconButton icon={Phone} label="Appeler" size="sm" variant="soft" onClick={() => { window.location.href = `tel:${c.phone.replace(/\s/g, '')}`; }} />
            <IconButton icon={Mail} label="Écrire" size="sm" variant="soft" onClick={() => { window.location.href = `mailto:${c.email}`; }} />
            <IconButton icon={Copy} label="Copier" size="sm" onClick={async () => toast((await copyText(`${c.service} — ${c.phone} — ${c.email}`)) ? 'Coordonnées copiées' : 'Copie impossible')} />
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

/* ───────────── Services membres ───────────── */

function QrPattern({ seed }: { seed: string }) {
  const cells = useMemo(() => Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7 && (x === cx || x === cx + 6 || y === cy || y === cy + 6 || (x >= cx + 2 && x <= cx + 4 && y >= cy + 2 && y <= cy + 4));
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true;
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false;
    let h = 0;
    for (const ch of `${seed}${i}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % 3 === 0;
  }), [seed]);
  return <svg viewBox="0 0 21 21" className="h-full w-full" shapeRendering="crispEdges">{cells.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#0f1b2d" />)}</svg>;
}

const cardColors: Record<string, string> = { teal: 'linear-gradient(135deg,#0B565A,#2FA5A9)', nuit: 'linear-gradient(135deg,#0f1b2d,#4C6FFF)', or: 'linear-gradient(135deg,#8a5f0c,#d6a634)' };

export function CarteMembrePage() {
  const account = useApp((s) => s.account);
  const color = useMenu((s) => s.memberCardColor);
  const [flipped, setFlipped] = useState(false);
  if (!account) return null;
  const memberId = `CO-${account.hue.toString().padStart(4, '0')}-${account.firstName.slice(0, 2).toUpperCase()}${account.lastName.slice(0, 2).toUpperCase()}`;
  const download = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" rx="28" fill="#1D8A8F"/><text x="40" y="70" font-family="Arial" font-size="28" font-weight="bold" fill="white">Cèlè One — Carte de membre</text><text x="40" y="200" font-family="Arial" font-size="40" font-weight="bold" fill="white">${accountName(account)}</text><text x="40" y="250" font-family="Arial" font-size="22" fill="white">${account.parish || 'Paroisse non renseignée'}</text><text x="40" y="340" font-family="monospace" font-size="26" fill="white">${memberId}</text></svg>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `carte-membre-${memberId}.svg`;
    a.click();
    toast('Carte téléchargée');
  };
  return (
    <MenuShell description="Présentez votre carte lors des événements et rassemblements">
      <div className="mx-auto max-w-md">
        <button onClick={() => setFlipped((f) => !f)} className="block w-full [perspective:1200px]" aria-label="Retourner la carte">
          <div className={cn('relative aspect-[1.6] w-full transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
            <div className="absolute inset-0 flex flex-col justify-between rounded-3xl p-6 text-left text-white shadow-lg [backface-visibility:hidden]" style={{ background: cardColors[color] }}>
              <div className="flex items-center justify-between"><span className="font-display text-lg font-black">Cèlè One</span><LogoMark className="h-10 w-10 rounded-full bg-white p-0.5" /></div>
              <div className="flex items-end gap-4">
                <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="lg" className="rounded-full ring-2 ring-white/60" />
                <div className="min-w-0"><p className="truncate text-xl font-black">{accountName(account)}</p><p className="truncate text-sm text-white/80">{account.parish || 'Paroisse non renseignée'}</p></div>
              </div>
              <div className="flex items-center justify-between"><span className="font-mono text-sm tracking-widest">{memberId}</span><Chip tone="night" className="bg-white/20"><BadgeCheck size={12} /> Membre</Chip></div>
              <span className="rainbow-bar absolute inset-x-6 bottom-0 h-1 rounded-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-5 rounded-3xl bg-white p-6 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="h-36 w-36 rounded-xl bg-white p-2 ring-1 ring-line"><QrPattern seed={memberId} /></div>
              <div className="text-left text-sm text-ink"><p className="font-bold">Code de vérification</p><p className="font-mono text-xs text-ink-muted">{memberId}</p><p className="mt-2 text-xs text-ink-muted">Scannez pour vérifier l'appartenance (démo).</p></div>
            </div>
          </div>
        </button>
        <p className="mt-2 text-center text-xs text-ink-muted">Touchez la carte pour la retourner</p>
        <div className="mt-4 flex justify-center gap-2">
          {Object.entries(cardColors).map(([k, v]) => <button key={k} onClick={() => menu.setCardColor(k)} aria-label={`Couleur ${k}`} className={cn('h-9 w-9 rounded-full ring-offset-2', color === k && 'ring-2 ring-brand-600')} style={{ background: v }} />)}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Button icon={Download} onClick={download}>Télécharger</Button>
          <Button variant="ghost" icon={Share2} onClick={() => openShare({ title: 'Ma carte de membre Cèlè One', url: '/menu/services-membres/carte-membre' })}>Partager</Button>
        </div>
      </div>
    </MenuShell>
  );
}

export function VerificationPage() {
  const request = useMenu((s) => s.verificationRequest);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  return (
    <MenuShell description="Vérifiez une carte de membre ou demandez votre badge vérifié">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form className="card space-y-3 rounded-3xl p-5" onSubmit={(e) => { e.preventDefault(); setResult(/^CO-\d{4}-[A-Z]{4}$/.test(code.trim().toUpperCase())); }}>
          <p className="flex items-center gap-2 font-extrabold"><QrCode size={18} className="text-brand-600" /> Vérifier un membre</p>
          <input value={code} onChange={(e) => { setCode(e.target.value); setResult(null); }} placeholder="Code de la carte (ex. CO-0168-ISTO)" className="field uppercase" />
          <Button type="submit" icon={ShieldCheck} disabled={!code.trim()}>Vérifier</Button>
          {result === true && <p className="flex items-center gap-2 rounded-xl bg-mint-100 px-4 py-2.5 text-sm font-semibold text-brand-900"><BadgeCheck size={17} /> Carte valide — membre enregistré.</p>}
          {result === false && <p className="flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700"><XCircle size={17} /> Code invalide ou inconnu.</p>}
        </form>
        <div className="card space-y-3 rounded-3xl p-5">
          <p className="flex items-center gap-2 font-extrabold"><BadgeCheck size={18} className="text-brand-600" /> Mon statut</p>
          {request ? <p className="rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700">Demande « {request.kind} » {request.status} depuis le {formatDate(request.date)}.</p> : <p className="text-sm text-ink-muted">Faites vérifier votre appartenance par votre paroisse pour obtenir le badge.</p>}
          <div className="flex flex-wrap gap-2">{['Membre', 'Berger', 'Responsable de chorale'].map((k) => <Button key={k} size="sm" variant="soft" disabled={!!request} onClick={() => { menu.requestVerification(k); toast('Demande envoyée à votre paroisse'); }}>{k}</Button>)}</div>
        </div>
      </div>
    </MenuShell>
  );
}

export function DemandeConseilPage() {
  const requests = useMenu((s) => s.counsel);
  const [form, setForm] = useState({ topic: 'Spirituel', message: '', contact: 'Message dans l’application' });
  return (
    <MenuShell description="Un berger ou un conseiller vous répondra en toute confidentialité">
      <form className="card mb-4 space-y-3 rounded-3xl p-5" onSubmit={(e) => { e.preventDefault(); if (form.message.trim().length < 10) return toast('Décrivez votre demande en quelques phrases', { tone: 'danger' }); menu.requestCounsel(form); setForm({ ...form, message: '' }); toast('Demande envoyée — réponse sous 48 h'); }}>
        <div className="flex flex-wrap gap-2">{['Spirituel', 'Familial', 'Professionnel', 'Santé', 'Autre'].map((t) => <button key={t} type="button" onClick={() => setForm({ ...form, topic: t })} className={cn('h-9 rounded-full border px-4 text-sm font-semibold', form.topic === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{t}</button>)}</div>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="field h-auto py-2.5" placeholder="Expliquez votre situation…" />
        <select value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="field">{['Message dans l’application', 'Appel téléphonique', 'Rendez-vous à la paroisse'].map((c) => <option key={c}>{c}</option>)}</select>
        <Button type="submit" icon={Send}>Envoyer la demande</Button>
      </form>
      {requests.length > 0 && (
        <div className="card rounded-3xl p-5">
          <p className="mb-2 font-extrabold">Mes demandes</p>
          {requests.map((r) => <div key={r.id} className="flex items-center gap-3 border-t border-line py-2.5 text-sm first:border-0"><Chip>{r.topic}</Chip><span className="flex-1 truncate">{r.message}</span><span className="text-xs text-ink-muted">{r.status}</span></div>)}
        </div>
      )}
    </MenuShell>
  );
}

/* ───────────── Bible : traductions ───────────── */

const translations = [
  { id: 'fr', name: 'Français — Traduction de référence', size: '4,2 Mo' },
  { id: 'en', name: 'English — Reference translation', size: '4,0 Mo' },
  { id: 'yo', name: 'Yoruba — Bibeli Mimọ', size: '4,5 Mo' },
  { id: 'goun', name: 'Goun — Biblu Wiwe', size: '4,4 Mo' },
] as const;

export function TraductionsPage() {
  const lang = useLibrary((s) => s.bibleLang);
  const [offline, setOffline] = useState<string[]>(['fr']);
  return (
    <MenuShell description="Choisissez la traduction par défaut et téléchargez-la pour la lire hors connexion">
      <div className="space-y-2">
        {translations.map((t) => {
          const isDefault = lang === t.id;
          const dl = offline.includes(t.id);
          return (
            <div key={t.id} className={cn('card flex flex-wrap items-center gap-3 rounded-2xl p-4', isDefault && 'ring-2 ring-brand-400')}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-100 text-sm font-black text-brand-700">{bibleLanguages.find((l) => l.id === t.id)?.short}</span>
              <div className="min-w-0 flex-1"><p className="font-bold">{t.name}</p><p className="text-xs text-ink-muted">{t.size} · {dl ? 'Disponible hors connexion' : 'En ligne'}</p></div>
              <Button size="sm" variant={dl ? 'ghost' : 'soft'} icon={dl ? Trash2 : Download} onClick={() => { setOffline((o) => (dl ? o.filter((x) => x !== t.id) : [...o, t.id])); toast(dl ? 'Traduction supprimée de l’appareil' : 'Traduction téléchargée'); }}>{dl ? 'Retirer' : 'Télécharger'}</Button>
              <Button size="sm" disabled={isDefault} onClick={() => { library.setBibleLang(t.id); toast('Traduction par défaut modifiée'); }}>{isDefault ? 'Par défaut' : 'Utiliser'}</Button>
            </div>
          );
        })}
      </div>
      <div className="mt-4"><Button variant="ghost" icon={RotateCcw} to="/bible">Ouvrir la Bible</Button></div>
    </MenuShell>
  );
}
