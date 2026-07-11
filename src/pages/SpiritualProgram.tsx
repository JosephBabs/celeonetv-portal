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
  const { t } = useI18n();
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
  const hasMobileThemeData = themeWeeks.length > 0;
  const currentLegacyWeek = useMemo(() => getCurrentWeek(legacyWeeks), [legacyWeeks]);
  const currentThemeWeek = useMemo(() => getCurrentThemeWeek(themeWeeks), [themeWeeks]);

  const filteredWeeks = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (hasMobileThemeData) {
      return visibleThemeWeeks.filter((week) => {
        if (year && String(week.year) !== year) return false;
        if (!q) return true;

        const haystack = [
          getLocalizedText(week.title, week.titleTranslations),
          getLocalizedText(week.description, week.descriptionTranslations),
          getLocalizedText(week.bibleTheme, week.bibleThemeTranslations),
          ...(week.scriptureReferences || []),
          ...(week.verses || []),
          ...week.eventDays.flatMap((service) => [
            getLocalizedText(service.title, service.titleTranslations),
            getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations),
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
  }, [hasMobileThemeData, legacyWeeks, search, visibleThemeWeeks, year]);

  const yearOptions = useMemo(() => {
    if (hasMobileThemeData) {
      return Array.from(new Set(themeWeeks.map((item) => String(item.year)).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    }
    return bundle.years.map((item) => item.yearName);
  }, [bundle.years, hasMobileThemeData, themeWeeks]);

  const currentTitle = currentThemeWeek
    ? getLocalizedText(currentThemeWeek.title, currentThemeWeek.titleTranslations)
    : currentLegacyWeek?.title || "";
  const currentDescription = currentThemeWeek
    ? getLocalizedText(
        currentThemeWeek.bibleTheme || currentThemeWeek.description,
        currentThemeWeek.bibleThemeTranslations || currentThemeWeek.descriptionTranslations
      )
    : currentLegacyWeek?.description || currentLegacyWeek?.bibleTheme || "";
  const currentRange = currentThemeWeek || currentLegacyWeek;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="inline-flex rounded-full bg-slate-900 px-4 py-1 text-xs font-black tracking-wide text-white">
              {t("spiritual.badge", "SPIRITUAL CALENDAR")}
            </div>
            <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
              {t("spiritual.title", "Weekly Themes and Hymn Programs")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 md:text-base">
              {t("spiritual.subtitle", "Browse the annual church spiritual program by year, month, week, services, and special celebrations.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/documentation" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                {t("spiritual.read_docs", "Read documentation")}
              </Link>
              <Link to="/admin/spiritual-program" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50">
                {t("spiritual.admin_link", "Open admin workflow")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 backdrop-blur">
            <div className="text-sm font-black text-slate-900">{t("spiritual.current_week", "Current Week")}</div>
            {currentRange ? (
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-black text-slate-900">{currentTitle || "-"}</div>
                <div className="text-sm font-bold text-slate-600">
                  {currentRange.startDate} - {currentRange.endDate} - {t("spiritual.week", "Week")} {currentRange.weekNumber}
                </div>
                <div className="text-sm text-slate-700">{currentDescription || "-"}</div>
                <div className="rounded-2xl bg-teal-50 p-3 text-sm text-teal-900">
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black text-slate-900">{t("spiritual.browse", "Browse Spiritual Program")}</div>
            <div className="mt-1 text-sm text-slate-600">
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
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
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
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-4">
              {filteredWeeks.slice(0, 18).map((week) =>
                hasMobileThemeData ? (
                  <ThemeWeekCard key={week.id} week={week as ResolvedThemeWeek} />
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
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-lg font-black text-slate-900">{t("spiritual.special_celebrations", "Special Celebrations")}</div>
                <div className="mt-4 space-y-3">
                  {hasMobileThemeData
                    ? bundle.eventDays
                        .filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId)
                        .slice(0, 8)
                        .map((item) => (
                          <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="font-black text-slate-900">{getLocalizedText(item.title, item.titleTranslations) || "Celebration"}</div>
                            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-700">{item.serviceType || "special"}</div>
                            <div className="mt-1 text-sm text-slate-600">{item.date || item.serviceDate}</div>
                          </div>
                        ))
                    : bundle.celebrations.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="font-black text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-700">{item.category || item.type || "custom"}</div>
                          <div className="mt-1 text-sm text-slate-600">{item.startDate} - {item.endDate}</div>
                        </div>
                      ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-lg font-black text-slate-900">{hasMobileThemeData ? t("spiritual.hymn_programs", "Hymn Programs") : t("spiritual.regular_schedule", "Regular Schedule")}</div>
                <div className="mt-4 space-y-3">
                  {hasMobileThemeData
                    ? bundle.hymns.slice(0, 10).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="font-black text-slate-900">{item.title || `Cantique ${item.hymnNumber || ""}`}</div>
                          <div className="mt-1 text-slate-600">{[item.date, item.time].filter(Boolean).join(" - ")}</div>
                        </div>
                      ))
                    : bundle.schedules.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                          <div className="font-black text-slate-900">{item.label || item.dayName}</div>
                          <div className="mt-1 text-slate-600">{item.dayName} - {item.time}</div>
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

function ThemeWeekCard({ week }: { week: ResolvedThemeWeek }) {
  const services = week.eventDays.filter((item) => item.serviceType !== "special_celebration" && !item.specialCelebrationId);
  const celebrations = week.eventDays.filter((item) => item.serviceType === "special_celebration" || item.specialCelebrationId);
  const title = getLocalizedText(week.title || week.theme, week.titleTranslations);
  const bibleTheme = getLocalizedText(week.bibleTheme || week.description, week.bibleThemeTranslations || week.descriptionTranslations);

  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black text-slate-900">{title || "Theme non defini"}</div>
          <div className="mt-1 text-sm font-bold text-slate-600">
            {week.year || "-"} - {week.monthName || "-"} - Week {week.weekNumber}
          </div>
          <div className="mt-1 text-sm text-slate-600">{week.startDate} - {week.endDate}</div>
        </div>
        {week.isActive ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Active</span> : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-700">{bibleTheme || week.description || "-"}</p>

      {!!week.scriptureReferences.length && (
        <div className="mt-3 text-sm font-semibold text-slate-600">Scripture: {week.scriptureReferences.join(", ")}</div>
      )}

      <div className="mt-4 grid gap-2">
        {services.slice(0, 5).map((service) => (
          <div key={service.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <div className="font-black text-slate-900">
              {getLocalizedText(service.title, service.titleTranslations) || "Service"}
            </div>
            <div className="mt-1 text-slate-600">
              {[service.dayOfWeek || service.dayKey, service.date || service.serviceDate, service.time || service.serviceTime].filter(Boolean).join(" - ")}
            </div>
            <div className="mt-1 text-slate-600">
              {getLocalizedText(service.bibleLesson || service.bibleTheme || service.bibleReadingText, service.bibleThemeTranslations) || "-"}
            </div>
          </div>
        ))}
      </div>

      {celebrations.length || week.hymns.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {celebrations.length ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{celebrations.length} celebrations</span> : null}
          {week.hymns.length ? <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800">{week.hymns.length} hymns</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function LegacyWeekCard({ week }: { week: ResolvedWeek }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black text-slate-900">{week.title}</div>
          <div className="mt-1 text-sm font-bold text-slate-600">
            {week.year?.yearName || "-"} - {week.month?.monthName || "-"} - Week {week.weekNumber}
          </div>
          <div className="mt-1 text-sm text-slate-600">{week.startDate} - {week.endDate}</div>
        </div>
        {week.isActive ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Active</span> : null}
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-700">{week.description || week.bibleTheme || "-"}</p>
      {!!week.scriptureReferences?.length && (
        <div className="mt-3 text-sm font-semibold text-slate-600">Scripture: {week.scriptureReferences.join(", ")}</div>
      )}
      <div className="mt-4 grid gap-2">
        {week.services.slice(0, 5).map((service) => (
          <div key={service.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <div className="font-black text-slate-900">{service.serviceName}</div>
            <div className="mt-1 text-slate-600">{service.date} - {service.time} - {service.theme || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-extrabold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}
