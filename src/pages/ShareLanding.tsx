/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { openShareInApp, type ShareContentType } from "../lib/deepLinks";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";
import { getLocalizedText } from "../lib/spiritualProgram";

const TYPE_CONFIG: Record<string, { type: ShareContentType; collection: string; label: string; routeTitle: string }> = {
  social: { type: "social", collection: "posts", label: "Social post", routeTitle: "CeleOne Social" },
  hymns: { type: "hymn", collection: "cantiques", label: "Hymn", routeTitle: "CeleOne Hymns" },
  themes: { type: "theme", collection: "weekly_themes", label: "Theme of the week", routeTitle: "CeleOne Theme of the Week" },
  "weekly-themes": { type: "weekly-theme", collection: "weekly_themes", label: "Theme of the week", routeTitle: "CeleOne Theme of the Week" },
  "weekly-programs": { type: "weekly-program", collection: "weeklyPrograms", label: "Weekly program", routeTitle: "CeleOne Weekly Program" },
  videos: { type: "video", collection: "videos", label: "Video", routeTitle: "CeleOne Video" },
  songs: { type: "song", collection: "songs", label: "Song", routeTitle: "CeleOne Song" },
};

export default function ShareLanding() {
  const { t, lang } = useI18n();
  const { contentId = "" } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shareType = location.pathname.split("/").filter(Boolean)[0] || "";
  const cfg = TYPE_CONFIG[shareType];
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [themeDetails, setThemeDetails] = useState<{ eventDays: any[]; hymns: any[] }>({ eventDays: [], hymns: [] });

  const appParams = useMemo(
    () => ({
      language: searchParams.get("language") || undefined,
      moduleId: searchParams.get("moduleId") || undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    const run = async () => {
      if (!cfg || !contentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getThemeAwareDoc(cfg.collection, contentId, cfg.type === "theme" || cfg.type === "weekly-theme");
        const nextItem = snap ? { id: snap.id, ...snap.data } : null;
        setItem(nextItem);
        if (nextItem && (cfg.type === "theme" || cfg.type === "weekly-theme")) {
          setThemeDetails(await loadThemeDetails(nextItem.id));
        } else {
          setThemeDetails({ eventDays: [], hymns: [] });
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [cfg, contentId]);

  useEffect(() => {
    const title = shareTitle(item, lang) || cfg?.routeTitle || "CeleOne";
    const description = shareDescription(item, lang) || t("share.meta_desc", "Open this CeleOne content in the mobile app.");
    const image = shareImage(item) || "https://celeonetv.com/logo.png";
    setPageMeta({
      title,
      description,
      image,
      url: window.location.href,
      type: "article",
      canonicalPath: location.pathname,
    });
  }, [cfg, item, lang, location.pathname, t]);

  if (!cfg) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Content type not supported</div>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;

  const isTheme = cfg.type === "theme" || cfg.type === "weekly-theme";
  const title = shareTitle(item, lang) || cfg.routeTitle;
  const description = shareDescription(item, lang);
  const image = shareImage(item);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <div className="text-sm font-black uppercase tracking-wide text-teal-700">{translatedShareLabel(cfg.type, cfg.label, t)}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <div className="mt-2 text-sm text-teal-900/80">
          {t("share.open_hint", "View this content here first, then open it in the CeleOne mobile app if it is installed on your phone.")}
        </div>
        <button
          onClick={() => openShareInApp(cfg.type, contentId, appParams)}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
        >
          {t("share.open_app", "Open in app")}
        </button>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        {image ? (
          <div className="mb-5 overflow-hidden rounded-lg border border-slate-200">
            <img src={image} className="h-auto w-full" alt={title} />
          </div>
        ) : null}

        {!item ? (
          <div className="text-slate-600">{t("share.not_found", "This content was not found on the portal.")}</div>
        ) : isTheme ? (
          <ThemeShareDetails item={item} details={themeDetails} lang={lang} t={t} />
        ) : (
          <>
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>
            {description ? <p className="mt-3 whitespace-pre-wrap text-slate-700">{description}</p> : null}
            <PreviewDetails item={item} t={t} />
          </>
        )}
      </article>
    </div>
  );
}

async function getThemeAwareDoc(collectionName: string, id: string, isTheme: boolean) {
  const primarySnap = await getDoc(doc(db, collectionName, id));
  if (primarySnap.exists()) return { id: primarySnap.id, data: primarySnap.data() };
  if (!isTheme || collectionName === "weeklyThemes") return null;
  const legacySnap = await getDoc(doc(db, "weeklyThemes", id));
  return legacySnap.exists() ? { id: legacySnap.id, data: legacySnap.data() } : null;
}

async function loadThemeDetails(weekId: string) {
  const empty = { eventDays: [], hymns: [] };
  try {
    const [eventSnap, hymnSnap, legacyWeekSnap, legacyThemeSnap] = await Promise.all([
      getDocs(collection(db, "weekly_themes", weekId, "event_days")).catch(() => null),
      getDocs(collection(db, "weekly_themes", weekId, "hymns")).catch(() => null),
      getDocs(query(collection(db, "weeklyServices"), where("weekId", "==", weekId))).catch(() => null),
      getDocs(query(collection(db, "weeklyServices"), where("weeklyThemeId", "==", weekId))).catch(() => null),
    ]);
    const nestedEvents: any[] = eventSnap?.docs.map((entry) => ({ id: entry.id, weekId, ...entry.data() })) || [];
    const nestedKeys = new Set(nestedEvents.map((entry) => entry.generatedKey || entry.id));
    const legacyEvents = [...(legacyWeekSnap?.docs || []), ...(legacyThemeSnap?.docs || [])]
      .map((entry) => ({ id: entry.id, weekId, ...entry.data() } as any))
      .filter((entry, index, rows) => rows.findIndex((row) => row.id === entry.id) === index)
      .filter((entry) => !nestedKeys.has(entry.generatedKey || entry.id));
    return {
      eventDays: [...nestedEvents, ...legacyEvents].sort(sortServiceLike),
      hymns: (hymnSnap?.docs.map((entry) => ({ id: entry.id, weekId, ...entry.data() })) || []).sort(sortHymnLike),
    };
  } catch {
    return empty;
  }
}

function ThemeShareDetails({ item, details, lang, t }: { item: any; details: { eventDays: any[]; hymns: any[] }; lang: string; t: (key: string, fallback?: string) => string }) {
  const title = localizedValue(item.title || item.theme, item.titleTranslations, lang) || t("share.theme_fallback", "Theme of the week");
  const bibleTheme = localizedValue(item.bibleTheme || item.bibleReference || item.reference || item.description, item.bibleThemeTranslations || item.descriptionTranslations, lang);
  const dateRange = [dateText(item.startDate || item.weekStart), dateText(item.endDate || item.weekEnd)].filter(Boolean).join(" - ");
  const services = details.eventDays.filter((entry) => entry.serviceType !== "special_celebration" && !entry.specialCelebrationId);
  const celebrations = details.eventDays.filter((entry) => entry.serviceType === "special_celebration" || entry.specialCelebrationId);

  return (
    <div>
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">{t("share.theme_week", "Theme of the week")}</div>
        <h2 className="mt-2 break-words text-2xl font-black text-slate-950">{title}</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-slate-600">
          {item.weekNumber ? <span className="rounded-full bg-white px-3 py-1">{t("share.week", "Week")} {item.weekNumber}</span> : null}
          {item.monthName ? <span className="rounded-full bg-white px-3 py-1">{item.monthName}</span> : null}
          {dateRange ? <span className="rounded-full bg-white px-3 py-1">{dateRange}</span> : null}
        </div>
        {bibleTheme ? <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{bibleTheme}</p> : null}
      </div>

      <ThemeSection title={t("share.services_readings", "Services and Bible readings")} empty={t("share.no_services", "No service details are attached yet.")}>
        {services.map((service) => <ThemeServiceCard key={service.id} service={service} lang={lang} t={t} />)}
      </ThemeSection>

      <ThemeSection title={t("share.special_celebrations", "Special celebrations")} empty={t("share.no_celebrations", "No special celebrations are attached yet.")}>
        {celebrations.map((service) => <ThemeServiceCard key={service.id} service={service} lang={lang} t={t} />)}
      </ThemeSection>

      <ThemeSection title={t("share.hymns", "Hymns")} empty={t("share.no_hymns", "No hymns are attached yet.")}>
        {details.hymns.map((hymn) => (
          <div key={hymn.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-black text-slate-900">{hymn.title || `${t("share.hymn", "Hymn")} ${hymn.hymnNumber || ""}`}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{[dateText(hymn.date), hymn.time, hymn.dayKey].filter(Boolean).join(" | ")}</div>
            {hymn.notes ? <div className="mt-2 text-sm text-slate-600">{hymn.notes}</div> : null}
          </div>
        ))}
      </ThemeSection>
    </div>
  );
}

function ThemeSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="mt-6">
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.length ? items : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{empty}</div>}
      </div>
    </section>
  );
}

function ThemeServiceCard({ service, lang, t }: { service: any; lang: string; t: (key: string, fallback?: string) => string }) {
  const title = localizedValue(service.title, service.titleTranslations, lang) || serviceTypeLabel(service.serviceType, t);
  const readings = collectReadings(service, lang);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="font-black text-slate-900">{title}</div>
      <div className="mt-1 text-sm font-semibold text-slate-600">
        {[service.dayOfWeek || service.dayKey, dateText(service.date || service.serviceDate), service.time || service.serviceTime].filter(Boolean).join(" | ")}
      </div>
      {readings.length ? (
        <div className="mt-3 space-y-1 text-sm font-medium leading-7 text-slate-700">
          {readings.map((reading, index) => <div key={`${reading}-${index}`}>{readings.length > 1 ? `${index + 1}. ` : ""}{reading}</div>)}
        </div>
      ) : null}
      {service.memoryVerse ? <div className="mt-2 text-sm font-semibold text-slate-600">{t("share.memory_verse", "Memory verse")}: {service.memoryVerse}</div> : null}
      {service.sermonNote ? <div className="mt-2 text-sm font-semibold text-slate-600">{t("share.note", "Note")}: {service.sermonNote}</div> : null}
    </div>
  );
}

function PreviewDetails({ item, t }: { item: any; t: (key: string, fallback?: string) => string }) {
  const fields = [
    [t("share.number", "Number"), item.hymnNumber || item.number],
    [t("share.language", "Language"), item.language],
    [t("share.date", "Date"), item.date || item.startDate || item.serviceDate],
    [t("share.theme", "Theme"), textValue(item.theme || item.bibleTheme)],
    [t("share.bible", "Bible"), textValue(item.bibleReference || item.bibleLesson || item.bibleReadingText)],
  ].filter(([, value]) => Boolean(value));

  if (!fields.length) return null;

  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
          <dd className="mt-1 font-bold text-slate-900">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function shareTitle(item: any, lang = "fr") {
  return localizedValue(item?.shareTitle || item?.title || item?.name || item?.theme || item?.bibleTheme || item?.hymnTitle, item?.titleTranslations || item?.bibleThemeTranslations, lang);
}

function shareDescription(item: any, lang = "fr") {
  const value = item?.shareDescription || item?.description || item?.content || item?.hymnContent || item?.bibleLesson || item?.bibleReadingText;
  return stripHtml(localizedValue(value, item?.descriptionTranslations || item?.bibleThemeTranslations, lang)).slice(0, 700);
}

function shareImage(item: any) {
  return textValue(item?.shareImage || item?.image || item?.coverUrl || item?.thumbnail || item?.posterUrl);
}

function textValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return textValue(value.fr || value.en || value.default || Object.values(value)[0]);
  return "";
}

function localizedValue(value: any, translations?: any, lang = "fr") {
  return getLocalizedText(value, translations, lang) || textValue(value);
}

function collectReadings(service: any, lang: string) {
  const values = [
    localizedValue(service.bibleLesson || service.bibleTheme, service.bibleThemeTranslations, lang),
    service.bibleReadingText,
    service.scriptureReferences,
    service.verses,
    service.firstReading,
    service.secondReading,
    service.thirdReading,
    service.gospel,
    service.bibleReadings,
    service.readings,
  ];
  const seen = new Set<string>();
  return values.flatMap(splitTextValue).filter((item) => {
    const key = item.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitTextValue(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(splitTextValue);
  if (typeof value === "object") return splitTextValue(textValue(value));
  return String(value).split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
}

function dateText(value: any) {
  const text = textValue(value);
  if (!text) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return text;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function sortServiceLike(a: any, b: any) {
  return String(a.date || a.serviceDate || "").localeCompare(String(b.date || b.serviceDate || "")) ||
    String(a.time || a.serviceTime || "").localeCompare(String(b.time || b.serviceTime || ""));
}

function sortHymnLike(a: any, b: any) {
  return String(a.date || "").localeCompare(String(b.date || "")) || Number(a.hymnNumber || 0) - Number(b.hymnNumber || 0);
}

function serviceTypeLabel(value: any, t: (key: string, fallback?: string) => string) {
  const type = String(value || "");
  if (type === "first_thursday") return t("share.first_thursday", "First Thursday / new moon");
  if (type === "special_celebration") return t("share.special_service", "Special celebration");
  if (type === "sunday_morning") return t("share.sunday_morning", "Sunday morning service");
  if (type === "sunday_evening") return t("share.sunday_evening", "Sunday evening service");
  if (type === "wednesday_service") return t("share.wednesday", "Wednesday service");
  if (type === "friday_service") return t("share.friday", "Friday service");
  return t("share.service", "Service");
}

function translatedShareLabel(type: ShareContentType, fallback: string, t: (key: string, fallback?: string) => string) {
  if (type === "hymn") return t("share.label_hymn", fallback);
  if (type === "theme" || type === "weekly-theme") return t("share.label_theme", fallback);
  if (type === "weekly-program") return t("share.label_program", fallback);
  if (type === "video") return t("share.label_video", fallback);
  if (type === "song") return t("share.label_song", fallback);
  return t("share.label_content", fallback);
}

function stripHtml(value: string) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
