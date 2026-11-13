import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Clock, List, Music, Search, Share2, Sparkles, X } from 'lucide-react';
import { useThemeCalendar, type ThemeDay, type ThemeMonth, type ThemeWeek } from '@/services/themeCalendar';
import { agenda } from '@/store/agenda';
import { openShare, toast } from '@/store/ui';
import { IconButton, Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { LogoMark } from '@/components/ui/Logo';
import { cn, normalize } from '@/lib/utils';

const fmtDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const range = (a: Date, b: Date) => `${ymd(a)} - ${ymd(b)}`;

function dayStart(d: ThemeDay) {
  if (!d.date) return null;
  const [h, m] = (d.time || '00:00').split(':').map(Number);
  return new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate(), h || 0, m || 0);
}

/* ───────────── Carte « Semaine en cours » ───────────── */

function WeekRing({ number, progress }: { number: number; progress: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[104px] w-[104px] shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="5" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[11px] text-white/80">Semaine</span>
        <span className="font-display text-[32px] font-black leading-none">{number}</span>
      </span>
    </div>
  );
}

function CurrentWeekCard({ week, onProgram }: { week: ThemeWeek; onProgram: () => void }) {
  const [slide, setSlide] = useState(() => {
    const now = Date.now();
    const i = week.days.findIndex((d) => (dayStart(d)?.getTime() ?? 0) >= now);
    return i < 0 ? Math.max(0, week.days.length - 1) : i;
  });
  const day = week.days[slide];
  const progress = Math.min(1, Math.max(0, (Date.now() - week.start.getTime()) / (7 * 86400000)));
  useEffect(() => {
    if (week.days.length < 2) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % week.days.length), 6000);
    return () => window.clearInterval(t);
  }, [week.days.length]);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0B565A,#1D8A8F_60%,#2FA5A9)] p-6 text-white shadow-lg">
      <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full border-[22px] border-white/[0.06]" />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/80">Semaine en cours · {week.start.toLocaleDateString('fr-FR', { month: 'long' })}</p>
          <h2 className="mt-2 font-display text-[30px] font-black leading-[1.1] sm:text-[36px]">{week.title || `Semaine ${week.number}`}</h2>
        </div>
        <WeekRing number={week.number} progress={progress} />
      </div>
      <div className="my-5 h-px bg-white/20" />
      {day ? (
        <div key={day.id} className="animate-fade-in">
          <p className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} /> {day.dayLabel}{day.time && ` · ${day.time}`}</p>
          <p className="mt-1 text-xl font-bold">{day.title}</p>
          {day.readings.length > 0 && <p className="text-sm text-white/75">{day.readings.map((r) => r.ref).join(' · ')}</p>}
        </div>
      ) : (
        <p className="text-sm text-white/80">{fmtDay(week.start)} – {fmtDay(week.end)} · Programme à venir</p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Cultes de la semaine">
          {week.days.map((d, i) => (
            <button key={d.id} role="tab" aria-selected={i === slide} aria-label={`${d.dayLabel} ${d.time} ${d.title}`} onClick={() => setSlide(i)} className={cn('h-2 rounded-full transition-all', i === slide ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70')} />
          ))}
        </div>
        <button onClick={onProgram} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-900 shadow-md transition hover:translate-x-0.5">
          Voir le programme <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* ───────────── Programme d'une semaine ───────────── */

function DayRow({ d }: { d: ThemeDay }) {
  const start = dayStart(d);
  const past = start ? start.getTime() < Date.now() - 3 * 3600000 : false;
  return (
    <div className={cn('flex gap-4 rounded-2xl border border-line bg-surface p-4', past && 'opacity-60')}>
      <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-mint-100 py-2 text-brand-800">
        <span className="text-[11px] font-bold uppercase">{d.dayLabel.slice(0, 3)}</span>
        <span className="font-display text-xl font-black leading-none">{d.date?.getDate() ?? '–'}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 font-bold">{d.title}{d.time && <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted"><Clock size={13} /> {d.time}</span>}</p>
        {d.readings.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {d.readings.map((r) => (r.to ? <Link key={r.ref} to={r.to} className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:bg-mint-200"><BookOpen size={12} /> {r.ref}</Link> : <span key={r.ref} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold"><BookOpen size={12} /> {r.ref}</span>))}
          </div>
        )}
        {d.hymns.length > 0 && <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-ink-muted"><Music size={12} className="text-brand-600" /> Cantiques :{' '}
          {d.hymns.map((h, i) => {
            // « Nigeria 357 » → /cantiques/nigeria/357 (recueil réel)
            const m = h.match(/^(.*\D)\s*(\d+)\s*$/);
            const to = m ? `/cantiques/${normalize(m[1].trim()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/${m[2]}` : null;
            return (
              <span key={`${h}-${i}`}>
                {to ? <Link to={to} className="font-semibold text-brand-700 hover:underline">{h}</Link> : h}
                {i < d.hymns.length - 1 && ', '}
              </span>
            );
          })}
        </p>}
        {d.notes && <p className="mt-1 text-sm text-ink-soft">{d.notes}</p>}
      </div>
      {start && !past && (
        <IconButton icon={CalendarPlus} label="Ajouter à mon agenda" size="sm" variant="soft" onClick={() => { agenda.add({ type: 'service', title: d.title, date: ymd(start), time: d.time || '10:00', repeat: 'aucune', notify: true }); toast('Culte ajouté à votre agenda'); }} />
      )}
    </div>
  );
}

function WeekBlock({ w, open, onToggle }: { w: ThemeWeek; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl bg-surface-sunken/60">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-sm font-black text-brand-700">{w.number}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{w.title || `Semaine ${w.number}`}</span>
          <span className="block text-xs text-ink-muted">{fmtDay(w.start)} – {fmtDay(w.end)} · {w.days.length} culte{w.days.length > 1 ? 's' : ''}</span>
        </span>
        <ChevronDown size={18} className={cn('shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {w.summary && <p className="whitespace-pre-line px-1 text-sm text-ink-soft">{w.summary}</p>}
          {w.days.length === 0 ? <p className="px-1 py-2 text-sm text-ink-muted">Programme non publié pour cette semaine.</p> : w.days.map((d) => <DayRow key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
}

/* ───────────── Mois ───────────── */

function Pill({ icon: Icon, value, label }: { icon: typeof Clock; value: number; label: string }) {
  return (
    <span className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gold-500/25 bg-gold-50 text-[15px] font-black text-ink" title={label}>
      <Icon size={16} className="text-ink-soft" /> {value}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function MonthCard({ m, open, onToggle, current, openWeek, setOpenWeek }: { m: ThemeMonth; open: boolean; onToggle: () => void; current?: string; openWeek: string | null; setOpenWeek: (k: string | null) => void }) {
  return (
    <article id={`mois-${m.key}`} className={cn('card scroll-mt-24 rounded-3xl p-4', m.weeks.some((w) => w.key === current) && 'ring-2 ring-brand-400')}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-mint-100 font-display text-2xl font-black text-brand-900">{m.index}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-black">{m.label}</span>
          {m.title && <span className="block truncate font-bold text-brand-700">{m.title}</span>}
          <span className="block text-sm font-semibold text-ink-muted">{range(m.start, m.end)}</span>
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-100 text-brand-700"><ChevronDown size={20} className={cn('transition', open && 'rotate-180')} /></span>
      </button>
      <div className="mt-4 flex gap-2">
        <Pill icon={Clock} value={m.counts.cultes} label="cultes" />
        <Pill icon={BookOpen} value={m.counts.lectures} label="lectures bibliques" />
        <Pill icon={Music} value={m.counts.cantiques} label="cantiques" />
      </div>
      {open && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {m.weeks.map((w) => <WeekBlock key={w.key} w={w} open={openWeek === w.key} onToggle={() => setOpenWeek(openWeek === w.key ? null : w.key)} />)}
        </div>
      )}
    </article>
  );
}

/* ───────────── Page ───────────── */

export function ThemePage() {
  const { contentId } = useParams();
  const { data, loading, error } = useThemeCalendar();
  const [query, setQuery] = useState('');
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const monthsRef = useRef<HTMLDivElement>(null);

  const requestedWeek = contentId?.match(/\d{4}-W\d{2}/)?.[0];
  const current = (requestedWeek ? data?.weeks.find((week) => week.key === requestedWeek) : undefined) ?? data?.current ?? null;
  const q = normalize(query.trim());
  const months = useMemo(() => {
    if (!data) return [];
    if (!q) return data.months;
    return data.months
      .map((m) => ({ ...m, weeks: m.weeks.filter((w) => normalize(`${m.title} ${w.title} ${w.summary} ${w.days.map((d) => `${d.title} ${d.readings.map((r) => r.ref).join(' ')}`).join(' ')}`).includes(q)) }))
      .filter((m) => m.weeks.length || normalize(`${m.label} ${m.title}`).includes(q));
  }, [data, q]);

  useEffect(() => {
    if (q) setOpenMonths(new Set(months.map((m) => m.key)));
  }, [q, months]);

  useEffect(() => {
    if (!contentId || !current) return;
    setOpenMonths((months) => new Set(months).add(current.monthKey));
    setOpenWeek(current.key);
  }, [contentId, current]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-72 rounded-[28px]" />
        <div className="skeleton h-28 rounded-3xl" />
      </div>
    );
  }
  if (error || !data) return <div className="card rounded-3xl"><EmptyState icon={CalendarDays} title="Impossible de charger les thèmes" text={error ?? undefined} /></div>;

  const weekStats = current
    ? { cultes: current.days.length, lectures: current.days.reduce((n, d) => n + d.readings.length, 0) + current.readings.length, cantiques: current.days.reduce((n, d) => n + d.hymns.length, 0), celebrations: current.days.filter((d) => d.celebration).length }
    : { cultes: 0, lectures: 0, cantiques: 0, celebrations: 0 };
  const allDays = data.weeks.flatMap((w) => w.days);
  const next = allDays.map((d) => ({ d, t: dayStart(d)?.getTime() ?? 0 })).filter((x) => x.t >= Date.now()).sort((a, b) => a.t - b.t)[0]?.d;

  const showProgram = () => {
    if (!current) return;
    setOpenMonths((s) => new Set(s).add(current.monthKey));
    setOpenWeek(current.key);
    window.setTimeout(() => document.getElementById(`mois-${current.monthKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <IconButton icon={ChevronLeft} label="Retour" shape="square" onClick={() => window.history.back()} />
        <LogoMark className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[24px] font-black leading-tight text-ink">Thème de la semaine</h1>
          <p className="text-sm text-ink-muted">{data.weeks.length} semaine{data.weeks.length > 1 ? 's' : ''}</p>
        </div>
        <IconButton icon={Share2} label="Partager" shape="square" onClick={() => openShare({ title: current ? `Thème de la semaine : ${current.title}` : 'Thèmes de la semaine CélèOne', url: current ? `/weekly-themes/${current.key}` : '/menu/calendrier/theme-semaine' })} />
        <IconButton icon={List} label="Voir tous les mois" shape="square" onClick={() => monthsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      </div>

      {current ? <CurrentWeekCard week={current} onProgram={showProgram} /> : <div className="card rounded-3xl"><EmptyState icon={CalendarDays} title="Aucun thème pour cette semaine" text="Consultez les thèmes des autres semaines ci-dessous." /></div>}

      <section ref={programRef}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-black">Votre semaine en un regard</h2>
          <Sparkles size={22} className="text-brand-600" />
        </div>
        <label className="mb-4 flex h-14 items-center gap-3 rounded-2xl bg-surface px-5 shadow-xs ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-400">
          <Search size={19} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par thème ou référence…" aria-label="Rechercher par thème ou référence" className="h-full flex-1 bg-transparent text-[15px] outline-none" />
          {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={16} /></button>}
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Clock, value: weekStats.cultes, label: 'Cultes', warm: true },
            { icon: BookOpen, value: weekStats.lectures, label: 'Lectures bibliques' },
            { icon: Music, value: weekStats.cantiques, label: 'Cantiques', warm: true },
            { icon: Sparkles, value: weekStats.celebrations, label: 'Célébrations' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-3xl p-4', s.warm ? 'bg-gold-50' : 'bg-surface ring-1 ring-line')}>
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-brand-700"><s.icon size={19} /></span>
              <p className="font-display text-3xl font-black">{s.value}</p>
              <p className="text-sm font-bold text-brand-700">{s.label}</p>
            </div>
          ))}
        </div>
        {next && (
          <button onClick={showProgram} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-gold-500/30 bg-gold-50 px-4 py-3 text-left transition hover:bg-gold-100">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-700"><span className="h-2.5 w-2.5 rounded-full bg-brand-700" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-brand-800">Prochain culte</span>
              <span className="block truncate text-sm text-ink-soft">{next.title} · {next.dayLabel} {next.date ? fmtDay(next.date) : ''}{next.time && ` · ${next.time}`}</span>
            </span>
            <ChevronRight size={18} className="text-ink-faint" />
          </button>
        )}
      </section>

      <section ref={monthsRef} className="scroll-mt-24 space-y-3">
        <h2 className="text-[22px] font-black">Tous les thèmes</h2>
        {months.length === 0 ? (
          <div className="card rounded-3xl"><EmptyState icon={Search} title="Aucun thème ne correspond à votre recherche" /></div>
        ) : (
          months.map((m) => (
            <MonthCard
              key={m.key}
              m={m}
              current={current?.key}
              open={openMonths.has(m.key)}
              onToggle={() => setOpenMonths((s) => { const n = new Set(s); if (n.has(m.key)) n.delete(m.key); else n.add(m.key); return n; })}
              openWeek={openWeek}
              setOpenWeek={setOpenWeek}
            />
          ))
        )}
        {current && <Button variant="ghost" icon={CalendarDays} onClick={showProgram}>Revenir à la semaine en cours</Button>}
      </section>
    </div>
  );
}
