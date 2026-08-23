import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  MONTH_NAMES_FR,
  formatLocalDateTime,
  getCurrentThemeWeek,
  getCurrentWeek,
  getLocalizedText,
  isThemeWeekVisible,
  loadProgramBundle,
  resolveThemeWeeks,
  resolveWeeks,
  toYmd,
  weekOverlapsMonth,
  type ProgramBundle,
  type ResolvedThemeWeek,
  type ResolvedWeek,
  type WeeklyThemeEventDay,
} from "../lib/spiritualProgram";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

const emptyBundle: ProgramBundle = {
  years: [],
  months: [],
  weeks: [],
  services: [],
  hymnPrograms: [],
  celebrations: [],
  schedules: [],
  themeWeeks: [],
  eventDays: [],
  hymns: [],
};

const weekKey = (week: ResolvedThemeWeek) =>
  week.generatedKey || week.id || `${week.year}-W${String(week.weekNumber || "").padStart(2, "0")}`;

type MobileFlow = "months" | "weeks" | "content";

export default function SpiritualProgram() {
  const { t, lang } = useI18n();
  const [bundle, setBundle] = useState<ProgramBundle>(emptyBundle);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [mobileFlow, setMobileFlow] = useState<MobileFlow>("months");
  const [localNow, setLocalNow] = useState(() => new Date());

  useEffect(() => {
    setPageMeta({
      title: t("spiritual.meta_title", "Spiritual Program | CeleOne"),
      description: t("spiritual.meta_desc", "Read weekly themes, services, Bible lessons, hymn programs, and special celebrations."),
    });
  }, [t]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        setBundle(await loadProgramBundle());
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const legacyWeeks = useMemo(() => resolveWeeks(bundle), [bundle]);
  const themeWeeks = useMemo(() => resolveThemeWeeks(bundle), [bundle]);
  const visibleThemeWeeks = useMemo(() => themeWeeks.filter(isThemeWeekVisible), [themeWeeks]);
  const hasMobileThemeData = visibleThemeWeeks.length > 0;
  const activeThemeWeeks = hasMobileThemeData ? visibleThemeWeeks : themeWeeks;
  const currentLegacyWeek = useMemo(() => getCurrentWeek(legacyWeeks), [legacyWeeks]);
  const currentThemeWeek = useMemo(
    () => getCurrentThemeWeek(visibleThemeWeeks.length ? visibleThemeWeeks : themeWeeks, localNow),
    [localNow, themeWeeks, visibleThemeWeeks],
  );

  useEffect(() => {
    if (!currentThemeWeek) return;
    setYear(String(currentThemeWeek.year));
    setSelectedMonth(currentThemeWeek.monthNumber || new Date().getMonth() + 1);
    setSelectedWeekId((current) => current || weekKey(currentThemeWeek));
  }, [currentThemeWeek]);

  const yearOptions = useMemo(() => {
    if (activeThemeWeeks.length) {
      return Array.from(new Set(activeThemeWeeks.map((item) => String(item.year)).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    }
    return bundle.years.map((item) => item.yearName);
  }, [activeThemeWeeks, bundle.years]);

  const weeksForYear = useMemo(
    () => activeThemeWeeks.filter((week) => !year || String(week.year) === year),
    [activeThemeWeeks, year],
  );

  const searchQuery = search.trim().toLowerCase();
  const filteredWeeksForYear = useMemo(() => {
    if (!searchQuery) return weeksForYear;
    return weeksForYear.filter((week) => {
      const haystack = [
        getLocalizedText(week.title || week.theme, week.titleTranslations, lang),
        getLocalizedText(week.description, week.descriptionTranslations, lang),
        getLocalizedText(week.bibleTheme, week.bibleThemeTranslations, lang),
        week.bibleReference,
        week.status,
        ...(week.scriptureReferences || []),
        ...(week.verses || []),
        ...week.eventDays.flatMap((service) => [
          getLocalizedText(service.title, service.titleTranslations, lang),
          getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang),
          service.dayOfWeek || service.dayKey || "",
          service.time || service.serviceTime || "",
          service.memoryVerse || "",
          service.sermonNote || "",
          ...(service.hymns || []),
        ]),
        ...week.hymns.flatMap((hymn) => [hymn.title || "", String(hymn.hymnNumber || ""), hymn.time || ""]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [lang, searchQuery, weeksForYear]);

  const monthCards = useMemo(
    () =>
      MONTH_NAMES_FR.map((name, index) => {
        const monthNumber = index + 1;
        const monthWeeks = weeksForYear.filter((week) => weekOverlapsMonth(week, monthNumber));
        const serviceCount = monthWeeks.reduce((total, week) => total + week.eventDays.length, 0);
        return {
          name,
          monthNumber,
          weekCount: monthWeeks.length,
          serviceCount,
          isCurrent: Boolean(currentThemeWeek && String(currentThemeWeek.year) === year && weekOverlapsMonth(currentThemeWeek, monthNumber)),
        };
      }),
    [currentThemeWeek, weeksForYear, year],
  );

  const visibleMonthWeeks = useMemo(
    () =>
      filteredWeeksForYear
        .filter((week) => weekOverlapsMonth(week, selectedMonth))
        .sort((a, b) => Number(a.weekNumber || 0) - Number(b.weekNumber || 0)),
    [filteredWeeksForYear, selectedMonth],
  );

  useEffect(() => {
    if (!visibleMonthWeeks.length) {
      setSelectedWeekId("");
      return;
    }
    setSelectedWeekId((current) => (visibleMonthWeeks.some((week) => weekKey(week) === current) ? current : weekKey(visibleMonthWeeks[0])));
  }, [visibleMonthWeeks]);

  const selectedWeek = useMemo(
    () => visibleMonthWeeks.find((week) => weekKey(week) === selectedWeekId) || visibleMonthWeeks[0] || null,
    [selectedWeekId, visibleMonthWeeks],
  );

  const currentTitle = currentThemeWeek
    ? getLocalizedText(currentThemeWeek.title, currentThemeWeek.titleTranslations, lang)
    : currentLegacyWeek?.title || "";
  const currentDescription = currentThemeWeek
    ? getLocalizedText(
        currentThemeWeek.bibleTheme || currentThemeWeek.description,
        currentThemeWeek.bibleThemeTranslations || currentThemeWeek.descriptionTranslations,
        lang,
      )
    : currentLegacyWeek?.description || currentLegacyWeek?.bibleTheme || "";
  const currentRange = currentThemeWeek || currentLegacyWeek;
  const today = toYmd(localNow);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#2ed06e]">{t("spiritual.badge", "SPIRITUAL CALENDAR")}</div>
            <h1 className="mt-3 text-[34px] font-bold leading-tight text-[#081828] md:text-[46px]">
              {t("spiritual.title", "Weekly Themes and Hymn Programs")}
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-8 text-slate-600">
              {t("spiritual.subtitle", "Browse the annual church spiritual program by year, month, week, services, and special celebrations.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/documentation" className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-bold text-white">
              {t("spiritual.read_docs", "Read documentation")}
            </Link>
            <Link to="/admin/spiritual-program" className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-900">
              {t("spiritual.admin_link", "Open admin workflow")}
            </Link>
            {currentThemeWeek ? (
              <button
                type="button"
                onClick={() => {
                  setYear(String(currentThemeWeek.year));
                  setSelectedMonth(currentThemeWeek.monthNumber || new Date().getMonth() + 1);
                  setSelectedWeekId(weekKey(currentThemeWeek));
                  setMobileFlow("content");
                }}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#2ed06e] px-5 text-sm font-bold text-white md:hidden"
              >
                Ouvrir la semaine
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
          <div className="rounded-lg border border-emerald-100 bg-[#edf9f1] p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#14623a]">{t("spiritual.current_week", "Current Week")}</div>
            {currentRange ? (
              <div className="mt-3">
                <div className="text-2xl font-bold leading-tight text-[#081828]">{currentTitle || "-"}</div>
                <div className="mt-2 text-sm font-bold text-slate-700">
                  {currentRange.startDate} - {currentRange.endDate} | {t("spiritual.week", "Week")} {currentRange.weekNumber}
                </div>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-700">{currentDescription || "-"}</p>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-600">{t("spiritual.empty_current", "No active week has been published yet.")}</div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("spiritual.years", "Years")} value={yearOptions.length} />
            <StatCard label={t("spiritual.weeks", "Weeks")} value={activeThemeWeeks.length || bundle.weeks.length} />
            <StatCard label={t("spiritual.services", "Services")} value={activeThemeWeeks.length ? bundle.eventDays.length : bundle.services.length} />
            <StatCard label={t("spiritual.today", "Local date")} value={today} compact />
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {formatLocalDateTime(localNow, lang || "fr-FR")} - {t("spiritual.local_precision", "current week is calculated from the visitor's local calendar date.")}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Theme de la semaine</div>
            <div className="mt-2 text-2xl font-bold text-[#081828]">
              {mobileFlow === "months"
                ? t("spiritual.month_listing", "Months listing")
                : mobileFlow === "weeks"
                  ? `${MONTH_NAMES_FR[selectedMonth - 1]} ${year}`
                  : "Contenu de la semaine"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("spiritual.search", "Search by theme or scripture")}
              className="min-h-[44px] rounded-lg border border-slate-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none"
            />
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setSelectedWeekId("");
              }}
              className="min-h-[44px] rounded-lg border border-slate-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none"
            >
              {yearOptions.length === 0 ? <option value={year}>{year}</option> : null}
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 md:hidden">
          <StepPill active={mobileFlow === "months"} label="Mois" />
          <StepConnector />
          <StepPill active={mobileFlow === "weeks"} label="Semaines" />
          <StepConnector />
          <StepPill active={mobileFlow === "content"} label="Services" />
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">{t("spiritual.loading", "Loading spiritual program...")}</div>
        ) : (
          <>
            <div className={`mt-5 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${mobileFlow === "months" ? "grid" : "hidden md:grid"}`}>
              {monthCards.map((month) => (
                <button
                  key={month.monthNumber}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(month.monthNumber);
                    setSelectedWeekId("");
                    setMobileFlow("weeks");
                  }}
                  className={`min-h-[130px] rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    selectedMonth === month.monthNumber
                      ? "border-[#2ed06e] bg-[#edf9f1]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{month.name}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Mois {String(month.monthNumber).padStart(2, "0")}</div>
                    </div>
                    {month.isCurrent ? <span className="rounded-full bg-[#2ed06e] px-2 py-1 text-[11px] font-bold text-white">Actuel</span> : null}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{month.weekCount} semaines</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{month.serviceCount} contenus</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div className={`rounded-lg border border-slate-200 bg-[#f8fbfd] p-5 ${mobileFlow === "weeks" ? "block" : "hidden md:block"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ouverture du mois</div>
                    <h2 className="mt-1 text-xl font-bold text-[#081828]">
                      {MONTH_NAMES_FR[selectedMonth - 1]} {year}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{visibleMonthWeeks.length} semaines</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFlow("months")}
                  className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 md:hidden"
                >
                  Retour aux mois
                </button>

                <div className="mt-4 space-y-3">
                  {visibleMonthWeeks.map((week) => {
                    const title = getLocalizedText(week.title || week.theme, week.titleTranslations, lang);
                    const isSelected = weekKey(week) === selectedWeekId;
                    const isCurrent = currentThemeWeek ? weekKey(currentThemeWeek) === weekKey(week) : false;
                    return (
                      <button
                        key={weekKey(week)}
                        type="button"
                        onClick={() => {
                          setSelectedWeekId(weekKey(week));
                          setMobileFlow("content");
                        }}
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          isSelected ? "border-[#2ed06e] bg-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-wide text-[#2ed06e]">Semaine {week.weekNumber || "-"}</div>
                            <div className="mt-1 truncate text-base font-bold text-slate-900">{title || "Theme non defini"}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">{week.startDate} - {week.endDate}</div>
                          </div>
                          {isCurrent ? <span className="shrink-0 rounded-full bg-[#edf9f1] px-2 py-1 text-[11px] font-bold text-[#14623a]">Actuel</span> : null}
                        </div>
                        <div className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white md:hidden">
                          Voir les services
                        </div>
                      </button>
                    );
                  })}
                  {visibleMonthWeeks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm font-medium text-slate-600">
                      {t("spiritual.empty_weeks", "No weekly programs found.")}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={mobileFlow === "content" ? "block" : "hidden md:block"}>
                <div className="mb-3 flex flex-wrap gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileFlow("weeks")}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"
                  >
                    Retour aux semaines
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFlow("months")}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white"
                  >
                    Retour aux mois
                  </button>
                </div>
                <WeekContent week={selectedWeek} lang={lang} />
              </div>
            </div>
          </>
        )}
      </section>

      {!hasMobileThemeData && legacyWeeks.length ? <LegacyProgram weeks={legacyWeeks} currentWeek={currentLegacyWeek} /> : null}
    </div>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-[#2ed06e] text-white" : "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

function StepConnector() {
  return <span className="h-px flex-1 bg-slate-200" />;
}

function WeekContent({ week, lang }: { week: ResolvedThemeWeek | null; lang: string }) {
  if (!week) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="text-lg font-bold text-[#081828]">Contenu de la semaine</div>
        <p className="mt-2 text-sm font-medium text-slate-600">Choisissez un mois puis une semaine pour ouvrir le programme.</p>
      </div>
    );
  }

  const title = getLocalizedText(week.title || week.theme, week.titleTranslations, lang);
  const bibleTheme = getLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations, lang);
  const services = week.eventDays.filter((item) => item.serviceType !== "special_celebration" && !item.specialCelebrationId);
  const celebrations = week.eventDays.filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#2ed06e]">Ouverture de la semaine</div>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[#081828]">{title || "Theme non defini"}</h2>
          <div className="mt-2 text-sm font-bold text-slate-600">
            {week.monthName} | Semaine {week.weekNumber} | {week.startDate} - {week.endDate}
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{week.status || "published"}</span>
      </div>

      <p className="mt-4 text-sm font-medium leading-8 text-slate-700">{bibleTheme || week.description || "-"}</p>

      {!!week.scriptureReferences.length && (
        <div className="mt-3 text-sm font-semibold text-slate-600">References: {week.scriptureReferences.join(", ")}</div>
      )}
      {!!week.verses.length && <div className="mt-2 text-sm font-semibold text-slate-600">Versets: {week.verses.join(", ")}</div>}

      <ContentBlock title="Services et lectures" empty="Aucun service programme pour cette semaine.">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} lang={lang} />
        ))}
      </ContentBlock>

      <ContentBlock title="Celebrations speciales" empty="Aucune celebration speciale pour cette semaine.">
        {celebrations.map((service) => (
          <ServiceCard key={service.id} service={service} lang={lang} special />
        ))}
      </ContentBlock>

      <ContentBlock title="Cantiques programmes" empty="Aucun cantique attache pour cette semaine.">
        {week.hymns.map((hymn) => (
          <div key={hymn.id} className="rounded-lg border border-slate-200 bg-[#f8fbfd] p-4 text-sm">
            <div className="font-bold text-slate-900">{hymn.title || `Cantique ${hymn.hymnNumber || ""}`}</div>
            <div className="mt-1 font-medium text-slate-600">{[hymn.date, hymn.time, hymn.dayKey].filter(Boolean).join(" | ") || "-"}</div>
            {hymn.notes ? <div className="mt-2 text-slate-600">{hymn.notes}</div> : null}
          </div>
        ))}
      </ContentBlock>
    </div>
  );
}

function ServiceCard({ service, lang, special = false }: { service: WeeklyThemeEventDay; lang: string; special?: boolean }) {
  const title = getLocalizedText(service.title, service.titleTranslations, lang) || (special ? "Celebration" : "Service");
  const lesson = getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang);
  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8fbfd] p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-900">{title}</div>
          <div className="mt-1 font-semibold text-slate-600">
            {[service.dayOfWeek || service.dayKey, service.date || service.serviceDate, service.time || service.serviceTime].filter(Boolean).join(" | ") || "-"}
          </div>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase text-slate-600">{service.serviceType || "normal"}</span>
      </div>
      {lesson ? <p className="mt-3 font-medium leading-7 text-slate-700">{lesson}</p> : null}
      {service.memoryVerse ? <div className="mt-2 font-semibold text-slate-600">Memory verse: {service.memoryVerse}</div> : null}
      {service.sermonNote ? <div className="mt-2 font-semibold text-slate-600">Sermon: {service.sermonNote}</div> : null}
      {!!service.hymns?.length && <div className="mt-2 font-semibold text-slate-600">Cantiques: {service.hymns.join(", ")}</div>}
    </div>
  );
}

function ContentBlock({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="mt-6">
      <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{title}</div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.length ? items : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600">{empty}</div>}
      </div>
    </div>
  );
}

function LegacyProgram({ weeks, currentWeek }: { weeks: ResolvedWeek[]; currentWeek: ResolvedWeek | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="text-lg font-bold text-[#081828]">Ancien programme spirituel</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(currentWeek ? [currentWeek] : weeks.slice(0, 4)).map((week) => (
          <div key={week.id} className="rounded-lg border border-slate-200 bg-[#f8fbfd] p-4">
            <div className="font-bold text-slate-900">{week.title}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{week.startDate} - {week.endDate}</div>
            <p className="mt-2 text-sm text-slate-600">{week.description || week.bibleTheme || "-"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#2ed06e]">{label}</div>
      <div className={`mt-2 font-bold text-[#081828] ${compact ? "text-xl" : "text-3xl"}`}>{value}</div>
    </div>
  );
}
