import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadProgramBundle, getCurrentWeek, resolveWeeks, type ProgramBundle } from "../lib/spiritualProgram";
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

  const resolvedWeeks = useMemo(() => resolveWeeks(bundle), [bundle]);
  const currentWeek = useMemo(() => getCurrentWeek(resolvedWeeks), [resolvedWeeks]);

  const filteredWeeks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolvedWeeks.filter((week) => {
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
  }, [resolvedWeeks, search, year]);

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
            {currentWeek ? (
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-black text-slate-900">{currentWeek.title}</div>
                <div className="text-sm font-bold text-slate-600">
                  {currentWeek.startDate} - {currentWeek.endDate} · {t("spiritual.week", "Week")} {currentWeek.weekNumber}
                </div>
                <div className="text-sm text-slate-700">{currentWeek.description || currentWeek.bibleTheme || "-"}</div>
                <div className="rounded-2xl bg-teal-50 p-3 text-sm text-teal-900">
                  {currentWeek.hymnProgram?.title || t("spiritual.no_hymn", "No hymn program attached yet.")}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">{t("spiritual.empty_current", "No active week has been published yet.")}</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={t("spiritual.years", "Years")} value={bundle.years.length} />
        <StatCard label={t("spiritual.weeks", "Weeks")} value={bundle.weeks.length} />
        <StatCard label={t("spiritual.services", "Services")} value={bundle.services.length} />
        <StatCard label={t("spiritual.celebrations", "Celebrations")} value={bundle.celebrations.length} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black text-slate-900">{t("spiritual.browse", "Browse Spiritual Program")}</div>
            <div className="mt-1 text-sm text-slate-600">{t("spiritual.browse_desc", "Search themes, Bible references, and past weekly programs.")}</div>
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
              {bundle.years.map((item) => (
                <option key={item.id} value={item.yearName}>
                  {item.yearName}
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
              {filteredWeeks.slice(0, 18).map((week) => (
                <div key={week.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-slate-900">{week.title}</div>
                      <div className="mt-1 text-sm font-bold text-slate-600">
                        {week.year?.yearName || "-"} · {week.month?.monthName || "-"} · {t("spiritual.week", "Week")} {week.weekNumber}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{week.startDate} - {week.endDate}</div>
                    </div>
                    {week.isActive ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{t("spiritual.active", "Active")}</span> : null}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{week.description || week.bibleTheme || "-"}</p>
                  {!!week.scriptureReferences?.length && (
                    <div className="mt-3 text-sm font-semibold text-slate-600">
                      {t("spiritual.scripture_refs", "Scripture")}: {week.scriptureReferences.join(", ")}
                    </div>
                  )}
                  <div className="mt-4 grid gap-2">
                    {week.services.slice(0, 5).map((service) => (
                      <div key={service.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                        <div className="font-black text-slate-900">{service.serviceName}</div>
                        <div className="mt-1 text-slate-600">{service.date} · {service.time} · {service.theme || "-"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredWeeks.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">{t("spiritual.empty_weeks", "No weekly programs found.")}</div> : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-lg font-black text-slate-900">{t("spiritual.special_celebrations", "Special Celebrations")}</div>
                <div className="mt-4 space-y-3">
                  {bundle.celebrations.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-black text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-700">{item.category || item.type || "custom"}</div>
                      <div className="mt-1 text-sm text-slate-600">{item.startDate} - {item.endDate}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-lg font-black text-slate-900">{t("spiritual.regular_schedule", "Regular Schedule")}</div>
                <div className="mt-4 space-y-3">
                  {bundle.schedules.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="font-black text-slate-900">{item.label || item.dayName}</div>
                      <div className="mt-1 text-slate-600">{item.dayName} · {item.time}</div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-extrabold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}
