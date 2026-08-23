import { useEffect, useMemo, useState, type ReactNode } from "react";
import { openShareInApp, webPathForShare } from "../lib/deepLinks";
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
    <div className="max-w-full space-y-6 overflow-hidden">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(8,24,40,0.05)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#2ed06e]">{t("spiritual.badge", "SPIRITUAL CALENDAR")}</div>
            <h1 className="mt-3 text-[28px] font-bold leading-tight text-[#081828] md:text-[46px]">
              {t("spiritual.title", "Weekly Themes and Hymn Programs")}
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-8 text-slate-600">
              {t("spiritual.subtitle", "Browse the annual church spiritual program by year, month, week, services, and special celebrations.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-emerald-100 bg-[#edf9f1] p-4 md:p-5">
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
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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

      <section className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(8,24,40,0.05)] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Theme de la semaine</div>
            <div className="mt-2 break-words text-xl font-bold text-[#081828] md:text-2xl">
              {mobileFlow === "months"
                ? t("spiritual.month_listing", "Months listing")
                : mobileFlow === "weeks"
                  ? `${MONTH_NAMES_FR[selectedMonth - 1]} ${year}`
                  : "Contenu de la semaine"}
            </div>
          </div>
          <div className="grid w-full min-w-0 gap-2 sm:w-auto sm:grid-cols-[minmax(220px,1fr)_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("spiritual.search", "Search by theme or scripture")}
              className="min-h-[44px] min-w-0 rounded-lg border border-slate-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none"
            />
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setSelectedWeekId("");
              }}
              className="min-h-[44px] min-w-0 rounded-lg border border-slate-200 bg-[#f8fafc] px-4 text-sm font-medium outline-none"
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
            <div className={`mt-5 max-w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${mobileFlow === "months" ? "grid" : "hidden md:grid"}`}>
              {monthCards.map((month) => (
                <button
                  key={month.monthNumber}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(month.monthNumber);
                    setSelectedWeekId("");
                    setMobileFlow("weeks");
                  }}
                  className={`min-h-[116px] min-w-0 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm md:min-h-[130px] md:p-4 ${
                    selectedMonth === month.monthNumber
                      ? "border-[#2ed06e] bg-[#edf9f1]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="break-words text-base font-bold text-slate-900 md:text-lg">{month.name}</div>
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

            <div className="mt-6 grid max-w-full gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div className={`min-w-0 rounded-lg border border-slate-200 bg-[#f8fbfd] p-3 md:p-5 ${mobileFlow === "weeks" ? "block" : "hidden md:block"}`}>
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
                        className={`w-full min-w-0 rounded-lg border p-3 text-left transition md:p-4 ${
                          isSelected ? "border-[#2ed06e] bg-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-wide text-[#2ed06e]">Semaine {week.weekNumber || "-"}</div>
                            <div className="mt-1 break-words text-base font-bold text-slate-900">{title || "Theme non defini"}</div>
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

              <div className={`min-w-0 ${mobileFlow === "content" ? "block" : "hidden md:block"}`}>
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
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <div className="text-lg font-bold text-[#081828]">Contenu de la semaine</div>
        <p className="mt-2 text-sm font-medium text-slate-600">Choisissez un mois puis une semaine pour ouvrir le programme.</p>
      </div>
    );
  }

  const title = getLocalizedText(week.title || week.theme, week.titleTranslations, lang);
  const bibleTheme = getLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations, lang);
  const services = week.eventDays.filter((item) => item.serviceType !== "special_celebration" && !item.specialCelebrationId);
  const celebrations = week.eventDays.filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId);
  const weekUrl = absolutePortalUrl(webPathForShare("theme", weekKey(week)));
  const shareText = buildWeekWhatsAppText(week, lang, weekUrl);

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#2ed06e]">Ouverture de la semaine</div>
          <h2 className="mt-2 break-words text-xl font-bold leading-tight text-[#081828] md:text-2xl">{title || "Theme non defini"}</h2>
          <div className="mt-2 text-sm font-bold text-slate-600">
            {week.monthName} | Semaine {week.weekNumber} | {week.startDate} - {week.endDate}
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{week.status || "published"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => shareToWhatsApp(shareText)}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#25d366] px-4 text-sm font-bold text-white"
        >
          Partager WhatsApp
        </button>
        <button
          type="button"
          onClick={() => shareNative(title || "Theme de la semaine", shareText, weekUrl)}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900"
        >
          Partager
        </button>
        <button
          type="button"
          onClick={() => openShareInApp("theme", weekKey(week))}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white"
        >
          Ouvrir dans l'app
        </button>
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900">{hymn.title || `Cantique ${hymn.hymnNumber || ""}`}</div>
                <div className="mt-1 font-medium text-slate-600">{[hymn.date, hymn.time, hymn.dayKey].filter(Boolean).join(" | ") || "-"}</div>
              </div>
              <button
                type="button"
                onClick={() => shareToWhatsApp(buildHymnWhatsAppText(week, hymn, lang, weekUrl))}
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 ring-1 ring-slate-200"
              >
                Partager
              </button>
            </div>
            {hymn.notes ? <div className="mt-2 text-slate-600">{hymn.notes}</div> : null}
          </div>
        ))}
      </ContentBlock>
    </div>
  );
}

function absolutePortalUrl(path: string) {
  if (typeof window === "undefined") return `https://celeonetv.com${path}`;
  return `${window.location.origin}${path}`;
}

function buildWeekWhatsAppText(week: ResolvedThemeWeek, lang: string, url: string) {
  const title =
    safeLocalizedText(week.title || week.theme, week.titleTranslations, lang) ||
    safeLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations, lang) ||
    "Theme de la semaine";
  const bibleTheme = safeLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations, lang);
  const services = [...week.eventDays].sort(serviceSort);
  const hymnGroups = collectHymnGroups(week, lang);
  const lines = [
    `✧･ﾟ *PROGRAMME DU ${dateRangeLabel(week.startDate, week.endDate, lang).toUpperCase()}* ･ﾟ✧`,
    `*${ordinalWeekLabel(week.weekNumber)} SEMAINE*`,
    "",
    "──── *THEME* ────",
    `_${languageName(lang)}_ : ${title}`,
  ];

  if (bibleTheme && normalizePlain(title) !== normalizePlain(bibleTheme)) lines.push(`*Texte* : ${bibleTheme}`);

  if (services.length) {
    lines.push("", "━━━  ✦  *LES TEXTES BIBLIQUES*  ✦  ━━━");
    services.forEach((service) => {
      lines.push(...serviceBlock(service, lang));
    });
  }

  if (hymnGroups.length) {
    lines.push("", "━━━  ♫  *LES CANTIQUES*  ♫  ━━━");
    hymnGroups.forEach((group) => {
      lines.push("", `*${group.title}*`);
      group.items.forEach((item) => lines.push(`• ${item}`));
    });
  }

  if (week.scriptureReferences.length) lines.push("", "*References generales*", ...week.scriptureReferences.map((item) => `• ${item}`));
  if (week.verses.length) lines.push("", "*Versets*", ...week.verses.map((item) => `• ${item}`));

  lines.push("", "_Ouvrir sur le portail CeleOne:_", url);
  return lines.filter((line) => line !== undefined && line !== null).join("\n");
}

function buildHymnWhatsAppText(week: ResolvedThemeWeek, hymn: ResolvedThemeWeek["hymns"][number], lang: string, url: string) {
  const title = safeLocalizedText(week.title || week.theme, week.titleTranslations, lang) || "Theme de la semaine";
  return [
    "*CELEONE - CANTIQUE PROGRAMME*",
    "",
    `*${hymn.title || `Cantique ${hymn.hymnNumber || ""}`}*`,
    hymn.hymnNumber ? `_Numero: ${hymn.hymnNumber}_` : "",
    [hymn.date, hymn.time, hymn.dayKey].filter(Boolean).join(" | "),
    "",
    "*Semaine*",
    `${title} - Semaine ${week.weekNumber || "-"}`,
    `${week.startDate || "-"} - ${week.endDate || "-"}`,
    hymn.notes ? `\n*Notes*\n${hymn.notes}` : "",
    "",
    "_Ouvrir sur le portail CeleOne:_",
    url,
  ]
    .filter(Boolean)
    .join("\n");
}

function serviceBlock(service: WeeklyThemeEventDay, lang: string) {
  const title = safeLocalizedText(service.title, service.titleTranslations, lang) || serviceTypeLabel(service);
  const lesson = safeLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang);
  const references = [...(service.scriptureReferences || []), ...(service.verses || [])].filter(Boolean);
  const date = service.date || service.serviceDate || "";
  const time = service.time || service.serviceTime || "";
  const lines = ["", `✦ *${dateLabel(date, lang).toUpperCase()}*`];

  if (time || title) lines.push(`${time ? `${time} : ` : ""}${title}`);
  if (lesson) lines.push(`↳ ${lesson}`);
  references.forEach((item) => lines.push(`↳ ${item}`));
  if (service.memoryVerse) lines.push(`↳ Verset a memoriser : ${service.memoryVerse}`);
  if (service.sermonNote) lines.push(`↳ Note : ${service.sermonNote}`);
  if (service.hymns?.length) {
    lines.push("↳ Cantiques :");
    service.hymns.forEach((hymn) => lines.push(`   • ${formatHymnText(hymn)}`));
  }

  return lines;
}

