export interface HymnBook {
  id: string;
  label: string;
  short: string;
  max: number;
  /** Proportion de numéros présents (les plages réelles sont incomplètes). */
  density: number;
}

export const hymnBooks: HymnBook[] = [
  { id: 'goun', label: 'Goun', short: 'GN', max: 420, density: 0.86 },
  { id: 'yoruba', label: 'Yoruba', short: 'YO', max: 460, density: 0.9 },
  { id: 'francais', label: 'Français', short: 'FR', max: 300, density: 0.93 },
  { id: 'anglais', label: 'Anglais', short: 'EN', max: 320, density: 0.88 },
];

export const RANGE_SIZE = 42;
const keys = ['Do majeur', 'Ré majeur', 'Mi bémol', 'Fa majeur', 'Sol majeur', 'La mineur', 'Si bémol'];

function seed(...parts: (string | number)[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
}

const cache = new Map<string, number[]>();
export function hymnNumbers(bookId: string): number[] {
  if (cache.has(bookId)) return cache.get(bookId)!;
  const book = hymnBooks.find((b) => b.id === bookId);
  if (!book) return [];
  const list: number[] = [];
  for (let n = 1; n <= book.max; n++) {
    if (n <= RANGE_SIZE || (seed(bookId, n) % 1000) / 1000 < book.density) list.push(n);
  }
  cache.set(bookId, list);
  return list;
}

export function hymnRanges(bookId: string) {
  const nums = hymnNumbers(bookId);
  const max = nums[nums.length - 1] ?? 0;
  const ranges: { id: string; from: number; to: number; numbers: number[] }[] = [];
  for (let from = 1; from <= max; from += RANGE_SIZE) {
    const to = from + RANGE_SIZE - 1;
    const numbers = nums.filter((n) => n >= from && n <= to);
    if (numbers.length) ranges.push({ id: `${from}-${to}`, from, to, numbers });
  }
  return ranges;
}

const titleWords = {
  a: ['Gloire', 'Lumière', 'Louange', 'Paix', 'Grâce', 'Joie', 'Victoire', 'Espérance', 'Alléluia', 'Hosanna'],
  b: ['au Très-Haut', 'd’en haut', 'éternelle', 'du matin', 'du Ciel', 'en Christ', 'de Sion', 'au Roi', 'sans fin', 'des anges'],
};
const enTitle = {
  a: ['Glory', 'Light', 'Praise', 'Peace', 'Grace', 'Joy', 'Victory', 'Hope', 'Hallelujah', 'Hosanna'],
  b: ['on High', 'from Above', 'Eternal', 'of the Morning', 'of Heaven', 'in Christ', 'of Zion', 'to the King', 'Forever', 'of Angels'],
};

export function hymnExists(bookId: string, n: number) {
  return hymnNumbers(bookId).includes(n);
}

export function hymnTitle(bookId: string, n: number) {
  if (bookId === 'goun' && n === 1) return 'Jelimoyamah';
  const k = seed('t', bookId, n);
  const w = bookId === 'anglais' ? enTitle : titleWords;
  if (bookId === 'goun' || bookId === 'yoruba') return `${bookId === 'goun' ? 'Ohàn' : 'Orin'} ${n} · ${w.a[k % 10]} ${w.b[(k >> 4) % 10]}`;
  return `${w.a[k % 10]} ${w.b[(k >> 4) % 10]}`;
}

const lineBank = [
  'Élevons nos voix vers le Seigneur',
  'Sa lumière brille sur nos chemins',
  'Dans la paix nous marchons ensemble',
  'Chantons la joie de son amour',
  'Les anges répondent à nos chants',
  'Sa main nous garde nuit et jour',
  'Que chaque cœur s’ouvre à sa grâce',
  'Nous louerons son nom pour toujours',
  'Le matin se lève avec l’espérance',
  'Sa parole est un refuge sûr',
];
const enBank = [
  'Lift your voices to the Lord',
  'His light is shining on our way',
  'In peace we walk together',
  'Sing the joy of His great love',
  'The angels answer to our song',
  'His hand will keep us night and day',
  'Let every heart receive His grace',
  'We will praise His name forever',
  'The morning rises bright with hope',
  'His word remains a safe abode',
];

export interface HymnDetail {
  book: HymnBook;
  number: number;
  title: string;
  key: string;
  stanzas: string[][];
  refrain: string[];
  hasAudio: boolean;
  hasScore: boolean;
}

/** Paroles de démonstration générées : à remplacer par les recueils officiels. */
export function getHymn(bookId: string, n: number): HymnDetail | null {
  const book = hymnBooks.find((b) => b.id === bookId);
  if (!book || !hymnExists(bookId, n)) return null;
  const bank = bookId === 'anglais' ? enBank : lineBank;
  const k = seed('h', bookId, n);
  const stanzaCount = 2 + (k % 2);
  const stanzas = Array.from({ length: stanzaCount }, (_, s) => {
    const base = seed(bookId, n, s) % bank.length;
    return Array.from({ length: 4 }, (_, l) => bank[(base + l * 3) % bank.length]);
  });
  const r = (k >> 5) % bank.length;
  const refrain = [bank[r], bank[(r + 5) % bank.length]];
  return { book, number: n, title: hymnTitle(bookId, n), key: keys[k % keys.length], stanzas, refrain, hasAudio: n === 1 || k % 7 !== 0, hasScore: k % 3 !== 0 };
}

export function hymnText(h: HymnDetail) {
  const blocks = h.stanzas.map((s, i) => `${i + 1}. ${s.join('\n')}\n\nRefrain :\n${h.refrain.join('\n')}`);
  return `Cantique n° ${h.number} — ${h.title} (${h.book.label})\n\n${blocks.join('\n\n')}`;
}
