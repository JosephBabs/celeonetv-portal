import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export type PublishStatus = "draft" | "scheduled" | "published";
export type ServiceType =
  | "wednesday_service"
  | "friday_service"
  | "sunday_morning"
  | "sunday_evening"
  | "first_thursday"
  | "special_service";

export type SpiritualYear = {
  id: string;
  yearName: string;
  description?: string;
  status?: PublishStatus | "archived";
  orderIndex?: number;
};

export type SpiritualMonth = {
  id: string;
  yearId: string;
  monthName: string;
  description?: string;
  orderIndex?: number;
};

export type HymnEntry = {
  hymnNumber?: string;
  hymnTitle?: string;
  language?: string;
  notes?: string;
};

export type HymnProgram = {
  id: string;
  title: string;
  weekId?: string | null;
  serviceId?: string | null;
  openingHymn?: HymnEntry | null;
  worshipHymn?: HymnEntry | null;
  meditationHymn?: HymnEntry | null;
  choirHymn?: HymnEntry | null;
  offeringHymn?: HymnEntry | null;
  closingHymn?: HymnEntry | null;
  specialHymn?: HymnEntry | null;
  notes?: string;
  status?: PublishStatus;
};

export type SpiritualWeek = {
  id: string;
  yearId: string;
  monthId: string;
  weekNumber: number;
  title: string;
  description?: string;
  bibleTheme?: string;
  verses?: string[];
  scriptureReferences?: string[];
  startDate: string;
  endDate: string;
  coverImage?: string;
  notes?: string;
  hymnProgramId?: string | null;
  status?: PublishStatus;
  isActive?: boolean;
  isPublished?: boolean;
  createdBy?: string;
};

export type SpiritualService = {
  id: string;
  weekId: string;
  serviceType: ServiceType;
  serviceName: string;
  date: string;
  time: string;
  theme?: string;
  scriptureReferences?: string[];
  preacher?: string;
  notes?: string;
  hymnProgramId?: string | null;
};

export type SpiritualCelebration = {
  id: string;
  weekId?: string | null;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  serviceTimes?: string[];
  bibleTheme?: string;
  verses?: string[];
  scriptureReferences?: string[];
  image?: string;
  category?: string;
  type?: string;
  hymnProgramId?: string | null;
  notes?: string;
  status?: PublishStatus;
  isPublished?: boolean;
};

export type ServiceScheduleItem = {
  id: string;
  dayName: string;
  time: string;
  label?: string;
  isRegular?: boolean;
};

export type LocalizedText = {
  fr?: string;
  en?: string;
  goun?: string;
  yo?: string;
  fon?: string;
  es?: string;
};

export type WeeklyTheme = {
  id: string;
  year?: number;
  monthNumber?: number;
  monthName?: string;
  weekNumber?: number;
  title?: string;
  theme?: string;
  titleTranslations?: LocalizedText;
  description?: string;
  content?: string;
  descriptionTranslations?: LocalizedText;
  bibleTheme?: string;
  bibleReference?: string;
  reference?: string;
  bibleThemeTranslations?: LocalizedText;
  verses?: string[];
  scriptureReferences?: string[];
  startDate?: string;
  endDate?: string;
  weekStart?: string;
  weekEnd?: string;
  status?: PublishStatus | "archived" | "active";
  isActive?: boolean;
  isPublished?: boolean;
  generatedKey?: string;
};

export type WeeklyThemeEventDay = {
  id: string;
  weekId: string;
  title?: string;
  titleTranslations?: LocalizedText;
  dayKey?: string;
  dayOfWeek?: string;
  date?: string;
  time?: string;
  serviceDate?: string;
  serviceTime?: string;
  serviceType?: "normal_weekly_service" | "first_thursday" | "special_celebration" | "manual_extra_service" | string;
  bibleTheme?: string;
  bibleLesson?: string;
  bibleReadingText?: string;
  memoryVerse?: string;
  sermonNote?: string;
  bibleThemeTranslations?: LocalizedText;
  verses?: string[];
  scriptureReferences?: string[];
  hymns?: string[];
  specialCelebrationId?: string;
  status?: PublishStatus | "archived" | "active";
  generatedKey?: string;
};

