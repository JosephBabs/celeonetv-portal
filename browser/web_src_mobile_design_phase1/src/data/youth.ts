export type YouthCategory = 'Enfants' | 'Adolescents' | 'Jeunes';

export interface Phase {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  parish: string;
  category: YouthCategory;
  scores: Record<string, number | null>;
}

export const youthYears = [2026, 2025, 2024];

export const phasesByYear: Record<number, Phase[]> = {
  2026: [
    { id: 'preliminaire', name: 'Préliminaire', start: '2026-08-23', end: '2026-08-23' },
    { id: 'preselection', name: 'Présélection', start: '2026-09-13', end: '2026-09-14' },
    { id: 'demi-finale', name: 'Demi-finale', start: '2026-10-25', end: '2026-10-25' },
    { id: 'finale', name: 'Finale', start: '2026-12-24', end: '2026-12-24' },
  ],
  2025: [
    { id: 'preliminaire', name: 'Préliminaire', start: '2025-08-17', end: '2025-08-17' },
    { id: 'preselection', name: 'Présélection', start: '2025-09-07', end: '2025-09-07' },
    { id: 'demi-finale', name: 'Demi-finale', start: '2025-10-19', end: '2025-10-19' },
    { id: 'finale', name: 'Finale', start: '2025-12-24', end: '2025-12-24' },
  ],
  2024: [
    { id: 'preliminaire', name: 'Préliminaire', start: '2024-08-18', end: '2024-08-18' },
    { id: 'finale', name: 'Finale', start: '2024-12-24', end: '2024-12-24' },
  ],
};

const first = ['Prince', 'Grâce', 'Emmanuel', 'Divine', 'Josué', 'Esther', 'Caleb', 'Rébecca', 'Samuel', 'Miriam', 'David', 'Ruth', 'Élie', 'Déborah', 'Gédéon', 'Naomi', 'Timothée', 'Lydie'];
const last = ['Akakpo', 'Houngbo', 'Sossou', 'Dossa', 'Agbo', 'Kiki', 'Zinsou', 'Adjovi', 'Gnonlonfoun', 'Tossou', 'Ahyi', 'Fanou'];
const parishes = ['Sion, Porto-Novo', 'Jéricho, Cotonou', 'Béthel, Calavi', 'Alpha Oméga, Lokossa', 'Canaan, Bohicon', 'Emmanuel, Ouidah'];
const cats: YouthCategory[] = ['Enfants', 'Adolescents', 'Jeunes'];

function seed(...parts: (string | number)[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
}

/** Candidats fictifs ; les phases futures n'ont pas encore de note. */
export function candidatesFor(year: number): Candidate[] {
  const phases = phasesByYear[year] ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return Array.from({ length: 18 }, (_, i) => {
    const k = seed(year, i);
    const scores: Record<string, number | null> = {};
    let eliminated = false;
    phases.forEach((p, pi) => {
      const done = p.start <= today;
      const pass = (seed(year, i, p.id) % 100) > 25 + pi * 15;
      scores[p.id] = done && !eliminated ? 40 + (seed(year, i, p.id, 's') % 60) : null;
      if (done && !pass) eliminated = true;
    });
    return {
      id: `EAJ-${year}-${String(i + 1).padStart(3, '0')}`,
      firstName: first[k % first.length],
      lastName: last[(k >> 4) % last.length],
      parish: `Paroisse ${parishes[(k >> 7) % parishes.length]}`,
      category: cats[(k >> 10) % 3],
      scores,
    };
  });
}

export interface QuizQuestion {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

/** Questions de démonstration (culture biblique générale). */
export const quizQuestions: QuizQuestion[] = [
  { q: 'Combien de livres compte la Bible protestante ?', choices: ['39', '66', '73', '27'], answer: 1, explain: '39 livres dans l’Ancien Testament et 27 dans le Nouveau.' },
  { q: 'Quel est le premier livre de la Bible ?', choices: ['Exode', 'Matthieu', 'Genèse', 'Psaumes'], answer: 2, explain: 'La Genèse raconte les origines.' },
  { q: 'Combien d’évangiles compte le Nouveau Testament ?', choices: ['Trois', 'Quatre', 'Cinq', 'Deux'], answer: 1, explain: 'Matthieu, Marc, Luc et Jean.' },
  { q: 'En quelle année l’Église a-t-elle été fondée ?', choices: ['1932', '1947', '1960', '1975'], answer: 1, explain: 'L’Église a été fondée en 1947.' },
  { q: 'Dans quelle ville l’Église est-elle née ?', choices: ['Cotonou', 'Lagos', 'Porto-Novo', 'Ouidah'], answer: 2, explain: 'L’Église est née à Porto-Novo.' },
  { q: 'Quel livre contient 150 chapitres ?', choices: ['Proverbes', 'Psaumes', 'Ésaïe', 'Jérémie'], answer: 1, explain: 'Le livre des Psaumes compte 150 chapitres.' },
  { q: 'Quel est le dernier livre de la Bible ?', choices: ['Jude', 'Actes', 'Apocalypse', 'Hébreux'], answer: 2, explain: 'L’Apocalypse clôt le Nouveau Testament.' },
  { q: 'Combien de commandements Moïse a-t-il reçus ?', choices: ['Sept', 'Dix', 'Douze', 'Quarante'], answer: 1, explain: 'Les dix commandements (Exode 20).' },
  { q: 'Qui a construit l’arche selon la Genèse ?', choices: ['Abraham', 'Moïse', 'Noé', 'David'], answer: 2, explain: 'Noé, avant le déluge.' },
  { q: 'Combien d’apôtres Jésus a-t-il choisis ?', choices: ['Sept', 'Dix', 'Douze', 'Soixante-dix'], answer: 2, explain: 'Les douze apôtres.' },
];
