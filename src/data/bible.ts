export type Testament = 'ancien' | 'nouveau';
export type BibleLang = 'fr' | 'en' | 'yo' | 'goun';

export interface BibleBook {
  slug: string;
  name: string;
  testament: Testament;
  chapters: number;
}

const ot: [string, string, number][] = [
  ['genese', 'Genèse', 50], ['exode', 'Exode', 40], ['levitique', 'Lévitique', 27], ['nombres', 'Nombres', 36], ['deuteronome', 'Deutéronome', 34],
  ['josue', 'Josué', 24], ['juges', 'Juges', 21], ['ruth', 'Ruth', 4], ['1-samuel', '1 Samuel', 31], ['2-samuel', '2 Samuel', 24],
  ['1-rois', '1 Rois', 22], ['2-rois', '2 Rois', 25], ['1-chroniques', '1 Chroniques', 29], ['2-chroniques', '2 Chroniques', 36], ['esdras', 'Esdras', 10],
  ['nehemie', 'Néhémie', 13], ['esther', 'Esther', 10], ['job', 'Job', 42], ['psaumes', 'Psaumes', 150], ['proverbes', 'Proverbes', 31],
  ['ecclesiaste', 'Ecclésiaste', 12], ['cantique', 'Cantique des cantiques', 8], ['esaie', 'Ésaïe', 66], ['jeremie', 'Jérémie', 52], ['lamentations', 'Lamentations', 5],
  ['ezechiel', 'Ézéchiel', 48], ['daniel', 'Daniel', 12], ['osee', 'Osée', 14], ['joel', 'Joël', 3], ['amos', 'Amos', 9],
  ['abdias', 'Abdias', 1], ['jonas', 'Jonas', 4], ['michee', 'Michée', 7], ['nahum', 'Nahum', 3], ['habacuc', 'Habacuc', 3],
  ['sophonie', 'Sophonie', 3], ['aggee', 'Aggée', 2], ['zacharie', 'Zacharie', 14], ['malachie', 'Malachie', 4],
];
const nt: [string, string, number][] = [
  ['matthieu', 'Matthieu', 28], ['marc', 'Marc', 16], ['luc', 'Luc', 24], ['jean', 'Jean', 21], ['actes', 'Actes', 28],
  ['romains', 'Romains', 16], ['1-corinthiens', '1 Corinthiens', 16], ['2-corinthiens', '2 Corinthiens', 13], ['galates', 'Galates', 6], ['ephesiens', 'Éphésiens', 6],
  ['philippiens', 'Philippiens', 4], ['colossiens', 'Colossiens', 4], ['1-thessaloniciens', '1 Thessaloniciens', 5], ['2-thessaloniciens', '2 Thessaloniciens', 3], ['1-timothee', '1 Timothée', 6],
  ['2-timothee', '2 Timothée', 4], ['tite', 'Tite', 3], ['philemon', 'Philémon', 1], ['hebreux', 'Hébreux', 13], ['jacques', 'Jacques', 5],
  ['1-pierre', '1 Pierre', 5], ['2-pierre', '2 Pierre', 3], ['1-jean', '1 Jean', 5], ['2-jean', '2 Jean', 1], ['3-jean', '3 Jean', 1],
  ['jude', 'Jude', 1], ['apocalypse', 'Apocalypse', 22],
];

export const bibleBooks: BibleBook[] = [
  ...ot.map(([slug, name, chapters]) => ({ slug, name, chapters, testament: 'ancien' as const })),
  ...nt.map(([slug, name, chapters]) => ({ slug, name, chapters, testament: 'nouveau' as const })),
];

export const bibleLanguages: { id: BibleLang; label: string; short: string }[] = [
  { id: 'fr', label: 'Français', short: 'FR' },
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'yo', label: 'Yoruba', short: 'YO' },
  { id: 'goun', label: 'Goun', short: 'GN' },
];

export function getBook(slug: string) {
  return bibleBooks.find((b) => b.slug === slug);
}

/* ───────── Texte de démonstration (généré, déterministe) ───────── */

const frStarts = ['Heureux celui qui', 'Le Seigneur', 'Voici, le peuple', 'Dans la lumière, celui qui', 'Que la paix', 'Car la parole', 'Ainsi, mes frères, celui qui', 'Au matin, le serviteur'];
const frMiddles = ['marche dans la droiture', 'garde la promesse', 'cherche la sagesse', 'écoute avec un cœur humble', 'demeure fidèle', 'se tient dans la prière', 'partage le pain', 'chante la louange'];
const frEnds = ['et trouve le repos.', 'jusqu’à la fin des temps.', 'au milieu de l’assemblée.', 'comme une source qui ne tarit pas.', 'car sa bonté est grande.', 'et la joie remplit sa maison.', 'devant toutes les nations.', 'dans la paix du soir.'];
const enStarts = ['Blessed is the one who', 'The Lord', 'Behold, the people', 'In the light, the one who', 'May peace', 'For the word', 'So, brothers, the one who', 'In the morning, the servant'];
const enMiddles = ['walks in uprightness', 'keeps the promise', 'seeks wisdom', 'listens with a humble heart', 'remains faithful', 'stands in prayer', 'shares the bread', 'sings praise'];
const enEnds = ['and finds rest.', 'until the end of days.', 'in the midst of the assembly.', 'like a spring that never fails.', 'for his kindness is great.', 'and joy fills the house.', 'before all the nations.', 'in the peace of the evening.'];

function seed(...parts: (string | number)[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
}

/** Nombre de versets (fictif mais stable) d'un chapitre. */
export function verseCount(book: string, chapter: number) {
  return 10 + (seed(book, chapter) % 21);
}

/**
 * Renvoie les versets d'un chapitre. Démo : le texte est généré.
 * L'anglais n'existe que pour le Nouveau Testament, le yoruba et le goun ne sont pas encore disponibles,
 * afin d'illustrer l'état « chapitre indisponible dans cette langue ».
 */
export function getChapter(bookSlug: string, chapter: number, lang: BibleLang): string[] | null {
  const book = getBook(bookSlug);
  if (!book || chapter < 1 || chapter > book.chapters) return null;
  if (lang === 'yo' || lang === 'goun') return null;
  if (lang === 'en' && book.testament === 'ancien') return null;
  const [s, m, e] = lang === 'en' ? [enStarts, enMiddles, enEnds] : [frStarts, frMiddles, frEnds];
  return Array.from({ length: verseCount(bookSlug, chapter) }, (_, i) => {
    const k = seed(bookSlug, chapter, i);
    return `${s[k % s.length]} ${m[(k >> 3) % m.length]} ${e[(k >> 6) % e.length]}`;
  });
}

export function nextChapter(slug: string, chapter: number): { slug: string; chapter: number } | null {
  const i = bibleBooks.findIndex((b) => b.slug === slug);
  const book = bibleBooks[i];
  if (!book) return null;
  if (chapter < book.chapters) return { slug, chapter: chapter + 1 };
  const next = bibleBooks[i + 1];
  return next ? { slug: next.slug, chapter: 1 } : null;
}

export function prevChapter(slug: string, chapter: number): { slug: string; chapter: number } | null {
  const i = bibleBooks.findIndex((b) => b.slug === slug);
  if (i < 0) return null;
  if (chapter > 1) return { slug, chapter: chapter - 1 };
  const prev = bibleBooks[i - 1];
  return prev ? { slug: prev.slug, chapter: prev.chapters } : null;
}
