export type TranslationLanguage = "en" | "fr" | "es" | "yo" | "fon" | "gou";

const supportedLanguages: TranslationLanguage[] = ["en", "fr", "es", "yo", "fon", "gou"];

const aliases: Record<string, TranslationLanguage> = {
  english: "en",
  anglais: "en",
  french: "fr",
  francais: "fr",
  francais2: "fr",
  spanish: "es",
  espagnol: "es",
  yoruba: "yo",
  fon: "fon",
  fongbe: "fon",
  gou: "gou",
  goun: "gou",
  gengbe: "gou",
};

const phraseBook: Record<TranslationLanguage, Record<string, string>> = {
  en: {
    annonce: "announcement",
    annonces: "announcements",
    avec: "with",
    au: "at the",
    aux: "to the",
    bible: "Bible",
    bonjour: "hello",
    cantique: "song",
    cantiques: "songs",
    ce: "this",
    cela: "that",
    cette: "this",
    chapitre: "chapter",
    chapitres: "chapters",
    conseil: "council",
    copiez: "copy",
    cotonou: "Cotonou",
    cours: "during",
    dans: "in",
    de: "of",
    des: "of the",
    dieu: "God",
    du: "of the",
    eglise: "church",
    enregistre: "saved",
    enseignement: "teaching",
    enseignements: "teachings",
    esperance: "hope",
    est: "is",
    et: "and",
    faites: "do",
    fait: "done",
    fidele: "faithful",
    fideles: "faithful",
    foi: "faith",
    histoire: "history",
    ici: "here",
    installation: "installation",
    installes: "installed",
    je: "I",
    jour: "day",
    jours: "days",
    la: "the",
    le: "the",
    les: "the",
    ma: "my",
    membres: "members",
    message: "message",
    mon: "my",
    monde: "world",
    nous: "we",
    notre: "our",
    paroisse: "parish",
    paroisses: "parishes",
    pour: "for",
    presse: "clipboard",
    priere: "prayer",
    programme: "program",
    publication: "post",
    que: "that",
    qui: "who",
    reunification: "reunification",
    reste: "remains",
    samedi: "Saturday",
    semaine: "week",
    soit: "be",
    sur: "on",
    superieur: "higher",
    theme: "theme",
    tout: "everyone",
    transition: "transition",
    un: "a",
    une: "a",
    vous: "you",
    votre: "your",
  },
  fr: {
    announcement: "annonce",
    announcements: "annonces",
    bible: "Bible",
    chapter: "chapitre",
    chapters: "chapitres",
    church: "eglise",
    faith: "foi",
    history: "histoire",
    message: "message",
    parish: "paroisse",
    parishes: "paroisses",
    prayer: "priere",
    program: "programme",
    song: "chant",
    songs: "chants",
    teaching: "enseignement",
    teachings: "enseignements",
    theme: "theme",
    week: "semaine",
  },
  es: {
    announcement: "anuncio",
    announcements: "anuncios",
    bible: "Biblia",
    chapter: "capitulo",
    chapters: "capitulos",
    church: "iglesia",
    faith: "fe",
    history: "historia",
    message: "mensaje",
    parish: "parroquia",
    parishes: "parroquias",
    prayer: "oracion",
    program: "programa",
    song: "canto",
    songs: "cantos",
    teaching: "ensenanza",
    teachings: "ensenanzas",
    theme: "tema",
    week: "semana",
  },
  yo: {
    announcement: "ikede",
    announcements: "awon ikede",
    bible: "Bibeli",
    chapter: "ori",
    chapters: "awon ori",
    church: "ijo",
    faith: "igbagbo",
    history: "itan",
    message: "ifiranse",
    parish: "parishi",
    parishes: "awon parishi",
    prayer: "adura",
    program: "eto",
    song: "orin",
    songs: "awon orin",
    teaching: "eko",
    teachings: "awon eko",
    theme: "akori",
    week: "ose",
  },
  fon: {
    announcement: "nukunnumaton",
    announcements: "nukunnumatonwo",
    bible: "Biblu",
    chapter: "akpa",
    chapters: "akpawo",
    church: "egbe",
    faith: "xomese",
    history: "xweta",
    message: "gbehan",
    parish: "parisi",
    parishes: "parisiwo",
    prayer: "gbesa",
    program: "doton",
    song: "han",
    songs: "hanwo",
    teaching: "nupinplon",
    teachings: "nupinplonwo",
    theme: "ta",
    week: "sunu",
  },
  gou: {
    announcement: "yinkon",
    announcements: "yinkonwo",
    bible: "Biblu",
    chapter: "akpa",
    chapters: "akpawo",
    church: "egbe",
    faith: "xomese",
    history: "xweta",
    message: "gbehan",
    parish: "parisi",
    parishes: "parisiwo",
    prayer: "gbesa",
    program: "doton",
    song: "han",
    songs: "hanwo",
    teaching: "nupinplon",
    teachings: "nupinplonwo",
    theme: "ta",
    week: "sunu",
  },
};

