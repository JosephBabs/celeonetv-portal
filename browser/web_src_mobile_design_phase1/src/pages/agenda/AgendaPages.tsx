import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell, BellOff, CalendarCheck2, CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, Map, MapPin, Pencil, Plus, Repeat, RotateCw, Share2, Trash2, Users,
} from 'lucide-react';
import { useParishes } from '@/services/parishes';
import type { ChurchEvent } from '@/data/events';
import { ensureEvents, useEvents } from '@/services/events';
import { agenda, alertTypes, nextOccurrence, repeatLabels, useAgenda, type AgendaAlert, type AlertType, type Repeat as RepeatT } from '@/store/agenda';
import { confirmDialog, openShare, toast } from '@/store/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Toggle';
import { Scene } from '@/components/feed/Scene';
import { cn, formatDate } from '@/lib/utils';

const typeTone: Record<AlertType, 'mint' | 'lavender' | 'gold' | 'violet'> = { service: 'mint', circuit: 'lavender', fete: 'gold', personnel: 'violet' };
const typeLabel = (t: AlertType) => alertTypes.find((x) => x.id === t)?.label ?? t;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function PageHeading({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex items-center gap-3">
      <IconButton icon={ChevronLeft} label="Retour" variant="soft" shape="square" onClick={() => navigate(-1)} />
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="truncate font-display text-[28px] font-black leading-tight text-brand-900">{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* ───────────── Formulaire d'alerte ───────────── */

export function AlertForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Partial<AgendaAlert> & { id?: string } }) {
  const empty = { type: 'service' as AlertType, title: '', date: ymd(new Date(Date.now() + 86400000)), time: '10:00', repeat: 'aucune' as RepeatT, parishId: '', place: '', notes: '', notify: true };
  const [form, setForm] = useState({ ...empty, ...initial });
  const [error, setError] = useState('');
  const parishData = useParishes();
  const parishes = useMemo(() => [...parishData.list].sort((a, b) => a.name.localeCompare(b.name)), [parishData.list]);
  useEffect(() => {
    if (open) {
      setForm({ ...empty, ...initial, parishId: initial?.parishId ?? '' });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.title.trim()) return setError('Donnez un titre à votre alerte.');
    if (!form.date) return setError('Choisissez une date.');
    const data = { type: form.type, title: form.title.trim(), date: form.date, time: form.time, repeat: form.repeat, parishId: form.parishId || undefined, place: form.place.trim() || undefined, notes: form.notes.trim() || undefined, notify: form.notify };
    if (initial?.id) {
      agenda.update(initial.id, data);
      toast('Alerte modifiée');
    } else {
      agenda.add(data);
      toast('Alerte créée — vous recevrez un rappel');
    }
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Modifier l’alerte' : 'Nouvelle alerte'} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button icon={Check} onClick={save}>Enregistrer</Button></>}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold">Type</p>
          <div className="grid grid-cols-2 gap-2">
            {alertTypes.map((t) => (
              <button key={t.id} type="button" onClick={() => set('type', t.id)} className={cn('rounded-xl border p-3 text-left transition', form.type === t.id ? 'border-brand-500 bg-mint-100' : 'border-line hover:bg-surface-sunken')}>
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="block text-xs text-ink-muted">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Titre</span>
          <input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} className={cn('field', error && !form.title.trim() && 'field-error')} placeholder="Ex. Culte de la fête des moissons" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Date</span><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="field" /></label>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Heure</span><input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className="field" /></label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Répétition</span>
          <select value={form.repeat} onChange={(e) => set('repeat', e.target.value as RepeatT)} className="field">
            {Object.entries(repeatLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Paroisse (facultatif)</span>
          <select value={form.parishId} onChange={(e) => set('parishId', e.target.value)} className="field">
            <option value="">— Aucune —</option>
            {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city && ` · ${p.city}`}</option>)}
            {form.parishId && !parishes.some((p) => p.id === form.parishId) && <option value={form.parishId}>Paroisse enregistrée</option>}
          </select>
        </label>
        {!form.parishId && <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Lieu (facultatif)</span><input value={form.place} onChange={(e) => set('place', e.target.value)} className="field" placeholder="Adresse ou lieu" /></label>}
        <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Notes</span><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="field h-auto resize-none py-2.5" /></label>
        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3"><span className="text-sm font-semibold">Recevoir un rappel</span><Toggle checked={form.notify} onChange={(v) => set('notify', v)} label="Recevoir un rappel" /></div>
        {error && <p className="text-sm font-medium text-danger-700">{error}</p>}
      </div>
    </Modal>
  );
}

/* ───────────── Agenda ───────────── */

function MonthCalendar({ alerts, value, onChange }: { alerts: AgendaAlert[]; value: string | null; onChange: (d: string | null) => void }) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const days = useMemo(() => {
    const first = (cursor.getDay() + 6) % 7;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];
  }, [cursor]);
  const marked = new Set(alerts.map((a) => ymd(nextOccurrence(a))));
  const today = ymd(new Date());
  return (
    <div className="card rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="Mois précédent" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} />
        <p className="font-extrabold capitalize">{cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        <IconButton icon={ChevronRight} label="Mois suivant" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-muted">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = ymd(d);
          const active = value === k;
          return (
            <button key={i} onClick={() => onChange(active ? null : k)} className={cn('relative flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition', active ? 'bg-brand-700 text-white' : k === today ? 'bg-mint-100 text-brand-800' : 'hover:bg-surface-sunken')}>
              {d.getDate()}
              {marked.has(k) && <span className={cn('absolute bottom-1 h-1.5 w-1.5 rounded-full', active ? 'bg-white' : 'bg-gold-500')} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AgendaPage() {
  const alerts = useAgenda((s) => s.alerts);
  const [params, setParams] = useSearchParams();
  const parishData = useParishes();
  const getParish = parishData.get;
  const parishFilter = params.get('paroisse');
  const [formOpen, setFormOpen] = useState(params.get('nouveau') === '1');
  const [editing, setEditing] = useState<AgendaAlert | null>(null);
  const [detail, setDetail] = useState<AgendaAlert | null>(null);
  const [typeFilter, setTypeFilter] = useState<AlertType | 'tout'>('tout');
  const [day, setDay] = useState<string | null>(null);
  const parish = parishFilter ? getParish(parishFilter) : undefined;

  const list = alerts
    .filter((a) => (typeFilter === 'tout' || a.type === typeFilter) && (!parishFilter || a.parishId === parishFilter) && (!day || ymd(nextOccurrence(a)) === day))
    .sort((a, b) => nextOccurrence(a).getTime() - nextOccurrence(b).getTime());
  const now = Date.now();
  const upcoming = list.filter((a) => nextOccurrence(a).getTime() >= now);
  const past = list.filter((a) => nextOccurrence(a).getTime() < now);

  const remove = async (a: AgendaAlert) => {
    if (!(await confirmDialog({ title: 'Supprimer cette alerte ?', confirmLabel: 'Supprimer', tone: 'danger' }))) return;
    const removed = agenda.remove(a.id);
    setDetail(null);
    toast('Alerte supprimée', { action: removed ? { label: 'Annuler', onClick: () => agenda.restore(removed) } : undefined });
  };

  const Item = ({ a }: { a: AgendaAlert }) => {
    const next = nextOccurrence(a);
    const p = a.parishId ? getParish(a.parishId) : undefined;
    return (
      <button onClick={() => setDetail(a)} className="card card-hover flex w-full items-center gap-4 rounded-2xl p-4 text-left">
        <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-mint-100 py-2 text-brand-800">
          <span className="text-[11px] font-bold uppercase">{next.toLocaleDateString('fr-FR', { month: 'short' })}</span>
          <span className="font-display text-2xl font-black leading-none">{next.getDate()}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2"><Chip tone={typeTone[a.type]}>{typeLabel(a.type)}</Chip>{a.repeat !== 'aucune' && <Repeat size={13} className="text-ink-faint" />}</span>
          <span className="mt-1 block truncate font-bold">{a.title}</span>
          <span className="block truncate text-xs text-ink-muted">{next.toLocaleDateString('fr-FR', { weekday: 'long' })} · {a.time}{p ? ` · ${p.name}` : a.place ? ` · ${a.place}` : ''}</span>
        </span>
        {a.notify ? <Bell size={17} className="text-brand-600" /> : <BellOff size={17} className="text-ink-faint" />}
      </button>
    );
  };

  return (
    <div className="pb-16">
      <PageHeading eyebrow="Rappels & voyages" title="Agenda Cèlè One" right={<IconButton icon={Map} label="Carte des paroisses" variant="soft" shape="square" to="/carte-paroisses" />} />
      <div className="mb-4 flex flex-col gap-4 rounded-3xl bg-[linear-gradient(120deg,#0B565A,#2FA5A9)] p-5 text-white sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-display text-xl font-black">Créer une alerte</p>
          <p className="text-sm text-white/80">Services d’Église, circuits, visites de fête ou rappels personnels : ne manquez plus rien.</p>
        </div>
        <Button variant="white" icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>Nouvelle alerte</Button>
      </div>
      {parish && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gold-50 px-4 py-3 text-sm text-gold-700">
          <MapPin size={16} /> <span className="flex-1">Filtré sur <b>{parish.name}</b></span>
          <button className="font-bold underline" onClick={() => setParams({})}>Tout afficher</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <MonthCalendar alerts={alerts} value={day} onChange={setDay} />
          <div className="flex flex-wrap gap-2">
            {[{ id: 'tout' as const, label: 'Tout' }, ...alertTypes].map((t) => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)} className={cn('h-9 rounded-full px-3.5 text-[13px] font-semibold', typeFilter === t.id ? 'bg-brand-700 text-white' : 'bg-surface-sunken hover:bg-line')}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="card rounded-3xl"><EmptyState icon={CalendarDays} title="Aucun programme pour le moment." text={day ? `Rien de prévu le ${formatDate(day)}.` : 'Créez votre première alerte pour recevoir un rappel.'} action={<Button icon={Plus} onClick={() => setFormOpen(true)}>Nouvelle alerte</Button>} /></div>
          ) : (
            <>
              {upcoming.length > 0 && <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">À venir · {upcoming.length}</p>}
              {upcoming.map((a) => <Item key={a.id} a={a} />)}
              {past.length > 0 && <p className="pt-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Passées · {past.length}</p>}
              {past.map((a) => <div key={a.id} className="opacity-60"><Item a={a} /></div>)}
            </>
          )}
        </div>
      </div>

      <AlertForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); if (params.get('nouveau')) setParams(parishFilter ? { paroisse: parishFilter } : {}, { replace: true }); }} initial={editing ?? (parishFilter ? { parishId: parishFilter, type: 'fete', title: parish ? `Visite — ${parish.name}` : '' } : undefined)} />
      {detail && (
        <Modal open onClose={() => setDetail(null)} title={detail.title} description={typeLabel(detail.type)} size="sm"
          footer={<><Button variant="danger-soft" icon={Trash2} onClick={() => remove(detail)}>Supprimer</Button><Button icon={Pencil} onClick={() => { setEditing(detail); setDetail(null); setFormOpen(true); }}>Modifier</Button></>}>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><CalendarDays size={16} className="text-brand-600" /> {nextOccurrence(detail).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-brand-600" /> {detail.time}</p>
            <p className="flex items-center gap-2"><Repeat size={16} className="text-brand-600" /> {repeatLabels[detail.repeat]}</p>
            {(detail.parishId || detail.place) && <p className="flex items-center gap-2"><MapPin size={16} className="text-brand-600" /> {detail.parishId ? <Link className="font-semibold text-brand-700 hover:underline" to={`/carte-paroisses?paroisse=${detail.parishId}`}>{getParish(detail.parishId)?.name ?? 'Voir la paroisse'}</Link> : detail.place}</p>}
            {detail.notes && <p className="rounded-xl bg-surface-sunken p-3">{detail.notes}</p>}
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="font-semibold">Rappel</span>
              <Toggle checked={detail.notify} onChange={(v) => { agenda.update(detail.id, { notify: v }); setDetail({ ...detail, notify: v }); toast(v ? 'Rappel activé' : 'Rappel désactivé'); }} label="Rappel" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Événements ───────────── */

export function EventsPage() {
  const participating = useAgenda((s) => s.participating);
  const alerts = useAgenda((s) => s.alerts);
  const [filter, setFilter] = useState<'tous' | 'semaine' | 'mois' | 'miens'>('tous');
  const [open, setOpen] = useState<ChurchEvent | null>(null);
  const events = useEvents();
  const now = Date.now();
  const list = events.list.filter((e) => {
    // Événements réels : on masque ceux qui sont terminés.
    const endsAt = new Date(e.endDate ?? e.date).getTime() + 3 * 3600000;
    if (e.remote && endsAt < now) return false;
    const t = new Date(e.date).getTime() - now;
    if (filter === 'semaine') return t < 7 * 86400000;
    if (filter === 'mois') return t < 31 * 86400000;
    if (filter === 'miens') return participating.includes(e.id);
    return true;
  });
  const loadingEvents = events.remote && (events.status === 'loading' || events.status === 'idle') && events.list.length === 0;

  const addToAgenda = (e: ChurchEvent) => {
    const d = new Date(e.date);
    if (alerts.some((a) => a.title === e.title && a.date === ymd(d))) return toast('Déjà dans votre agenda');
    agenda.add({ type: e.category === 'Pèlerinage' ? 'circuit' : e.category === 'Fête' ? 'fete' : 'service', title: e.title, date: ymd(d), time: d.toTimeString().slice(0, 5), repeat: 'aucune', parishId: e.parishId, place: e.parishId ? undefined : e.place, notify: true });
    toast('Ajouté à votre agenda', { action: { label: 'Voir', onClick: () => window.location.assign('/agenda') } });
  };

  return (
    <div className="pb-16">
      <PageHeading eyebrow="Cèlè One" title="Événements" />
      <p className="-mt-3 mb-4 text-ink-muted">Programmes et rendez-vous importants.</p>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {([['tous', 'Tous'], ['semaine', 'Cette semaine'], ['mois', 'Ce mois-ci'], ['miens', `Mes participations (${participating.filter((id) => events.list.some((e) => e.id === id)).length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={cn('h-10 shrink-0 rounded-full px-4 text-sm font-semibold', filter === id ? 'bg-brand-700 text-white' : 'bg-surface-sunken hover:bg-line')}>{label}</button>
        ))}
      </div>
      {loadingEvents ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[290px] rounded-3xl" />)}</div>
      ) : events.remote && events.status === 'error' && events.list.length === 0 ? (
        <div className="card rounded-3xl"><EmptyState icon={CalendarDays} title="Événements indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void ensureEvents()}>Réessayer</Button>} /></div>
      ) : list.length === 0 ? (
        <div className="card rounded-3xl"><EmptyState icon={CalendarDays} title={filter === 'miens' ? 'Aucune participation' : 'Aucun événement à venir'} text={filter === 'miens' ? 'Vous ne participez encore à aucun événement.' : 'Aucun événement pour cette période.'} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((e) => {
            const d = new Date(e.date);
            const going = participating.includes(e.id);
            return (
              <article key={e.id} className="card card-hover overflow-hidden rounded-3xl">
                <div className="relative h-36">{e.image ? <img src={e.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Scene variant={e.scene} playing={false} />}<span className="absolute left-3 top-3 rounded-xl bg-white px-3 py-1.5 text-center shadow-sm"><span className="block text-[11px] font-bold uppercase text-brand-700">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span><span className="block font-display text-xl font-black leading-none">{d.getDate()}</span></span><Chip tone="night" className="absolute right-3 top-3 bg-black/50">{e.category}</Chip></div>
                <div className="p-4">
                  <h2 className="line-clamp-2 text-lg font-extrabold">{e.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Clock size={14} /> {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {d.toTimeString().slice(0, 5)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-muted"><MapPin size={14} className="shrink-0" /> <span className="truncate">{e.place}</span></p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => setOpen(e)}>Détails</Button>
                    <Button size="sm" variant={going ? 'soft' : 'ghost'} icon={going ? CalendarCheck2 : Users} onClick={() => toast(agenda.toggleParticipation(e.id) ? 'Participation confirmée' : 'Participation annulée')}>{going ? 'Je participe' : 'Participer'}</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {open && (
        <Modal open onClose={() => setOpen(null)} size="md" title={open.title} description={`${open.category} · ${open.place}`}
          footer={<><Button variant="ghost" icon={Share2} onClick={() => openShare({ title: open.title, url: '/evenements' })}>Partager</Button><Button icon={CalendarPlus} onClick={() => addToAgenda(open)}>Ajouter à l'agenda</Button></>}>
          <div className="space-y-3">
            <div className="h-40 overflow-hidden rounded-2xl">{open.image ? <img src={open.image} alt="" className="h-full w-full object-cover" /> : <Scene variant={open.scene} />}</div>
            {open.description && <p className="whitespace-pre-line text-ink-soft">{open.description}</p>}
            <p className="flex items-center gap-2 text-sm"><CalendarDays size={16} className="text-brand-600" /> {new Date(open.date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}{open.endDate && ` → ${formatDate(open.endDate)}`}</p>
            {(open.participants > 0 || participating.includes(open.id)) && <p className="flex items-center gap-2 text-sm"><Users size={16} className="text-brand-600" /> {open.participants + (participating.includes(open.id) ? 1 : 0)} participant{open.participants + (participating.includes(open.id) ? 1 : 0) > 1 ? 's' : ''}</p>}
            {open.parishId && <Link to={`/carte-paroisses?paroisse=${open.parishId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"><MapPin size={15} /> Voir sur la carte</Link>}
          </div>
        </Modal>
      )}
    </div>
  );
}