export type WeeklyThemeHymn = {
  id: string;
  weekId: string;
  dayKey?: string;
  date?: string;
  hymnNumber?: number;
  title?: string;
  time?: string;
  notes?: string;
};

export type ResolvedThemeWeek = WeeklyTheme & {
  year: number;
  monthNumber: number;
  monthName: string;
  weekNumber: number;
  title: string;
  description: string;
  bibleTheme: string;
  verses: string[];
  scriptureReferences: string[];
  startDate: string;
  endDate: string;
  eventDays: WeeklyThemeEventDay[];
  hymns: WeeklyThemeHymn[];
};

export type ResolvedWeek = SpiritualWeek & {
  year?: SpiritualYear | null;
  month?: SpiritualMonth | null;
  services: SpiritualService[];
  hymnProgram?: HymnProgram | null;
};

export type ProgramBundle = {
  years: SpiritualYear[];
  months: SpiritualMonth[];
  weeks: SpiritualWeek[];
  services: SpiritualService[];
  hymnPrograms: HymnProgram[];
  celebrations: SpiritualCelebration[];
  schedules: ServiceScheduleItem[];
  themeWeeks: WeeklyTheme[];
  eventDays: WeeklyThemeEventDay[];
  hymns: WeeklyThemeHymn[];
};

const mapDocs = <T,>(snap: Awaited<ReturnType<typeof getDocs>>): T[] =>
  snap.docs.map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) } as T));

const safeGetDocs = async (path: string) => {
  try {
    return await getDocs(collection(db, path));
  } catch (error: any) {
    if (String(error?.code || "") === "permission-denied") {
      console.warn(`Skipping protected Firestore collection on public portal: ${path}`);
      return null;
    }
    throw error;
  }
};

const toYmd = (value: Date = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateText = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : toYmd(value);
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : toYmd(date);
  }
  if (typeof value === "object" && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === "function") return toYmd(candidate.toDate());
    if (typeof candidate.seconds === "number") return toYmd(new Date(candidate.seconds * 1000));
  }
  return "";
};

export const getLocalizedText = (value: unknown, translations?: LocalizedText, locale = "fr") => {
  const normalized = locale.toLowerCase();
  const fallback =
    typeof value === "string"
      ? value
      : typeof value === "object" && value
        ? (value as LocalizedText).fr || (value as LocalizedText).en || (value as LocalizedText).goun || ""
        : "";
  if (normalized.startsWith("fr") && translations?.fr?.trim()) return translations.fr.trim();
  if (normalized.startsWith("en") && translations?.en?.trim()) return translations.en.trim();
  if (normalized.startsWith("es") && translations?.es?.trim()) return translations.es.trim();
  if (normalized.startsWith("go") && translations?.goun?.trim()) return translations.goun.trim();
  return translations?.fr?.trim() || translations?.en?.trim() || translations?.goun?.trim() || fallback || "";
};

const sortThemeWeeks = <T extends WeeklyTheme>(items: T[]) =>
  [...items].sort(
    (a, b) =>
      Number(b.year || 0) - Number(a.year || 0) ||
      Number(a.weekNumber || 0) - Number(b.weekNumber || 0) ||
      normalizeDateText(a.startDate || a.weekStart).localeCompare(normalizeDateText(b.startDate || b.weekStart))
  );

const sortEventDays = <T extends WeeklyThemeEventDay>(items: T[]) =>
  [...items]
    .map((item) => ({
      ...item,
      date: normalizeDateText(item.date || item.serviceDate),
      dayKey: item.dayKey || item.dayOfWeek || "",
      time: item.time || item.serviceTime || "",
    }))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.time || "").localeCompare(String(b.time || ""))) as T[];

const sortHymns = <T extends WeeklyThemeHymn>(items: T[]) =>
  [...items]
    .map((item) => ({
      ...item,
      date: normalizeDateText(item.date),
      dayKey: item.dayKey || "",
    }))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || Number(a.hymnNumber || 0) - Number(b.hymnNumber || 0)) as T[];