const phraseTranslations: Partial<Record<TranslationLanguage, Partial<Record<TranslationLanguage, Record<string, string>>>>> = {
  en: {
    fr: {
      "bienvenue dans le presse papiers gboard": "welcome to the Gboard clipboard",
      "bienvenue dans le presse papiers gboard le texte que vous copiez est enregistre ici": "welcome to the Gboard clipboard. The text you copy is saved here",
      "bonjour tout le monde": "hello everyone",
      "conseil superieur de transition": "High Council of Transition",
      "dieu reste fidele": "God remains faithful",
      "eglise du christianisme celeste": "Celestial Church of Christ",
      "installation des 15 membres du conseil superieur de transition de l eglise du christianisme celeste": "installation of the 15 members of the Celestial Church of Christ High Council of Transition",
      "installation des 15 membres du conseil superieur de transition de l eglise du christianisme celeste une etape decisive vers la reunification": "installation of the 15 members of the Celestial Church of Christ High Council of Transition: a decisive step toward reunification",
      "le texte que vous copiez est enregistre ici": "the text you copy is saved here",
      "le samedi 26 avril 2025": "on Saturday, April 26, 2025",
      "les quinze membres du conseil superieur de transition de l eglise du christianisme celeste ont ete officiellement installes": "the fifteen members of the Celestial Church of Christ High Council of Transition were officially installed",
      "au cours d une ceremonie solennelle a cotonou": "during a solemn ceremony in Cotonou",
      "le samedi 26 avril 2025 les quinze membres du conseil superieur de transition de l eglise du christianisme celeste ont ete officiellement installes au cours d une ceremonie solennelle a cotonou": "on Saturday, April 26, 2025, the fifteen members of the Celestial Church of Christ High Council of Transition were officially installed during a solemn ceremony in Cotonou",
      "que tout ce que vous faites soit fait avec amour": "let all that you do be done in love",
      "une etape decisive vers la reunification": "a decisive step toward reunification",
      "un film inspirant qui parle de foi": "an inspiring film about faith",
      "une serie qui explore le parcours de foi": "a series that explores the journey of faith",
      "voir tous les episodes": "see all episodes",
      "regarder maintenant": "watch now",
      "ecouter maintenant": "listen now",
    },
  },
  es: {
    fr: {
      "bienvenue dans le presse papiers gboard": "bienvenido al portapapeles de Gboard",
      "bienvenue dans le presse papiers gboard le texte que vous copiez est enregistre ici": "bienvenido al portapapeles de Gboard. El texto que copies se guardara aqui",
      "bonjour tout le monde": "hola a todos",
      "conseil superieur de transition": "Consejo Superior de Transicion",
      "dieu reste fidele": "Dios permanece fiel",
      "eglise du christianisme celeste": "Iglesia del Cristianismo Celestial",
      "installation des 15 membres du conseil superieur de transition de l eglise du christianisme celeste": "instalacion de los 15 miembros del Consejo Superior de Transicion de la Iglesia del Cristianismo Celestial",
      "installation des 15 membres du conseil superieur de transition de l eglise du christianisme celeste une etape decisive vers la reunification": "instalacion de los 15 miembros del Consejo Superior de Transicion de la Iglesia del Cristianismo Celestial: una etapa decisiva hacia la reunificacion",
      "le texte que vous copiez est enregistre ici": "el texto que copies se guardara aqui",
      "le samedi 26 avril 2025": "el sabado 26 de abril de 2025",
      "les quinze membres du conseil superieur de transition de l eglise du christianisme celeste ont ete officiellement installes": "los quince miembros del Consejo Superior de Transicion de la Iglesia del Cristianismo Celestial fueron instalados oficialmente",
      "au cours d une ceremonie solennelle a cotonou": "durante una ceremonia solemne en Cotonou",
      "le samedi 26 avril 2025 les quinze membres du conseil superieur de transition de l eglise du christianisme celeste ont ete officiellement installes au cours d une ceremonie solennelle a cotonou": "el sabado 26 de abril de 2025, los quince miembros del Consejo Superior de Transicion de la Iglesia del Cristianismo Celestial fueron instalados oficialmente durante una ceremonia solemne en Cotonou",
      "que tout ce que vous faites soit fait avec amour": "que todo lo que hagan sea hecho con amor",
      "une etape decisive vers la reunification": "una etapa decisiva hacia la reunificacion",
      "un film inspirant qui parle de foi": "una pelicula inspiradora sobre la fe",
      "une serie qui explore le parcours de foi": "una serie que explora el camino de la fe",
      "voir tous les episodes": "ver todos los episodios",
      "regarder maintenant": "ver ahora",
      "ecouter maintenant": "escuchar ahora",
    },
  },
  fr: {
    en: {
      "god remains faithful": "Dieu reste fidele",
      "hello everyone": "Bonjour tout le monde",
      "let all that you do be done in love": "que tout ce que vous faites soit fait avec amour",
      "listen now": "ecouter maintenant",
      "see all episodes": "voir tous les episodes",
      "watch now": "regarder maintenant",
    },
  },
};

