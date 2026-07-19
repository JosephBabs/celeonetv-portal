import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentThemeWeek,
  getCurrentWeek,
  getLocalizedText,
  isThemeWeekVisible,
  loadProgramBundle,
  resolveThemeWeeks,
  resolveWeeks,
  type ProgramBundle,
  type ResolvedThemeWeek,
  type ResolvedWeek,
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

export default function SpiritualProgram() {
  const { t, lang } = useI18n();
  const [bundle, setBundle] = useState<ProgramBundle>(emptyBundle);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");

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

  const legacyWeeks = useMemo(() => resolveWeeks(bundle), [bundle]);
  const themeWeeks = useMemo(() => resolveThemeWeeks(bundle), [bundle]);
  const visibleThemeWeeks = useMemo(() => themeWeeks.filter(isThemeWeekVisible), [themeWeeks]);
  const hasMobileThemeData = visibleThemeWeeks.length > 0;
  const currentLegacyWeek = useMemo(() => getCurrentWeek(legacyWeeks), [legacyWeeks]);
  const currentThemeWeek = useMemo(
    () => getCurrentThemeWeek(visibleThemeWeeks.length ? visibleThemeWeeks : themeWeeks),
    [themeWeeks, visibleThemeWeeks],
  );

  const filteredWeeks = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (hasMobileThemeData) {
      return visibleThemeWeeks.filter((week) => {
        if (year && String(week.year) !== year) return false;
        if (!q) return true;

        const haystack = [
          getLocalizedText(week.title, week.titleTranslations, lang),
          getLocalizedText(week.description, week.descriptionTranslations, lang),
          getLocalizedText(week.bibleTheme, week.bibleThemeTranslations, lang),
          ...(week.scriptureReferences || []),
          ...(week.verses || []),
          ...week.eventDays.flatMap((service) => [
            getLocalizedText(service.title, service.titleTranslations, lang),
            getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang),
            service.dayOfWeek || service.dayKey || "",
            service.time || service.serviceTime || "",
            ...(service.scriptureReferences || []),
            ...(service.verses || []),
          ]),
          ...week.hymns.flatMap((hymn) => [hymn.title || "", String(hymn.hymnNumber || ""), hymn.time || ""]),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return legacyWeeks.filter((week) => {
      if (year && week.year?.yearName !== year) return false;
      if (!q) return true;
      const haystack = [
        week.title,
        week.description,
        week.bibleTheme,
        ...(week.scriptureReferences || []),
        ...(week.verses || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [hasMobileThemeData, lang, legacyWeeks, search, visibleThemeWeeks, year]);

  const yearOptions = useMemo(() => {
    if (hasMobileThemeData) {
      return Array.from(new Set(themeWeeks.map((item) => String(item.year)).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    }
    return bundle.years.map((item) => item.yearName);
  }, [bundle.years, hasMobileThemeData, themeWeeks]);

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

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[28px] bg-[#081828] px-6 py-16 text-white md:px-10"
        style={{ backgroundImage: "url('/spark/banner-bg.svg')", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.18em] text-white/86">
              {t("spiritual.badge", "SPIRITUAL CALENDAR")}
            </div>
            <h1 className="mt-6 text-[38px] font-bold leading-[1.08] text-white md:text-[54px]">
              {t("spiritual.title", "Weekly Themes and Hymn Programs")}
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-white/78">
              {t("spiritual.subtitle", "Browse the annual church spiritual program by year, month, week, services, and special celebrations.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/documentation" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-[15px] font-bold text-[#081828]">
                {t("spiritual.read_docs", "Read documentation")}
              </Link>
              <Link to="/admin/spiritual-program" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-[15px] font-bold text-white">
                {t("spiritual.admin_link", "Open admin workflow")}
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-7 text-slate-900 shadow-[0_18px_48px_rgba(8,24,40,0.18)]">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">{t("spiritual.current_week", "Current Week")}</div>
            {currentRange ? (
              <div className="mt-4 space-y-3">
                <div className="text-[30px] font-bold leading-tight text-[#081828]">{currentTitle || "-"}</div>
                <div className="text-sm font-bold text-slate-600">
                  {currentRange.startDate} - {currentRange.endDate} - {t("spiritual.week", "Week")} {currentRange.weekNumber}
                </div>
                <div className="text-sm font-medium leading-7 text-slate-700">{currentDescription || "-"}</div>
                <div className="rounded-[18px] bg-[#edf9f1] p-4 text-sm font-medium text-[#14623a]">
                  {currentThemeWeek?.hymns.length
                    ? `${currentThemeWeek.hymns.length} ${t("spiritual.hymns", "Hymns")}`
                    : currentLegacyWeek?.hymnProgram?.title || t("spiritual.no_hymn", "No hymn program attached yet.")}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">{t("spiritual.empty_current", "No active week has been published yet.")}</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={t("spiritual.years", "Years")} value={yearOptions.length} />
        <StatCard label={t("spiritual.weeks", "Weeks")} value={hasMobileThemeData ? visibleThemeWeeks.length : bundle.weeks.length} />
        <StatCard label={t("spiritual.services", "Services")} value={hasMobileThemeData ? bundle.eventDays.length : bundle.services.length} />
        <StatCard
          label={t("spiritual.celebrations", "Celebrations")}
          value={hasMobileThemeData ? bundle.eventDays.filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId).length : bundle.celebrations.length}
        />
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Theme de la semaine</div>
            <div className="mt-3 text-[34px] font-bold leading-tight text-[#081828]">{t("spiritual.browse", "Browse Spiritual Program")}</div>
            <div className="mt-2 text-[15px] font-medium leading-8 text-slate-600">
              {hasMobileThemeData
                ? t("spiritual.mobile_source", "Connected to the mobile Theme de la semaine Firebase schema.")
                : t("spiritual.browse_desc", "Search themes, Bible references, and past weekly programs.")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("spiritual.search", "Search by theme or scripture")}
              className="rounded-full border border-slate-200 bg-[#f8fafc] px-5 py-3 text-sm font-medium outline-none"
            />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-full border border-slate-200 bg-[#f8fafc] px-5 py-3 text-sm font-medium outline-none"
            >
              <option value="">{t("spiritual.all_years", "All years")}</option>
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-slate-600">{t("spiritual.loading", "Loading spiritual program...")}</div>
        ) : (
          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {filteredWeeks.slice(0, 18).map((week) =>
                hasMobileThemeData ? (
                  <ThemeWeekCard key={week.id} week={week as ResolvedThemeWeek} lang={lang} />
                ) : (
                  <LegacyWeekCard key={week.id} week={week as ResolvedWeek} />
                )
              )}
              {filteredWeeks.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {t("spiritual.empty_weeks", "No weekly programs found.")}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-[#f8fbfd] p-6">
                <div className="text-[22px] font-bold text-[#081828]">{t("spiritual.special_celebrations", "Special Celebrations")}</div>
                <div className="mt-4 space-y-3">
                  {hasMobileThemeData
                    ? bundle.eventDays
                        .filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId)
                        .slice(0, 8)
                        .map((item) => (
                          <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white p-4">
                            <div className="font-bold text-slate-900">{getLocalizedText(item.title, item.titleTranslations, lang) || "Celebration"}</div>
                            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2ed06e]">{item.serviceType || "special"}</div>
                            <div className="mt-1 text-sm font-medium text-slate-600">{item.date || item.serviceDate}</div>
                          </div>
                        ))
                    : bundle.celebrations.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white p-4">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2ed06e]">{item.category || item.type || "custom"}</div>
                          <div className="mt-1 text-sm font-medium text-slate-600">{item.startDate} - {item.endDate}</div>
                        </div>
                      ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-[#f8fbfd] p-6">
                <div className="text-[22px] font-bold text-[#081828]">{hasMobileThemeData ? t("spiritual.hymn_programs", "Hymn Programs") : t("spiritual.regular_schedule", "Regular Schedule")}</div>
                <div className="mt-4 space-y-3">
                  {hasMobileThemeData
                    ? bundle.hymns.slice(0, 10).map((item) => (
                        <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white p-4 text-sm">
                          <div className="font-bold text-slate-900">{item.title || `Cantique ${item.hymnNumber || ""}`}</div>
                          <div className="mt-1 font-medium text-slate-600">{[item.date, item.time].filter(Boolean).join(" - ")}</div>
                        </div>
                      ))
                    : bundle.schedules.map((item) => (
                        <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white p-4 text-sm">
                          <div className="font-bold text-slate-900">{item.label || item.dayName}</div>
                          <div className="mt-1 font-medium text-slate-600">{item.dayName} - {item.time}</div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ThemeWeekCard({ week, lang }: { week: ResolvedThemeWeek; lang: string }) {
  const services = week.eventDays.filter((item) => item.serviceType !== "special_celebration" && !item.specialCelebrationId);
  const celebrations = week.eventDays.filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId);
  const title = getLocalizedText(week.title || week.theme, week.titleTranslations, lang);
  const bibleTheme = getLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations, lang);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-bold leading-tight text-[#081828]">{title || "Theme non defini"}</div>
          <div className="mt-2 text-sm font-bold text-slate-600">
            {week.year || "-"} - {week.monthName || "-"} - Week {week.weekNumber}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">{week.startDate} - {week.endDate}</div>
        </div>
        {week.isActive ? <span className="rounded-full bg-[#edf9f1] px-3 py-1 text-xs font-bold text-[#14623a]">Active</span> : null}
      </div>

      <p className="mt-4 text-sm font-medium leading-8 text-slate-700">{bibleTheme || week.description || "-"}</p>

      {!!week.scriptureReferences.length && (
        <div className="mt-4 text-sm font-medium text-slate-600">Scripture: {week.scriptureReferences.join(", ")}</div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {services.slice(0, 5).map((service) => (
          <div key={service.id} className="rounded-[18px] border border-slate-200 bg-[#f8fbfd] px-4 py-4 text-sm">
            <div className="font-bold text-slate-900">
              {getLocalizedText(service.title, service.titleTranslations, lang) || "Service"}
            </div>
            <div className="mt-1 font-medium text-slate-600">
              {[service.dayOfWeek || service.dayKey, service.date || service.serviceDate, service.time || service.serviceTime].filter(Boolean).join(" - ")}
            </div>
            <div className="mt-1 font-medium text-slate-600">
              {getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations, lang) || "-"}
            </div>
          </div>
        ))}
      </div>

      {celebrations.length || week.hymns.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {celebrations.length ? <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#245f9b]">{celebrations.length} celebrations</span> : null}
          {week.hymns.length ? <span className="rounded-full bg-[#edf9f1] px-3 py-1 text-xs font-bold text-[#14623a]">{week.hymns.length} hymns</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function LegacyWeekCard({ week }: { week: ResolvedWeek }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-bold leading-tight text-[#081828]">{week.title}</div>
          <div className="mt-2 text-sm font-bold text-slate-600">
            {week.year?.yearName || "-"} - {week.month?.monthName || "-"} - Week {week.weekNumber}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">{week.startDate} - {week.endDate}</div>
        </div>
        {week.isActive ? <span className="rounded-full bg-[#edf9f1] px-3 py-1 text-xs font-bold text-[#14623a]">Active</span> : null}
      </div>
      <p className="mt-4 text-sm font-medium leading-8 text-slate-700">{week.description || week.bibleTheme || "-"}</p>
      {!!week.scriptureReferences?.length && (
        <div className="mt-4 text-sm font-medium text-slate-600">Scripture: {week.scriptureReferences.join(", ")}</div>
      )}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {week.services.slice(0, 5).map((service) => (
          <div key={service.id} className="rounded-[18px] border border-slate-200 bg-[#f8fbfd] px-4 py-4 text-sm">
            <div className="font-bold text-slate-900">{service.serviceName}</div>
            <div className="mt-1 font-medium text-slate-600">{service.date} - {service.time} - {service.theme || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
      <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#2ed06e]">{label}</div>
      <div className="mt-3 text-[34px] font-bold text-[#081828]">{value}</div>
    </div>
  );
}