const mergeThemeWeekSources = (primaryWeeks: WeeklyTheme[], legacyWeeks: WeeklyTheme[]) => {
  const byKey = new Map<string, WeeklyTheme>();

  primaryWeeks.forEach((week) => {
    const key = week.generatedKey || week.id || `${week.year}-W${String(week.weekNumber || "").padStart(2, "0")}`;
    byKey.set(key, { ...week, id: key });
  });

  legacyWeeks.forEach((week) => {
    const key = week.generatedKey || week.id || `${week.year}-W${String(week.weekNumber || "").padStart(2, "0")}`;
    byKey.set(key, { ...byKey.get(key), ...week, id: key, generatedKey: key });
  });

  return sortThemeWeeks(Array.from(byKey.values()));
};

const loadThemeWeekBundle = async () => {
  try {
    const [primarySnap, legacySnap, legacyServicesSnap] = await Promise.all([
      getDocs(collection(db, "weekly_themes")),
      getDocs(collection(db, "weeklyThemes")),
      getDocs(collection(db, "weeklyServices")),
    ]);

    const themeWeeks = mergeThemeWeekSources(mapDocs<WeeklyTheme>(primarySnap), mapDocs<WeeklyTheme>(legacySnap));
    const nestedDayGroups = await Promise.all(
      themeWeeks.map(async (week) => {
        const snap = await getDocs(collection(db, "weekly_themes", week.id, "event_days"));
        return mapDocs<WeeklyThemeEventDay>(snap).map((item) => ({ ...item, weekId: week.id }));
      })
    );
    const nestedHymnGroups = await Promise.all(
      themeWeeks.map(async (week) => {
        const snap = await getDocs(collection(db, "weekly_themes", week.id, "hymns"));
        return mapDocs<WeeklyThemeHymn>(snap).map((item) => ({ ...item, weekId: week.id }));
      })
    );

    const nestedEventDays = nestedDayGroups.flat();
    const nestedKeys = new Set(nestedEventDays.map((item) => `${item.weekId}-${item.generatedKey || item.id}`));
    const legacyEventDays = mapDocs<WeeklyThemeEventDay>(legacyServicesSnap)
      .map((item) => ({
        ...item,
        weekId: item.weekId || (item as WeeklyThemeEventDay & { weeklyThemeId?: string }).weeklyThemeId || `${(item as WeeklyTheme & WeeklyThemeEventDay).year}-W${String((item as WeeklyTheme & WeeklyThemeEventDay).weekNumber || "").padStart(2, "0")}`,
      }))
      .filter((item) => !nestedKeys.has(`${item.weekId}-${item.generatedKey || item.id}`));

    return {
      themeWeeks,
      eventDays: sortEventDays([...nestedEventDays, ...legacyEventDays]),
      hymns: sortHymns(nestedHymnGroups.flat()),
    };
  } catch (error) {
    console.error("Failed to load mobile theme-of-week bundle", error);
    return { themeWeeks: [], eventDays: [], hymns: [] };
  }
};

export const loadProgramBundle = async (): Promise<ProgramBundle> => {
  const [yearsSnap, monthsSnap, weeksSnap, servicesSnap, hymnSnap, celebrationsSnap, schedulesSnap, themeBundle] = await Promise.all([
    safeGetDocs("spiritual_years"),
    safeGetDocs("spiritual_months"),
    safeGetDocs("spiritual_weeks"),
    safeGetDocs("spiritual_services"),
    safeGetDocs("hymn_programs"),
    safeGetDocs("special_celebrations"),
    safeGetDocs("service_schedules"),
    loadThemeWeekBundle(),
  ]);

  return {
    years: yearsSnap ? mapDocs<SpiritualYear>(yearsSnap).sort((a, b) => Number(b.yearName || 0) - Number(a.yearName || 0)) : [],
    months: monthsSnap ? mapDocs<SpiritualMonth>(monthsSnap).sort((a, b) => Number(a.orderIndex || 99) - Number(b.orderIndex || 99)) : [],
    weeks: weeksSnap ? mapDocs<SpiritualWeek>(weeksSnap).sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || ""))) : [],
    services: servicesSnap ? mapDocs<SpiritualService>(servicesSnap).sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)) : [],
    hymnPrograms: hymnSnap ? mapDocs<HymnProgram>(hymnSnap) : [],
    celebrations: celebrationsSnap ? mapDocs<SpiritualCelebration>(celebrationsSnap)
      .map((item) => ({ ...item, category: item.category || item.type || "custom" }))
      .sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || ""))) : [],
    schedules: schedulesSnap ? mapDocs<ServiceScheduleItem>(schedulesSnap).sort((a, b) => `${a.dayName || ""} ${a.time || ""}`.localeCompare(`${b.dayName || ""} ${b.time || ""}`)) : [],
    themeWeeks: themeBundle.themeWeeks,
    eventDays: themeBundle.eventDays,
    hymns: themeBundle.hymns,
  };
};