export function normalizeTranslationLanguage(value?: string | null): TranslationLanguage {
  const raw = String(value || "fr").trim().toLowerCase();
  const base = raw.split(/[-_]/)[0];
  if (supportedLanguages.includes(raw as TranslationLanguage)) return raw as TranslationLanguage;
  if (supportedLanguages.includes(base as TranslationLanguage)) return base as TranslationLanguage;
  return aliases[raw] || aliases[base] || "fr";
}

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectContentLanguage(text?: string | null): TranslationLanguage {
  const value = String(text || "").toLowerCase();
  if (!value.trim()) return "fr";
  const comparable = normalizeComparable(value);
  if (/\b(bonjour|dieu|tout|monde|eglise|foi|priere|avec|pour|dans|sur|une|des|cette)\b/i.test(comparable)) return "fr";
  const scores: Record<TranslationLanguage, number> = { en: 0, fr: 0, es: 0, yo: 0, fon: 0, gou: 0 };
  const hints: Record<TranslationLanguage, string[]> = {
    en: ["the", "and", "faith", "church", "prayer", "with", "for", "this", "that", "hello", "today"],
    fr: ["le", "la", "les", "eglise", "foi", "priere", "avec", "pour"],
    es: ["el", "la", "los", "iglesia", "fe", "oracion", "para", "con"],
    yo: ["ati", "olorun", "adura", "ijo", "igbagbo", "awon", "fun"],
    fon: ["mawu", "egbe", "gbesa", "xomese", "nado"],
    gou: ["mawu", "egbe", "gbesa", "xomese", "nado"],
  };
  Object.entries(hints).forEach(([lang, words]) => {
    words.forEach((word) => {
      if (new RegExp(`\\b${word}\\b`, "i").test(comparable)) scores[lang as TranslationLanguage] += 1;
    });
  });
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] as [TranslationLanguage, number] | undefined;
  return best && best[1] > 0 ? best[0] : "fr";
}

