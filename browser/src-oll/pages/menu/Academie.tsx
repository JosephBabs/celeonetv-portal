import { useState } from 'react';
import { Award, BookOpen, Check, CheckCircle2, Circle, Download, GraduationCap, Lock, Play, RotateCcw, SquareCheck, Trophy } from 'lucide-react';
import type { SceneVariant } from '@/data/types';
import { quizQuestions } from '@/data/youth';
import { accountName, useApp } from '@/store/app';
import { menu, useMenu } from '@/store/menu';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Scene, VideoFrame } from '@/components/feed/Scene';
import { cn, formatDate } from '@/lib/utils';
import { MenuShell, StatTile } from './MenuShell';

interface Course { id: string; title: string; level: string; scene: SceneVariant; lessons: string[] }

export const courseCatalog: Record<string, { label: string; video?: boolean; courses: Course[] }> = {
  'cours-bibliques': { label: 'Cours bibliques', courses: [
    { id: 'genese', title: 'Découvrir la Genèse', level: 'Débutant', scene: 'sunrise', lessons: ['La création', 'Les patriarches', 'Joseph en Égypte', 'Synthèse et quiz'] },
    { id: 'evangiles', title: 'Les quatre évangiles', level: 'Intermédiaire', scene: 'candles', lessons: ['Introduction', 'Matthieu et Marc', 'Luc', 'Jean', 'Synthèse'] },
    { id: 'psaumes', title: 'Prier avec les Psaumes', level: 'Débutant', scene: 'prayer', lessons: ['Louange', 'Supplication', 'Confiance'] },
  ] },
  doctrine: { label: 'Doctrine', courses: [
    { id: 'fondements', title: 'Fondements de la foi', level: 'Débutant', scene: 'choir', lessons: ['Dieu et la Trinité', 'Le salut', 'L’Église', 'Les sacrements'] },
    { id: 'vie-chretienne', title: 'La vie du fidèle', level: 'Intermédiaire', scene: 'beach', lessons: ['La prière', 'Le jeûne', 'La sanctification'] },
  ] },
  'ecole-dimanche': { label: 'École du dimanche', courses: [
    { id: 'petits', title: 'Les histoires pour les petits', level: '6-9 ans', scene: 'birthday', lessons: ['Noé et l’arche', 'David et Goliath', 'Jonas', 'La naissance de Jésus'] },
    { id: 'ados', title: 'Grandir dans la foi', level: '10-14 ans', scene: 'youth', lessons: ['Qui suis-je ?', 'L’amitié', 'Servir les autres'] },
  ] },
  formation: { label: 'Formation', courses: [
    { id: 'chorale', title: 'Diriger une chorale', level: 'Responsables', scene: 'drums', lessons: ['Le répertoire', 'La voix', 'La direction', 'L’organisation'] },
    { id: 'jeunes', title: 'Animer un groupe de jeunes', level: 'Responsables', scene: 'youth', lessons: ['Accueillir', 'Enseigner', 'Accompagner'] },
  ] },
  'lecons-video': { label: 'Leçons vidéo', video: true, courses: [
    { id: 'video-priere', title: 'Apprendre à prier (vidéo)', level: 'Tous', scene: 'candles', lessons: ['Épisode 1', 'Épisode 2', 'Épisode 3'] },
    { id: 'video-chant', title: 'Chanter les cantiques (vidéo)', level: 'Tous', scene: 'choir', lessons: ['Respiration', 'Justesse', 'Ensemble'] },
  ] },
};