function collectHymnGroups(week: ResolvedThemeWeek, lang: string) {
  const groups = new Map<string, string[]>();
  const groupTitles = new Map<string, string>();
  const add = (key: string, title: string, value: string) => {
    if (!value) return;
    const current = groups.get(key) || [];
    if (!current.includes(value)) current.push(value);
    groups.set(key, current);
    groupTitles.set(key, title);
  };

  week.eventDays.forEach((service) => {
    const key = service.date || service.serviceDate || service.dayKey || service.id;
    const title = `Cantiques - ${dateLabel(service.date || service.serviceDate, lang)}${service.time || service.serviceTime ? ` (${service.time || service.serviceTime})` : ""}`;
    (service.hymns || []).forEach((hymn) => add(key, title, formatHymnText(hymn)));
  });

  week.hymns.forEach((hymn) => {
    const key = hymn.date || hymn.dayKey || "week";
    const title = hymn.date ? `Cantiques - ${dateLabel(hymn.date, lang)}` : "Cantiques de la semaine";
    add(key, title, `${hymn.hymnNumber ? `Cantique N°${hymn.hymnNumber}` : "Cantique"}${hymn.title ? ` - ${hymn.title}` : ""}${hymn.time ? ` (${hymn.time})` : ""}`);
  });

  return Array.from(groups.entries()).map(([key, items]) => ({ title: groupTitles.get(key) || "Cantiques", items }));
}

