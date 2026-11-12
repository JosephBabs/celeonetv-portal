import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Award, CalendarDays, Check, CircleHelp, House, KeyRound, Leaf, Medal, RotateCcw, Search, Timer, Trophy, UserPlus, Users, X, XCircle,
} from 'lucide-react';
import { candidatesFor, phasesByYear, quizQuestions, youthYears, type Candidate, type YouthCategory } from '@/data/youth';
import { library, useLibrary, type Registration } from '@/store/library';
import { useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { cn, formatDate, normalize } from '@/lib/utils';

const fmtDay = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });

function YearSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const year = useLibrary((s) => s.youthYear);
  return (
    <Modal open={open} onClose={onClose} title="Choisir l'année" description="Voir les dates du concours et les résultats pour une année précise" size="sm">
      <div className="space-y-1.5">
        {youthYears.map((y) => (
          <button key={y} onClick={() => { library.setYouthYear(y); onClose(); }} className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-bold', year === y ? 'bg-mint-100 text-brand-900' : 'hover:bg-surface-sunken')}>
            {y} {year === y && <Check size={18} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function CandidateResult({ c, onClose, year }: { c: Candidate | Registration | null; onClose: () => void; year: number }) {
  if (!c) return null;
  const phases = phasesByYear[year] ?? [];
  const isReg = !('scores' in c);
  return (
    <Modal open onClose={onClose} title={`${c.firstName} ${c.lastName}`} description={`${c.id} · ${c.parish} · ${c.category}`} size="sm">
      {isReg ? (
        <div className="rounded-2xl bg-mint-100 p-4 text-sm text-brand-900">
          Inscription enregistrée le {fmtDay((c as Registration).createdAt)}. Les résultats apparaîtront après la phase préliminaire.
        </div>
      ) : (
        <div className="space-y-2">
          {phases.map((p) => {
            const score = (c as Candidate).scores[p.id];
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                <Trophy size={18} className="text-brand-600" />
                <span className="flex-1 font-semibold">{p.name}</span>
                {score === null ? <span className="text-sm text-ink-muted">—</span> : <span className={cn('font-black tabular-nums', score >= 60 ? 'text-brand-700' : 'text-danger-700')}>{score}/100</span>}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/** En-tête collant de l'espace Jeunesse (palette bleu nuit + verts). */
function JeunesseShell({ children }: { children: ReactNode }) {
  const year = useLibrary((s) => s.youthYear);
  const registrations = useLibrary((s) => s.registrations);
  const navigate = useNavigate();
  const [yearOpen, setYearOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [found, setFound] = useState<Candidate | Registration | null>(null);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const id = identifier.trim().toUpperCase();
    if (!id) return;
    const match = [...registrations.filter((r) => r.year === year), ...candidatesFor(year)].find((c) => c.id === id);
    if (match) setFound(match);
    else toast('Aucun candidat trouvé pour cet identifiant', { tone: 'danger' });
  };

  const tabs = [
    { to: '/jeunesse', label: 'Accueil', icon: House, end: true },
    { to: '/jeunesse/resultats', label: 'Résultats', icon: Award },
    { to: '/jeunesse/quiz', label: 'Quiz', icon: CircleHelp },
    { to: '/jeunesse/inscription', label: 'Inscription', icon: UserPlus },
  ];

  return (
    <div className="pb-16">
      <div className="sticky top-[72px] z-20 mb-5 rounded-3xl border border-line/70 bg-surface p-4 shadow-md sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken text-brand-700"><Leaf size={22} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-black leading-tight text-brand-900">Jeunesse</h1>
            <p className="truncate text-sm text-ink-muted">Enfants & Jeunes · Concours biblique annuel</p>
          </div>
          <button onClick={() => setYearOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-sunken px-4 text-lg font-black hover:bg-line"><CalendarDays size={18} /> {year}</button>
          <IconButton icon={X} label="Fermer l'espace Jeunesse" shape="square" className="hidden sm:inline-flex" onClick={() => navigate('/accueil')} />
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto scrollbar-none" aria-label="Sections Jeunesse">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cn('inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition', isActive ? 'bg-night text-white' : 'bg-mint-300/80 text-brand-900 hover:bg-mint-300')}>
              <t.icon size={18} /> {t.label}
            </NavLink>
          ))}
        </nav>
        <form onSubmit={search} className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-sunken p-2 pl-4">
          <KeyRound size={18} className="text-ink-muted" />
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={`Entrez l'identifiant (ex : EAJ-${year}-004)`} aria-label="Identifiant du candidat" className="h-10 flex-1 bg-transparent text-[15px] uppercase outline-none placeholder:normal-case placeholder:text-ink-faint" />
          <IconButton icon={Search} label="Rechercher" variant="white" type="submit" />
        </form>
      </div>
      {children}
      <YearSheet open={yearOpen} onClose={() => setYearOpen(false)} />
      <CandidateResult c={found} year={year} onClose={() => setFound(null)} />
    </div>
  );
}

/* ───────────── Accueil ───────────── */

export function JeunesseHomePage() {
  const year = useLibrary((s) => s.youthYear);
  const registrations = useLibrary((s) => s.registrations);
  const navigate = useNavigate();
  const [phaseOpen, setPhaseOpen] = useState<string | null>(null);
  const phases = phasesByYear[year] ?? [];
  const candidates = useMemo(() => candidatesFor(year), [year]);
  const today = new Date().toISOString().slice(0, 10);
  const mine = registrations.filter((r) => r.year === year);
  const phase = phases.find((p) => p.id === phaseOpen);
  const phaseCandidates = phase ? candidates.filter((c) => c.scores[phase.id] !== null) : [];

  return (
    <JeunesseShell>
      <div className="space-y-4">
        {mine.length > 0 && (
          <div className="rounded-3xl bg-[linear-gradient(120deg,#0f1b2d,#1b2940)] p-5 text-white">
            <p className="text-sm text-white/70">Mes inscriptions {year}</p>
            {mine.map((r) => (
              <div key={r.id} className="mt-2 flex items-center gap-3">
                <span className="rounded-lg bg-white/15 px-2.5 py-1 font-mono text-sm font-bold">{r.id}</span>
                <span className="flex-1 font-semibold">{r.firstName} {r.lastName} · {r.category}</span>
              </div>
            ))}
          </div>
        )}
        <section className="card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Calendrier du concours</h2>
            <span className="rounded-full bg-surface-sunken px-3 py-1 text-sm font-semibold">Année {year}</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Consultez les dates et périodes de chaque phase. Appuyez sur « Candidats » pour voir la liste (si disponible).</p>
          <div className="mt-4 space-y-3">
            {phases.map((p) => {
              const count = candidates.filter((c) => c.scores[p.id] !== null).length;
              const status = p.end < today ? 'Terminée' : p.start <= today ? 'En cours' : 'À venir';
              return (
                <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line p-4">
                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', status === 'À venir' ? 'bg-surface-sunken text-ink-muted' : 'bg-mint-100 text-brand-700')}><Trophy size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[17px] font-bold">{p.name} <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', status === 'Terminée' ? 'bg-surface-sunken text-ink-muted' : status === 'En cours' ? 'bg-gold-100 text-gold-700' : 'bg-lavender-50 text-lavender')}>{status}</span></p>
                    <p className="text-sm text-ink-muted">{p.start === p.end ? `Le ${fmtDay(p.start)}` : `Du ${fmtDay(p.start)} au ${fmtDay(p.end)}`} · Candidats : {count}</p>
                  </div>
                  <IconButton icon={Users} label={`Candidats de la phase ${p.name}`} shape="square" disabled={!count} onClick={() => setPhaseOpen(p.id)} />
                </div>
              );
            })}
          </div>
        </section>
        <section className="card rounded-3xl p-5">
          <h2 className="text-xl font-extrabold">Actions rapides</h2>
          <p className="mt-1 text-sm text-ink-muted">Rechercher les résultats, participer au quiz ou inscrire un enfant.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="night" icon={Search} onClick={() => navigate('/jeunesse/resultats')}>Rechercher les résultats</Button>
            <Button variant="night" icon={CircleHelp} onClick={() => navigate('/jeunesse/quiz')}>Ouvrir le quiz</Button>
            <Button icon={UserPlus} className="bg-[#5fe08f] text-night hover:bg-[#4fd07f]" onClick={() => navigate('/jeunesse/inscription')}>Inscrire</Button>
          </div>
        </section>
      </div>
      <Modal open={!!phase} onClose={() => setPhaseOpen(null)} title={`Candidats — ${phase?.name ?? ''}`} description={`${phaseCandidates.length} candidats · ${year}`}>
        <div className="divide-y divide-line">
          {phaseCandidates.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="font-mono text-xs text-ink-muted">{c.id}</span>
              <span className="flex-1 font-semibold">{c.firstName} {c.lastName}</span>
              <span className="text-xs text-ink-muted">{c.category}</span>
            </div>
          ))}
        </div>
      </Modal>
    </JeunesseShell>
  );
}

/* ───────────── Résultats ───────────── */

export function JeunesseResultsPage() {
  const year = useLibrary((s) => s.youthYear);
  const phases = phasesByYear[year] ?? [];
  const candidates = useMemo(() => candidatesFor(year), [year]);
  const scored = phases.filter((p) => candidates.some((c) => c.scores[p.id] !== null));
  const [phaseId, setPhaseId] = useState<string | null>(null);
  const [category, setCategory] = useState<YouthCategory | 'Toutes'>('Toutes');
  const [query, setQuery] = useState('');
  const active = phaseId ?? scored[scored.length - 1]?.id;
  const ranking = candidates
    .filter((c) => active && c.scores[active] !== null)
    .filter((c) => category === 'Toutes' || c.category === category)
    .filter((c) => normalize(`${c.firstName} ${c.lastName} ${c.id}`).includes(normalize(query)))
    .sort((a, b) => (b.scores[active!] ?? 0) - (a.scores[active!] ?? 0));

  return (
    <JeunesseShell>
      <div className="card rounded-3xl p-5">
        <h2 className="text-xl font-extrabold">Résultats {year}</h2>
        {scored.length === 0 ? (
          <EmptyState icon={Award} title="Aucun résultat publié pour le moment" text="Les résultats apparaîtront après la phase préliminaire." />
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {scored.map((p) => (
                <button key={p.id} onClick={() => setPhaseId(p.id)} className={cn('h-9 rounded-full px-4 text-sm font-semibold', active === p.id ? 'bg-night text-white' : 'bg-surface-sunken hover:bg-line')}>{p.name}</button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-surface-sunken px-4">
                <Search size={16} className="text-ink-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom ou identifiant" className="flex-1 bg-transparent text-sm outline-none" />
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value as YouthCategory | 'Toutes')} className="h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold" aria-label="Catégorie">
                {['Toutes', 'Enfants', 'Adolescents', 'Jeunes'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <ol className="mt-4 divide-y divide-line">
              {ranking.length === 0 && <EmptyState icon={Search} title="Aucun candidat trouvé" className="py-8" />}
              {ranking.map((c, i) => {
                const score = c.scores[active!] ?? 0;
                return (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-black', i === 0 ? 'bg-gold-500 text-night' : i === 1 ? 'bg-slate-300 text-night' : i === 2 ? 'bg-orange-50 text-orange' : 'bg-surface-sunken text-ink-muted')}>
                      {i < 3 ? <Medal size={16} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-ink-muted">{c.id} · {c.category} · {c.parish}</p>
                    </div>
                    <div className="w-24 text-right">
                      <p className={cn('font-black tabular-nums', score >= 60 ? 'text-brand-700' : 'text-danger-700')}>{score}/100</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand-500" style={{ width: `${score}%` }} /></div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </JeunesseShell>
  );
}

/* ───────────── Quiz ───────────── */

export function JeunesseQuizPage() {
  const best = useLibrary((s) => s.quizBest);
  const plays = useLibrary((s) => s.quizPlays);
  const [state, setState] = useState<'intro' | 'play' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = quizQuestions[index];

  const start = () => {
    setState('play');
    setIndex(0);
    setPicked(null);
    setScore(0);
  };
  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (index + 1 < quizQuestions.length) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      library.recordQuiz(score);
      setState('done');
    }
  };

  return (
    <JeunesseShell>
      <div className="card rounded-3xl p-5 sm:p-7">
        {state === 'intro' && (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 font-display text-4xl font-black text-violet">?</span>
            <h2 className="text-2xl font-black">Quiz biblique</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-muted">{quizQuestions.length} questions pour tester vos connaissances. Chaque bonne réponse rapporte un point.</p>
            <div className="mx-auto mt-5 flex max-w-xs justify-center gap-6 text-sm">
              <div><p className="text-2xl font-black text-brand-700">{best}/{quizQuestions.length}</p><p className="text-ink-muted">Meilleur score</p></div>
              <div><p className="text-2xl font-black text-brand-700">{plays}</p><p className="text-ink-muted">Parties jouées</p></div>
            </div>
            <Button size="lg" variant="night" className="mt-6" icon={Timer} onClick={start}>Commencer le quiz</Button>
          </div>
        )}
        {state === 'play' && (
          <div>
            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-ink-muted">
              <span>Question {index + 1}/{quizQuestions.length}</span>
              <span>Score : {score}</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-[#5fe08f] transition-all" style={{ width: `${((index + (picked !== null ? 1 : 0)) / quizQuestions.length) * 100}%` }} /></div>
            <h2 className="mb-5 text-xl font-black leading-snug">{q.q}</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {q.choices.map((c, i) => {
                const correct = picked !== null && i === q.answer;
                const wrong = picked === i && i !== q.answer;
                return (
                  <button key={c} onClick={() => answer(i)} disabled={picked !== null} className={cn('flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition', correct ? 'border-brand-500 bg-mint-100' : wrong ? 'border-danger bg-danger-50' : 'border-line hover:border-night', picked !== null && !correct && !wrong && 'opacity-60')}>
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black', correct ? 'bg-brand-600 text-white' : wrong ? 'bg-danger text-white' : 'bg-surface-sunken')}>
                      {correct ? <Check size={16} /> : wrong ? <XCircle size={16} /> : String.fromCharCode(65 + i)}
                    </span>
                    {c}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-5 flex animate-fade-in flex-wrap items-center gap-3 rounded-2xl bg-surface-sunken p-4">
                <p className="flex-1 text-sm">{picked === q.answer ? '✅ Bonne réponse ! ' : '❌ Pas tout à fait. '}{q.explain}</p>
                <Button variant="night" onClick={next}>{index + 1 < quizQuestions.length ? 'Question suivante' : 'Voir mon score'}</Button>
              </div>
            )}
          </div>
        )}
        {state === 'done' && (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold-500 text-night"><Trophy size={36} /></span>
            <h2 className="text-2xl font-black">Votre score : {score}/{quizQuestions.length}</h2>
            <p className="mt-2 text-ink-muted">{score >= 8 ? 'Excellent ! Vous êtes prêt pour le concours.' : score >= 5 ? 'Bien joué, continuez à réviser !' : 'Encore un effort, la prochaine sera la bonne.'}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="night" icon={RotateCcw} onClick={start}>Rejouer</Button>
              <Button variant="ghost" onClick={() => toast('Score partagé avec vos amis')}>Partager mon score</Button>
            </div>
          </div>
        )}
      </div>
    </JeunesseShell>
  );
}

/* ───────────── Inscription ───────────── */

function ageOf(birth: string) {
  if (!birth) return null;
  const d = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}
const categoryFor = (age: number | null): YouthCategory | null => (age === null ? null : age < 6 || age > 25 ? null : age <= 12 ? 'Enfants' : age <= 17 ? 'Adolescents' : 'Jeunes');

export function JeunesseRegistrationPage() {
  const year = useLibrary((s) => s.youthYear);
  const registrations = useLibrary((s) => s.registrations);
  const account = useApp((s) => s.account);
  const [form, setForm] = useState({ firstName: '', lastName: '', birthDate: '', gender: '' as '' | 'F' | 'M', parish: account?.parish ?? '', guardian: '', phone: account?.phone ?? '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Registration | null>(null);
  const age = ageOf(form.birthDate);
  const category = categoryFor(age);
  const minor = age !== null && age < 18;
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.firstName.trim()) err.firstName = 'Le prénom est requis.';
    if (!form.lastName.trim()) err.lastName = 'Le nom est requis.';
    if (!form.birthDate) err.birthDate = 'La date de naissance est requise.';
    else if (!category) err.birthDate = 'Le concours est ouvert aux 6-25 ans.';
    if (!form.gender) err.gender = 'Précisez le sexe.';
    if (!form.parish.trim()) err.parish = 'La paroisse est requise.';
    if (minor && !form.guardian.trim()) err.guardian = 'Le nom du parent ou tuteur est requis pour un mineur.';
    if (form.phone.replace(/\D/g, '').length < 8) err.phone = 'Numéro de téléphone invalide.';
    if (!form.consent) err.consent = 'Vous devez accepter le règlement.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const reg = library.register({ year, firstName: form.firstName.trim(), lastName: form.lastName.trim(), birthDate: form.birthDate, gender: form.gender as 'F' | 'M', parish: form.parish.trim(), category: category!, guardian: form.guardian.trim() || undefined, phone: form.phone.trim() });
    setDone(reg);
    toast('Inscription enregistrée');
  };

  const field = (k: keyof typeof form, label: string, input: ReactNode) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {input}
      {errors[k] && <span className="mt-1 block text-xs font-medium text-danger-700">{errors[k]}</span>}
    </label>
  );

  return (
    <JeunesseShell>
      <div className="card rounded-3xl p-5 sm:p-7">
        {done ? (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#5fe08f] text-night"><Check size={36} strokeWidth={3} /></span>
            <h2 className="text-2xl font-black">Inscription confirmée !</h2>
            <p className="mt-2 text-ink-muted">Conservez l'identifiant de {done.firstName} pour consulter ses résultats.</p>
            <p className="mx-auto mt-4 w-fit rounded-2xl bg-night px-6 py-3 font-mono text-2xl font-black tracking-wider text-white">{done.id}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="night" onClick={() => { setDone(null); setForm((f) => ({ ...f, firstName: '', birthDate: '', gender: '', consent: false })); }}>Inscrire un autre enfant</Button>
              <Button variant="ghost" to="/jeunesse">Retour à l'accueil</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold">Inscription au concours {year}</h2>
              <p className="text-sm text-ink-muted">Ouvert aux enfants et jeunes de 6 à 25 ans. La catégorie est déterminée automatiquement.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('firstName', 'Prénom', <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={cn('field', errors.firstName && 'field-error')} />)}
              {field('lastName', 'Nom', <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={cn('field', errors.lastName && 'field-error')} />)}
              {field('birthDate', 'Date de naissance', <input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} className={cn('field', errors.birthDate && 'field-error')} />)}
              {field('gender', 'Sexe', (
                <div className="flex gap-2">
                  {([['F', 'Fille'], ['M', 'Garçon']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set('gender', v)} className={cn('h-11 flex-1 rounded-md border text-sm font-semibold', form.gender === v ? 'border-night bg-night text-white' : 'border-line')}>{l}</button>
                  ))}
                </div>
              ))}
              {field('parish', 'Paroisse', <input value={form.parish} onChange={(e) => set('parish', e.target.value)} className={cn('field', errors.parish && 'field-error')} placeholder="Ex. Paroisse Sion, Porto-Novo" />)}
              {field('phone', 'Téléphone de contact', <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={cn('field', errors.phone && 'field-error')} placeholder="+229 …" />)}
              {minor && field('guardian', 'Parent ou tuteur', <input value={form.guardian} onChange={(e) => set('guardian', e.target.value)} className={cn('field', errors.guardian && 'field-error')} />)}
            </div>
            {category && <p className="rounded-xl bg-mint-100 px-4 py-2.5 text-sm font-semibold text-brand-900">Catégorie : {category} ({age} ans)</p>}
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
              <span>J'accepte le règlement du concours et l'utilisation des informations pour l'organisation.{errors.consent && <span className="block text-xs font-medium text-danger-700">{errors.consent}</span>}</span>
            </label>
            <Button type="submit" size="lg" icon={UserPlus} className="bg-[#5fe08f] text-night hover:bg-[#4fd07f]">S'inscrire</Button>
          </form>
        )}
      </div>
      {registrations.length > 0 && !done && (
        <div className="card mt-4 rounded-3xl p-5">
          <h3 className="mb-2 font-extrabold">Inscriptions effectuées</h3>
          {registrations.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-0">
              <span className="font-mono text-sm font-bold text-brand-700">{r.id}</span>
              <span className="flex-1 text-sm">{r.firstName} {r.lastName} · {r.category} · {r.year}</span>
              <Button size="sm" variant="ghost" onClick={() => { library.cancelRegistration(r.id); toast('Inscription annulée'); }}>Annuler</Button>
            </div>
          ))}
        </div>
      )}
    </JeunesseShell>
  );
}
