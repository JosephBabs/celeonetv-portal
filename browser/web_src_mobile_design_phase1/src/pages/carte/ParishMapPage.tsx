import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2, CalendarDays, CalendarPlus, ChevronLeft, CircleHelp, Clock, Crosshair, Flag, LocateFixed, MapPin, MapPinOff, Navigation, Phone, RotateCw, Route, Search,
  Share2, X,
} from 'lucide-react';
import { distanceKm } from '@/data/parishes';
import { ensureParishes, useParishes, type ParishView as Parish } from '@/services/parishes';
import { actions, useApp } from '@/store/app';
import { openShare, toast } from '@/store/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { cn, formatDate, normalize } from '@/lib/utils';

type LatLng = { lat: number; lng: number };
const DEFAULT_CENTER: LatLng = { lat: 6.6, lng: 2.2 };

const pin = (active: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    html: `<div style="width:34px;height:44px;display:flex;align-items:flex-start;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25))">
      <svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 0C7.6 0 0 7.4 0 16.6 0 29 17 44 17 44s17-15 17-27.4C34 7.4 26.4 0 17 0z" fill="${active ? '#0f1b2d' : '#1D8A8F'}"/><circle cx="17" cy="16" r="7" fill="white"/></svg></div>`,
  });
const meIcon = L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div style="width:22px;height:22px;border-radius:50%;background:#2FA5A9;border:4px solid white;box-shadow:0 0 0 6px rgba(30,136,229,.25)"></div>' });

function FlyTo({ target, zoom = 13 }: { target: LatLng | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], zoom, { duration: 0.8 });
  }, [target, zoom, map]);
  return null;
}

/** Paroisses réelles chargées : la carte s'ajuste une fois pour toutes les montrer. */
function FitAll({ points, skip }: { points: LatLng[]; skip: boolean }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || skip || points.length < 2) return;
    done.current = true;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { paddingTopLeft: [40, 200], paddingBottomRight: [40, 140], maxZoom: 12 });
  }, [points, skip, map]);
  return null;
}

function FitRoute({ a, b }: { a: LatLng | null; b: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (a && b) map.fitBounds(L.latLngBounds([a.lat, a.lng], [b.lat, b.lng]), { paddingTopLeft: [60, 230], paddingBottomRight: [60, 340] });
  }, [a, b, map]);
  return null;
}

const steps = [
  { icon: MapPin, title: 'Autoriser la position', text: 'Autorisez la localisation pour trouver les paroisses proches de vous.' },
  { icon: Search, title: 'Rechercher une paroisse', text: 'Tapez un nom ou une ville pour la retrouver sur la carte.' },
  { icon: Flag, title: 'Choisir un départ', text: 'Utilisez votre position ou une autre paroisse comme point de départ.' },
  { icon: Route, title: 'Calculer le trajet', text: 'Affichez l’itinéraire, la distance et le temps estimé.' },
  { icon: CalendarDays, title: 'Planifier une visite', text: 'Ajoutez la visite à votre agenda pour recevoir un rappel.' },
];

function Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = steps[step];
  return (
    <Modal open onClose={onClose} hideClose size="sm">
      <div className="pt-4 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-gold-500 bg-brand-700 text-white"><s.icon size={32} /></span>
        <p className="mt-4 font-semibold text-brand-700">{step + 1}/{steps.length}</p>
        <h2 className="mt-1 text-2xl font-black text-brand-900">{s.title}</h2>
        <p className="mt-2 text-ink-muted">{s.text}</p>
        <div className="my-5 flex justify-center gap-1.5">
          {steps.map((_, i) => <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-8 bg-brand-700' : 'w-2 bg-mint-300')} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="soft" size="lg" onClick={onClose}>Ignorer</Button>
          <Button size="lg" onClick={() => (step < steps.length - 1 ? setStep(step + 1) : onClose())}>{step < steps.length - 1 ? 'Suivant' : 'Terminer'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ParishPicker({ open, onClose, title, origin, onPick, allowMe, onMe, parishes }: { open: boolean; onClose: () => void; title: string; origin: LatLng | null; onPick: (p: Parish) => void; allowMe?: boolean; onMe?: () => void; parishes: Parish[] }) {
  const [q, setQ] = useState('');
  const list = parishes
    .filter((p) => p.located && normalize(`${p.name} ${p.city}`).includes(normalize(q)))
    .map((p) => ({ p, d: origin ? distanceKm(origin, p) : null }))
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0) || a.p.name.localeCompare(b.p.name))
    .slice(0, 150);
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une paroisse…" className="field mb-3" />
      {allowMe && (
        <button onClick={onMe} className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-surface-sunken">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600"><LocateFixed size={17} /></span> Ma position actuelle
        </button>
      )}
      <div className="max-h-[50vh] overflow-y-auto">
        {list.map(({ p, d }) => (
          <button key={p.id} onClick={() => onPick(p)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-sunken">
            <span className="icon-tile h-9 w-9 rounded-full"><Building2 size={16} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.name}</span>{p.city && <span className="block text-xs text-ink-muted">{p.city}</span>}</span>
            {d !== null && <span className="text-xs font-semibold text-ink-muted">{d.toFixed(1)} km</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function ParishMapPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onboarded = useApp((s) => !!s.onboarding.carte);
  const [showOnboarding, setShowOnboarding] = useState(!onboarded);
  const [query, setQuery] = useState('');
  const data = useParishes();
  const parishes = data.list;
  const [selected, setSelected] = useState<Parish | null>(() => data.get(params.get('paroisse') ?? '') ?? null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [start, setStart] = useState<{ label: string; pos: LatLng } | null>(null);
  const [target, setTarget] = useState<Parish | null>(null);
  const [route, setRoute] = useState(false);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(selected?.located ? selected : null);
  const [picker, setPicker] = useState<null | 'depart' | 'paroisse'>(null);
  const located = useMemo(() => parishes.filter((p) => p.located), [parishes]);
  const unlocated = parishes.length - located.length;

  // Lien partagé « ?paroisse=… » : la fiche s'ouvre dès que les paroisses réelles sont chargées.
  const wanted = params.get('paroisse');
  useEffect(() => {
    if (!wanted || selected) return;
    const p = data.get(wanted);
    if (p) {
      setSelected(p);
      if (p.located) setFlyTarget({ lat: p.lat, lng: p.lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, parishes]);

  const results = useMemo(() => (query.trim() ? parishes.filter((p) => normalize(`${p.name} ${p.city} ${p.address} ${p.shepherd}`).includes(normalize(query))).slice(0, 60) : []), [query, parishes]);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(p);
        setGeoDenied(false);
        setFlyTarget(p);
        toast('Carte centrée sur votre position');
      },
      () => {
        setGeoDenied(true);
        toast('Position indisponible — utilisez la recherche', { tone: 'danger' });
      },
      { timeout: 8000 },
    );
  };

  const select = (p: Parish) => {
    setSelected(p);
    if (p.located) setFlyTarget({ lat: p.lat, lng: p.lng });
    else toast('Position non renseignée pour cette paroisse');
    setQuery('');
    setParams({ paroisse: p.id }, { replace: true });
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    actions.setOnboardingDone('carte');
  };

  const routeKm = route && start && target ? distanceKm(start.pos, target) * 1.25 : 0;
  const routeMin = Math.round((routeKm / 38) * 60);

  return (
    <div className="relative isolate h-[calc(100dvh-var(--header-h))] overflow-hidden">
      <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={8} className="absolute inset-0 z-0" zoomControl={false} attributionControl>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {located.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pin(selected?.id === p.id || target?.id === p.id)} eventHandlers={{ click: () => select(p) }} title={p.name} />
        ))}
        {me && <Marker position={[me.lat, me.lng]} icon={meIcon} title="Ma position" />}
        {route && start && target && <Polyline positions={[[start.pos.lat, start.pos.lng], [target.lat, target.lng]]} pathOptions={{ color: '#1D8A8F', weight: 6, dashArray: '2 10', lineCap: 'round' }} />}
        <FlyTo target={flyTarget} />
        {data.remote && <FitAll points={located} skip={!!wanted} />}
        {route && <FitRoute a={start?.pos ?? null} b={target} />}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] bg-gradient-to-b from-mint-50 via-mint-50/90 to-transparent p-4 pb-10">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <IconButton icon={ChevronLeft} label="Retour" variant="soft" shape="square" onClick={() => navigate(-1)} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">GPS & Paroisses</p>
              <h1 className="truncate font-display text-[26px] font-black leading-tight text-brand-900">Carte des paroisses</h1>
            </div>
            <IconButton icon={CircleHelp} label="Revoir le guide" variant="soft" shape="square" onClick={() => setShowOnboarding(true)} />
            <IconButton icon={Crosshair} label="Cibler ma position" variant="soft" shape="square" onClick={locate} />
          </div>
          <div className="relative mt-3">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 shadow-sm">
              <Search size={18} className="text-ink-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une paroisse…" className="flex-1 bg-transparent text-[15px] outline-none" />
              {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={16} /></button>}
            </label>
            {query && (
              <div className="absolute inset-x-0 top-[calc(100%+6px)] max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-lg">
                {results.length === 0 ? <p className="p-4 text-center text-sm text-ink-muted">Aucune paroisse trouvée</p> : results.map((p) => (
                  <button key={p.id} onClick={() => select(p)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-sunken">
                    <MapPin size={17} className="text-brand-600" />
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.name}</span><span className="block truncate text-xs text-ink-muted">{p.address || p.city}</span></span>
                    {!p.located && <MapPinOff size={14} className="shrink-0 text-ink-faint" aria-label="Sans position" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {data.remote && data.status === 'loading' && parishes.length === 0 && (
            <p className="mt-3 rounded-2xl bg-surface px-4 py-2.5 text-sm text-ink-muted shadow-sm">Chargement des paroisses…</p>
          )}
          {data.remote && data.status === 'error' && parishes.length === 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-danger-50 px-4 py-2.5 text-sm text-danger shadow-sm">
              <span className="flex-1">Paroisses indisponibles. Vérifiez votre connexion internet puis réessayez.</span>
              <button onClick={() => void ensureParishes()} className="inline-flex items-center gap-1 font-bold underline"><RotateCw size={14} /> Réessayer</button>
            </div>
          )}
          {data.remote && data.status === 'ready' && parishes.length === 0 && (
            <p className="mt-3 rounded-2xl bg-surface px-4 py-2.5 text-sm text-ink-muted shadow-sm">
              Aucune paroisse publiée pour le moment.
            </p>
          )}
          {data.remote && data.status === 'ready' && unlocated > 0 && !query && !selected && (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-2 text-xs text-ink-muted shadow-sm">
              <MapPinOff size={14} className="shrink-0" /> {located.length} paroisse{located.length > 1 ? 's' : ''} sur la carte · {unlocated} sans position (trouvable{unlocated > 1 ? 's' : ''} par la recherche)
            </p>
          )}
          {geoDenied && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-gold-50 px-4 py-2.5 text-sm text-gold-700 shadow-sm">
              <LocateFixed size={16} />
              <span className="flex-1">Géolocalisation refusée : la carte reste utilisable via la recherche.</span>
              <button onClick={locate} className="font-bold underline">Réessayer</button>
            </div>
          )}
        </div>
      </div>

      {(selected || (route && target)) && (
        <div className="absolute inset-x-3 bottom-[104px] z-[400] mx-auto max-w-xl animate-slide-up rounded-3xl bg-surface p-4 shadow-lg">
          {route && start && target ? (
            <div>
              <div className="flex items-start gap-3">
                <span className="icon-tile h-11 w-11 rounded-xl"><Route size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">{start.label} → {target.name}</p>
                  <p className="text-xl font-black">{routeKm.toFixed(1)} km · {routeMin >= 60 ? `${Math.floor(routeMin / 60)} h ${routeMin % 60} min` : `${routeMin} min`}</p>
                  <p className="text-xs text-ink-muted">Estimation en voiture (démo)</p>
                </div>
                <IconButton icon={X} label="Fermer le trajet" size="sm" onClick={() => setRoute(false)} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button icon={Navigation} className="flex-1" onClick={() => window.open(`https://www.openstreetmap.org/directions?route=${start.pos.lat},${start.pos.lng};${target.lat},${target.lng}`, '_blank', 'noopener')}>Démarrer le guidage</Button>
                <Button variant="ghost" icon={CalendarPlus} onClick={() => navigate(`/agenda?paroisse=${target.id}&nouveau=1`)}>Planifier</Button>
              </div>
            </div>
          ) : selected && (
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white"><Building2 size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black uppercase leading-tight">{selected.name}</p>
                  {(selected.address || selected.city) && <p className="text-sm text-ink-muted">{selected.address || selected.city}</p>}
                  {me && selected.located && <p className="text-xs font-semibold text-brand-700">À {distanceKm(me, selected).toFixed(1)} km de vous</p>}
                  {!selected.located && <p className="text-xs font-semibold text-gold-700">Position non renseignée sur la carte</p>}
                </div>
                <IconButton icon={X} label="Fermer la fiche" size="sm" onClick={() => { setSelected(null); setParams({}, { replace: true }); }} />
              </div>
              <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                {selected.schedule.map((s, i) => <p key={`${s.day}-${i}`} className="flex items-center gap-2 text-ink-soft"><Clock size={14} className="text-brand-600" /> <b>{s.day}</b> {s.hours}</p>)}
                {selected.shepherd && <p className="text-ink-soft">Berger : {selected.shepherd}</p>}
                {(selected.founded || selected.feast) && <p className="text-ink-soft">{[selected.founded && `Fondée le ${formatDate(selected.founded)}`, selected.feast && `Fête le ${selected.feast}`].filter(Boolean).join(' · ')}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" icon={Route} disabled={!selected.located} onClick={() => { setTarget(selected); if (!start) { if (me) setStart({ label: 'Ma position', pos: me }); else { setPicker('depart'); return; } } setRoute(true); }}>Itinéraire</Button>
                <Button size="sm" variant="ghost" icon={Phone} disabled={!selected.phone} onClick={() => { window.location.href = `tel:${selected.phone.replace(/\s/g, '')}`; }}>Appeler</Button>
                <Button size="sm" variant="ghost" icon={CalendarDays} onClick={() => navigate(`/agenda?paroisse=${selected.id}`)}>Agenda</Button>
                <Button size="sm" variant="ghost" icon={Share2} onClick={() => openShare({ title: selected.name, url: `/carte-paroisses?paroisse=${selected.id}` })}>Partager</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-x-3 bottom-4 z-[400] mx-auto grid max-w-xl grid-cols-4 gap-2 rounded-3xl bg-surface/95 p-2 shadow-lg backdrop-blur">
        {[
          { icon: Flag, label: start ? 'Départ ✓' : 'Départ', run: () => setPicker('depart'), on: !!start },
          { icon: Building2, label: target ? 'Paroisse ✓' : 'Paroisse', run: () => setPicker('paroisse'), on: !!target },
          { icon: Route, label: 'Trajet', on: route, run: () => { if (!start) return setPicker('depart'); if (!target) return setPicker('paroisse'); setRoute(true); } },
          { icon: CalendarDays, label: 'Agenda', on: false, run: () => navigate(`/agenda${(target ?? selected) ? `?paroisse=${(target ?? selected)!.id}` : ''}`) },
        ].map((a) => (
          <button key={a.label} onClick={a.run} className={cn('flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[13px] font-semibold transition', a.on ? 'bg-brand-600 text-white' : 'bg-mint-50 text-brand-900 hover:bg-mint-100')}>
            <a.icon size={20} /> {a.label}
          </button>
        ))}
      </div>

      <ParishPicker
        parishes={parishes}
        open={picker === 'depart'}
        onClose={() => setPicker(null)}
        title="Point de départ"
        origin={me}
        allowMe
        onMe={() => {
          setPicker(null);
          if (me) setStart({ label: 'Ma position', pos: me });
          else {
            locate();
            toast('Autorisez la localisation ou choisissez une paroisse comme départ');
          }
        }}
        onPick={(p) => { setStart({ label: p.name, pos: p }); setPicker(null); toast(`Départ : ${p.name}`); if (target) setRoute(true); }}
      />
      <ParishPicker
        parishes={parishes}
        open={picker === 'paroisse'}
        onClose={() => setPicker(null)}
        title="Paroisse de destination"
        origin={start?.pos ?? me}
        onPick={(p) => { setTarget(p); select(p); setPicker(null); if (start) setRoute(true); }}
      />
      {showOnboarding && <Onboarding onClose={closeOnboarding} />}
    </div>
  );
}