function formatHymnText(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/cantique/i.test(text)) return text;
  return `Cantique ${text}`;
}

function safeLocalizedText(value: unknown, translations: Parameters<typeof getLocalizedText>[1], lang: string) {
  const text = getLocalizedText(value, translations, lang);
  if (!text || /^\[object Object\]$/i.test(text) || /^any$/i.test(text.trim())) return "";
  return text;
}

function normalizePlain(value: string) {
  return String(value || "").trim().toLowerCase();
}

function serviceSort(a: WeeklyThemeEventDay, b: WeeklyThemeEventDay) {
  return (
    String(a.date || a.serviceDate || "").localeCompare(String(b.date || b.serviceDate || "")) ||
    String(a.time || a.serviceTime || "").localeCompare(String(b.time || b.serviceTime || ""))
  );
}

function serviceTypeLabel(service: WeeklyThemeEventDay) {
  const type = String(service.serviceType || "");
  if (type === "first_thursday") return "Nouveau mois / premier jeudi";
  if (type === "special_celebration") return "Celebration speciale";
  if (type === "sunday_morning") return "Culte du dimanche matin";
  if (type === "sunday_evening") return "Culte du dimanche soir";
  if (type === "wednesday_service") return "Culte du mercredi";
  if (type === "friday_service") return "Culte du vendredi";
  return "Service";
}

function dateRangeLabel(startDate: string, endDate: string, lang: string) {
  return `${dateLabel(startDate, lang)} au ${dateLabel(endDate, lang)}`;
}

function dateLabel(value: string | undefined, lang: string) {
  if (!value) return "Date non definie";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang || "fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ordinalWeekLabel(value: number) {
  if (!value) return "";
  return `${value}${value === 1 ? "ERE" : "EME"}`;
}

function languageName(lang: string) {
  const normalized = String(lang || "fr").toLowerCase();
  if (normalized.startsWith("en")) return "ANGLAIS";
  if (normalized.startsWith("yo")) return "YORUBA";
  if (normalized.startsWith("fon")) return "FONGBE";
  if (normalized.startsWith("go")) return "GUNGBE";
  if (normalized.startsWith("es")) return "ESPAGNOL";
  return "FRANCAIS";
}

function shareToWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

async function shareNative(title: string, text: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, text, url }).catch(() => undefined);
    return;
  }
  await navigator.clipboard?.writeText(text).catch(() => undefined);
  alert("Le texte de partage a ete copie.");
}

function ServiceCard({ service, lang, special = false }: { service: WeeklyThemeEventDay; lang: string; special?: boolean }) {
  const title = getLocalizedText(service.title, service.titleTranslations, lang) || (special ? "Celebration" : "Service");
  const lesson = getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang);
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-[#f8fbfd] p-3 text-sm md:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="break-words font-bold text-slate-900">{title}</div>
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
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
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
    <div className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#2ed06e]">{label}</div>
      <div className={`mt-1 truncate font-bold text-[#081828] ${compact ? "text-sm md:text-base" : "text-xl md:text-2xl"}`}>{value}</div>
    </div>
  );
}
