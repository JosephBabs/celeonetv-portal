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
};

const mapDocs = <T,>(snap: Awaited<ReturnType<typeof getDocs>>): T[] =>
  snap.docs.map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) } as T));

export const loadProgramBundle = async (): Promise<ProgramBundle> => {
  const [yearsSnap, monthsSnap, weeksSnap, servicesSnap, hymnSnap, celebrationsSnap, schedulesSnap] = await Promise.all([
    getDocs(collection(db, "spiritual_years")),
    getDocs(collection(db, "spiritual_months")),
    getDocs(collection(db, "spiritual_weeks")),
    getDocs(collection(db, "spiritual_services")),
    getDocs(collection(db, "hymn_programs")),
    getDocs(collection(db, "special_celebrations")),
    getDocs(collection(db, "service_schedules")),
  ]);

  return {
    years: mapDocs<SpiritualYear>(yearsSnap).sort((a, b) => Number(b.yearName || 0) - Number(a.yearName || 0)),
    months: mapDocs<SpiritualMonth>(monthsSnap).sort((a, b) => Number(a.orderIndex || 99) - Number(b.orderIndex || 99)),
    weeks: mapDocs<SpiritualWeek>(weeksSnap).sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || ""))),
    services: mapDocs<SpiritualService>(servicesSnap).sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)),
    hymnPrograms: mapDocs<HymnProgram>(hymnSnap),
    celebrations: mapDocs<SpiritualCelebration>(celebrationsSnap)
      .map((item) => ({ ...item, category: item.category || item.type || "custom" }))
      .sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || ""))),
    schedules: mapDocs<ServiceScheduleItem>(schedulesSnap).sort((a, b) => `${a.dayName || ""} ${a.time || ""}`.localeCompare(`${b.dayName || ""} ${b.time || ""}`)),
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