function CourseModal({ cat, course, onClose }: { cat: string; course: Course; onClose: () => void }) {
  const key = `${cat}:${course.id}`;
  const done = useMenu((s) => s.courseProgress[key] ?? []);
  const [lesson, setLesson] = useState<number | null>(null);
  const video = courseCatalog[cat].video;
  const next = course.lessons.findIndex((_, i) => !done.includes(i));
  return (
    <Modal open onClose={onClose} title={course.title} description={`${course.level} · ${done.length}/${course.lessons.length} leçons`} size="lg"
      footer={next >= 0 ? <Button icon={Play} onClick={() => setLesson(next)}>{done.length ? 'Continuer' : 'Commencer'}</Button> : <Button variant="soft" icon={Award} to="/menu/academie/certificats">Voir mon certificat</Button>}>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(done.length / course.lessons.length) * 100}%` }} /></div>
      {lesson === null ? (
        <ol className="space-y-1.5">
          {course.lessons.map((l, i) => (
            <li key={l}>
              <button onClick={() => setLesson(i)} className="flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-left hover:bg-surface-sunken">
                {done.includes(i) ? <CheckCircle2 size={20} className="text-brand-600" /> : <Circle size={20} className="text-ink-faint" />}
                <span className="flex-1 font-semibold">Leçon {i + 1} — {l}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setLesson(null)} className="text-sm font-semibold text-brand-700 hover:underline">← Toutes les leçons</button>
          <h3 className="text-xl font-black">Leçon {lesson + 1} — {course.lessons[lesson]}</h3>
          {video ? <VideoFrame scene={course.scene} className="aspect-video" /> : (
            <div className="space-y-3 text-ink-soft">
              <p className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">Contenu pédagogique de démonstration.</p>
              <p>Introduction de la leçon : objectifs, versets de référence et notions clés à retenir.</p>
              <p>Développement : explication détaillée, exemples tirés de la vie de la communauté et questions de réflexion.</p>
              <p>À retenir : trois points essentiels et une prière pour conclure.</p>
            </div>
          )}
          <Button variant={done.includes(lesson) ? 'soft' : 'primary'} icon={Check} onClick={() => { menu.toggleLesson(key, lesson); if (!done.includes(lesson)) { toast('Leçon terminée'); if (lesson + 1 < course.lessons.length) setLesson(lesson + 1); } }}>
            {done.includes(lesson) ? 'Terminée — annuler' : 'Marquer comme terminée'}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function CoursesPage({ cat }: { cat: string }) {
  const catalog = courseCatalog[cat];
  const progress = useMenu((s) => s.courseProgress);
  const [open, setOpen] = useState<Course | null>(null);
  const total = catalog.courses.reduce((n, c) => n + c.lessons.length, 0);
  const done = catalog.courses.reduce((n, c) => n + (progress[`${cat}:${c.id}`]?.length ?? 0), 0);
  return (
    <MenuShell description={`${catalog.courses.length} parcours · ${done}/${total} leçons terminées`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {catalog.courses.map((c) => {
          const n = progress[`${cat}:${c.id}`]?.length ?? 0;
          const pct = Math.round((n / c.lessons.length) * 100);
          return (
            <button key={c.id} onClick={() => setOpen(c)} className="card card-hover overflow-hidden rounded-3xl text-left">
              <div className="relative h-32"><Scene variant={c.scene} playing={false} />{catalog.video && <span className="absolute inset-0 flex items-center justify-center"><Play size={30} className="fill-white text-white drop-shadow" /></span>}</div>
              <div className="p-4">
                <p className="font-extrabold">{c.title}</p>
                <p className="text-xs text-ink-muted">{c.level} · {c.lessons.length} leçons</p>
                <div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div><span className="text-xs font-bold text-brand-700">{pct} %</span></div>
                <span className="mt-3 inline-flex rounded-full bg-mint-100 px-3 py-1.5 text-sm font-semibold text-brand-800">{pct === 100 ? 'Revoir' : n ? 'Continuer' : 'Commencer'}</span>
              </div>
            </button>
          );
        })}
      </div>
      {open && <CourseModal cat={cat} course={open} onClose={() => setOpen(null)} />}
    </MenuShell>
  );
}

const exams = [
  { id: 'ex-bible', title: 'Examen — Connaissance biblique', questions: quizQuestions.slice(0, 5) },
  { id: 'ex-general', title: 'Examen — Culture générale', questions: quizQuestions.slice(5, 10) },
];

export function ExamensPage() {
  const scores = useMenu((s) => s.examScores);
  const [running, setRunning] = useState<(typeof exams)[number] | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const finish = (all: number[]) => {
    const ex = running!;
    const score = Math.round((all.filter((a, k) => a === ex.questions[k].answer).length / ex.questions.length) * 100);
    menu.recordExam(ex.id, score);
    toast(score >= 70 ? `Réussi avec ${score} % — certificat débloqué` : `Score : ${score} %. 70 % sont nécessaires.`, { tone: score >= 70 ? 'success' : 'danger' });
    setRunning(null);
  };
  return (
    <MenuShell description="Validez vos connaissances — 70 % pour obtenir le certificat">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exams.map((ex) => (
          <div key={ex.id} className="card rounded-3xl p-5">
            <p className="flex items-center gap-2 font-extrabold"><SquareCheck size={18} className="text-brand-600" />{ex.title}</p>
            <p className="text-sm text-ink-muted">{ex.questions.length} questions · meilleur score : {scores[ex.id] ?? '—'}{scores[ex.id] !== undefined && ' %'}</p>
            <Button className="mt-3" icon={scores[ex.id] !== undefined ? RotateCcw : Play} onClick={() => { setRunning(ex); setI(0); setAnswers([]); }}>{scores[ex.id] !== undefined ? 'Repasser' : 'Commencer'}</Button>
          </div>
        ))}
      </div>
      {running && (
        <Modal open onClose={() => setRunning(null)} title={running.title} description={`Question ${i + 1}/${running.questions.length}`}>
          <p className="mb-4 text-lg font-bold">{running.questions[i].q}</p>
          <div className="space-y-2">
            {running.questions[i].choices.map((c, k) => (
              <button key={c} onClick={() => { const next = [...answers, k]; setAnswers(next); if (i + 1 < running.questions.length) setI(i + 1); else finish(next); }} className="flex w-full items-center gap-3 rounded-xl border-2 border-line px-4 py-3 text-left font-semibold hover:border-brand-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-sunken text-sm">{String.fromCharCode(65 + k)}</span>{c}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </MenuShell>
  );
}

export function CertificatsPage() {
  const account = useApp((s) => s.account);
  const progress = useMenu((s) => s.courseProgress);
  const scores = useMenu((s) => s.examScores);
  const certs = [
    ...Object.entries(courseCatalog).flatMap(([cat, c]) => c.courses.filter((x) => (progress[`${cat}:${x.id}`]?.length ?? 0) === x.lessons.length).map((x) => ({ id: x.id, title: x.title, kind: c.label }))),
    ...exams.filter((e) => (scores[e.id] ?? 0) >= 70).map((e) => ({ id: e.id, title: e.title, kind: `Examen · ${scores[e.id]} %` })),
  ];
  const download = (title: string) => {
    if (!account) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="#fffdf5"/><rect x="30" y="30" width="940" height="640" fill="none" stroke="#0e8c7e" stroke-width="6"/><text x="500" y="170" text-anchor="middle" font-family="Georgia" font-size="54" fill="#063c36">Certificat</text><text x="500" y="250" text-anchor="middle" font-family="Arial" font-size="24" fill="#5b6b67">Académie Cèlè One certifie que</text><text x="500" y="340" text-anchor="middle" font-family="Georgia" font-size="46" font-weight="bold" fill="#14231f">${accountName(account)}</text><text x="500" y="420" text-anchor="middle" font-family="Arial" font-size="24" fill="#5b6b67">a validé le parcours</text><text x="500" y="480" text-anchor="middle" font-family="Arial" font-size="30" font-weight="bold" fill="#0a6b60">${title}</text><text x="500" y="600" text-anchor="middle" font-family="Arial" font-size="18" fill="#5b6b67">Délivré le ${formatDate(new Date().toISOString())} — document de démonstration</text></svg>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `certificat-${title.replace(/\W+/g, '-').toLowerCase()}.svg`;
    a.click();
    toast('Certificat téléchargé');
  };
  const totalCourses = Object.values(courseCatalog).reduce((n, c) => n + c.courses.length, 0);
  return (
    <MenuShell description="Vos parcours validés">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Certificats" value={certs.length} icon={Award} />
        <StatTile label="Parcours" value={totalCourses} icon={BookOpen} />
        <StatTile label="Examens" value={exams.length} icon={GraduationCap} />
      </div>
      {certs.length === 0 ? (
        <div className="card rounded-3xl"><EmptyState icon={Lock} title="Aucun certificat pour le moment" text="Terminez un parcours ou réussissez un examen (70 %) pour débloquer votre premier certificat." action={<Button to="/menu/academie/cours-bibliques">Parcourir les cours</Button>} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {certs.map((c) => (
            <div key={c.id} className={cn('card flex items-center gap-4 rounded-3xl border-2 border-gold-500/40 p-5')}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500 text-night"><Trophy size={24} /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-extrabold">{c.title}</p><p className="text-xs text-ink-muted">{c.kind}</p></div>
              <Button size="sm" variant="soft" icon={Download} onClick={() => download(c.title)}>PDF</Button>
            </div>
          ))}
        </div>
      )}
    </MenuShell>
  );
}