function preserveCase(source: string, translated: string) {
  if (!source) return translated;
  if (source.toUpperCase() === source) return translated.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return translated.charAt(0).toUpperCase() + translated.slice(1);
  return translated;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyPhraseTranslations(text: string, targetLang: TranslationLanguage, sourceLang: TranslationLanguage) {
  const phrases = phraseTranslations[targetLang]?.[sourceLang];
  if (!phrases) return text;
  return Object.entries(phrases)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((next, [sourcePhrase, targetPhrase]) => {
      const pattern = new RegExp(`\\b${escapeRegExp(sourcePhrase)}\\b`, "giu");
      const normalizedPattern = new RegExp(`\\b${escapeRegExp(normalizeComparable(sourcePhrase))}\\b`, "giu");
      return next
        .replace(pattern, (match) => preserveCase(match, targetPhrase))
        .replace(normalizedPattern, (match) => preserveCase(match, targetPhrase));
    }, text);
}

function exactNormalizedPhraseTranslation(text: string, targetLang: TranslationLanguage, sourceLang: TranslationLanguage) {
  const phrases = phraseTranslations[targetLang]?.[sourceLang];
  if (!phrases) return "";
  const normalizedText = normalizeComparable(text);
  const match = Object.entries(phrases).find(([sourcePhrase]) => normalizeComparable(sourcePhrase) === normalizedText);
  return match?.[1] || "";
}

function translationCoverage(original: string, translated: string) {
  const originalWords = normalizeComparable(original).match(/[\p{L}\p{N}']+/gu) || [];
  const translatedWords = normalizeComparable(translated).match(/[\p{L}\p{N}']+/gu) || [];
  if (!originalWords.length) return 1;
  let changed = 0;
  originalWords.forEach((word, index) => {
    if (translatedWords[index] && translatedWords[index] !== word) changed += 1;
  });
  return changed / originalWords.length;
}

function shouldUseTranslation(original: string, translated: string) {
  if (translated === original) return false;
  const wordCount = (normalizeComparable(original).match(/[\p{L}\p{N}']+/gu) || []).length;
  if (wordCount <= 3) return true;
  return translationCoverage(original, translated) >= 0.72;
}

export function translatePlainTextEmbedded(text?: string | null, target?: string | null, source?: string | null) {
  const original = String(text || "");
  const targetLang = normalizeTranslationLanguage(target);
  const sourceLang = source && source !== "auto" ? normalizeTranslationLanguage(source) : detectContentLanguage(original);
  if (!original.trim()) return { translatedText: "", sourceLang, targetLang, changed: false };
  if (targetLang === sourceLang) return { translatedText: original, sourceLang, targetLang, changed: false };

  const exactPhrase = exactNormalizedPhraseTranslation(original, targetLang, sourceLang);
  if (exactPhrase) return { translatedText: preserveCase(original, exactPhrase), sourceLang, targetLang, changed: true };

  const dictionary = phraseBook[targetLang] || {};
  const phraseTranslated = applyPhraseTranslations(original, targetLang, sourceLang);
  const translated = phraseTranslated.replace(/\b[\p{L}'’.-]+\b/gu, (word) => {
    const normalized = normalizeComparable(word);
    const direct = dictionary[word.toLowerCase()] || dictionary[normalized];
    return direct ? preserveCase(word, direct) : word;
  });
  const finalText = shouldUseTranslation(original, translated) ? translated : original;
  return { translatedText: finalText, sourceLang, targetLang, changed: finalText !== original };
}