export const resolveWeeks = (bundle: ProgramBundle): ResolvedWeek[] =>
  bundle.weeks.map((week) => ({
    ...week,
    year: bundle.years.find((item) => item.id === week.yearId) || null,
    month: bundle.months.find((item) => item.id === week.monthId) || null,
    services: bundle.services.filter((item) => item.weekId === week.id),
    hymnProgram: bundle.hymnPrograms.find((item) => item.id === week.hymnProgramId || item.weekId === week.id) || null,
  }));

export const getCurrentWeek = (weeks: ResolvedWeek[]) => {
  const today = new Date().toISOString().slice(0, 10);
  return (
    weeks.find((week) => week.isActive) ||
    weeks.find((week) => Boolean(week.isPublished) && week.startDate <= today && week.endDate >= today) ||
    null
  );
};

const normalizeThemeWeek = (week: WeeklyTheme): ResolvedThemeWeek => ({
  ...week,
  year: Number(week.year || new Date().getFullYear()),
  monthNumber: Number(week.monthNumber || 0),
  monthName: week.monthName || "",
  weekNumber: Number(week.weekNumber || 0),
  title: week.title || week.theme || "Theme non defini",
  description: week.description || week.content || "",
  bibleTheme: week.bibleTheme || week.bibleReference || week.reference || "",
  verses: week.verses || [],
  scriptureReferences: week.scriptureReferences || [],
  startDate: normalizeDateText(week.startDate || week.weekStart),
  endDate: normalizeDateText(week.endDate || week.weekEnd || week.startDate || week.weekStart),
  eventDays: [],
  hymns: [],
});

export const resolveThemeWeeks = (bundle: ProgramBundle): ResolvedThemeWeek[] =>
  sortThemeWeeks(bundle.themeWeeks.map(normalizeThemeWeek)).map((week) => ({
    ...week,
    eventDays: sortEventDays(bundle.eventDays.filter((item) => item.weekId === week.id)),
    hymns: sortHymns(bundle.hymns.filter((item) => item.weekId === week.id)),
  }));

export const isThemeWeekVisible = (week: ResolvedThemeWeek | WeeklyTheme) => {
  const status = String(week.status || "").toLowerCase();
  if (status === "archived" || status === "draft") return false;
  return status === "published" || status === "active" || week.isPublished === true || week.isActive === true;
};

export const getCurrentThemeWeek = (weeks: ResolvedThemeWeek[]) => {
  const today = toYmd(new Date());
  return (
    weeks.find((week) => week.startDate <= today && week.endDate >= today && isThemeWeekVisible(week)) ||
    weeks.find((week) => week.startDate <= today && week.endDate >= today) ||
    weeks.find((week) => week.isActive) ||
    null
  );
};

export const createDoc = async (collectionName: string, payload: Record<string, unknown>) => {
  const ref = await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateSimpleDoc = async (collectionName: string, id: string, payload: Record<string, unknown>) => {
  await updateDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSimpleDoc = async (collectionName: string, id: string) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const setActiveWeek = async (weekId: string) => {
  const snap = await getDocs(collection(db, "spiritual_weeks"));
  const batch = writeBatch(db);
  snap.docs.forEach((item) => {
    batch.update(item.ref, {
      isActive: item.id === weekId,
      isPublished: item.id === weekId ? true : item.data().isPublished || false,
      status: item.id === weekId ? "published" : item.data().status || "draft",
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
};
