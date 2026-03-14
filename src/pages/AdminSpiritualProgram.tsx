/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createDoc,
  deleteSimpleDoc,
  getCurrentWeek,
  loadProgramBundle,
  resolveWeeks,
  setActiveWeek,
  updateSimpleDoc,
  type ProgramBundle,
} from "../lib/spiritualProgram";
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

export default function AdminSpiritualProgram() {
  const [bundle, setBundle] = useState<ProgramBundle>(emptyBundle);
  const [loading, setLoading] = useState(true);
  const [yearId, setYearId] = useState("");
  const [monthId, setMonthId] = useState("");
  const [weekId, setWeekId] = useState("");
  const [yearName, setYearName] = useState("");
  const [monthName, setMonthName] = useState("");
  const [weekForm, setWeekForm] = useState({
    weekNumber: "1",
    title: "",
    description: "",
    bibleTheme: "",
    scriptureReferences: "",
    startDate: "",
    endDate: "",
  });
  const [serviceForm, setServiceForm] = useState({
    serviceType: "wednesday_service",
    serviceName: "",
    date: "",
    time: "",
    theme: "",
  });
  const [hymnForm, setHymnForm] = useState({
    title: "",
    opening: "",
    closing: "",
  });
  const [celebrationForm, setCelebrationForm] = useState({
    title: "",
    category: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    dayName: "",
    time: "",
    label: "",
  });

  useEffect(() => {
    setPageMeta({
      title: "Admin Spiritual Program | CeleOne",
      description: "Manage spiritual years, months, weeks, services, hymn programs, and special celebrations.",
    });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setBundle(await loadProgramBundle());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const weeks = useMemo(() => resolveWeeks(bundle), [bundle]);
  const currentWeek = useMemo(() => getCurrentWeek(weeks), [weeks]);
  const monthsForYear = useMemo(() => bundle.months.filter((item) => !yearId || item.yearId === yearId), [bundle.months, yearId]);
  const weeksForMonth = useMemo(() => weeks.filter((item) => (!yearId || item.yearId === yearId) && (!monthId || item.monthId === monthId)), [weeks, yearId, monthId]);

  const parseHymn = (value: string) => {
    const [hymnNumber = "", hymnTitle = ""] = value.split("|").map((item) => item.trim());
    return hymnNumber || hymnTitle ? { hymnNumber, hymnTitle } : null;
  };

  const removeWeekDeep = async (id: string) => {
    const services = bundle.services.filter((item) => item.weekId === id);
    const programs = bundle.hymnPrograms.filter((item) => item.weekId === id);
    for (const service of services) await deleteSimpleDoc("spiritual_services", service.id);
    for (const program of programs) await deleteSimpleDoc("hymn_programs", program.id);
    await deleteSimpleDoc("spiritual_weeks", id);
    await load();
  };

  const removeYearDeep = async (id: string) => {
    const monthIds = bundle.months.filter((item) => item.yearId === id).map((item) => item.id);
    const weekIds = bundle.weeks.filter((item) => item.yearId === id || monthIds.includes(item.monthId)).map((item) => item.id);
    const services = bundle.services.filter((item) => weekIds.includes(item.weekId));
    const programs = bundle.hymnPrograms.filter((item) => (item.weekId && weekIds.includes(item.weekId)) || (item.serviceId && services.some((svc) => svc.id === item.serviceId)));
    for (const item of programs) await deleteSimpleDoc("hymn_programs", item.id);
    for (const item of services) await deleteSimpleDoc("spiritual_services", item.id);
    for (const item of bundle.celebrations.filter((celebration) => celebration.weekId && weekIds.includes(celebration.weekId))) {
      await updateSimpleDoc("special_celebrations", item.id, { weekId: null });
    }
    for (const idToDelete of weekIds) await deleteSimpleDoc("spiritual_weeks", idToDelete);
    for (const item of monthIds) await deleteSimpleDoc("spiritual_months", item);
    await deleteSimpleDoc("spiritual_years", id);
    await load();
  };

  const createYear = async () => {
    if (!yearName.trim()) return;
    const id = await createDoc("spiritual_years", {
      yearName: yearName.trim(),
      description: "",
      status: "draft",
      orderIndex: Number(yearName) || new Date().getFullYear(),
    });
    setYearId(id);
    setYearName("");
    await load();
  };

  const createMonth = async () => {
    if (!yearId || !monthName.trim()) return;
    const id = await createDoc("spiritual_months", {
      yearId,
      monthName: monthName.trim(),
      description: "",
      orderIndex: monthsForYear.length + 1,
    });
    setMonthId(id);
    setMonthName("");
    await load();
  };

  const createWeek = async () => {
    if (!yearId || !monthId || !weekForm.title.trim() || !weekForm.startDate || !weekForm.endDate) return;
    const id = await createDoc("spiritual_weeks", {
      yearId,
      monthId,
      weekNumber: Number(weekForm.weekNumber || 1),
      title: weekForm.title.trim(),
      description: weekForm.description.trim(),
      bibleTheme: weekForm.bibleTheme.trim(),
      verses: [],
      scriptureReferences: weekForm.scriptureReferences.split(",").map((item) => item.trim()).filter(Boolean),
      startDate: weekForm.startDate,
      endDate: weekForm.endDate,
      coverImage: "",
      notes: "",
      hymnProgramId: null,
      status: "draft",
      isActive: false,
      isPublished: false,
      createdBy: "portal-admin",
    });
    setWeekId(id);
    setWeekForm({ weekNumber: "1", title: "", description: "", bibleTheme: "", scriptureReferences: "", startDate: "", endDate: "" });
    await load();
  };

  const createService = async () => {
    if (!weekId || !serviceForm.serviceName.trim() || !serviceForm.date || !serviceForm.time) return;
    await createDoc("spiritual_services", {
      weekId,
      serviceType: serviceForm.serviceType,
      serviceName: serviceForm.serviceName.trim(),
      date: serviceForm.date,
      time: serviceForm.time,
      theme: serviceForm.theme.trim(),
      scriptureReferences: [],
      preacher: "",
      notes: "",
      hymnProgramId: null,
    });
    setServiceForm({ serviceType: "wednesday_service", serviceName: "", date: "", time: "", theme: "" });
    await load();
  };

  const createHymn = async () => {
    if (!weekId || !hymnForm.title.trim()) return;
    const hymnProgramId = await createDoc("hymn_programs", {
      title: hymnForm.title.trim(),
      weekId,
      serviceId: null,
      openingHymn: parseHymn(hymnForm.opening),
      closingHymn: parseHymn(hymnForm.closing),
      notes: "",
      status: "draft",
    });
    await updateSimpleDoc("spiritual_weeks", weekId, { hymnProgramId });
    setHymnForm({ title: "", opening: "", closing: "" });
    await load();
  };

  const createCelebration = async () => {
    if (!celebrationForm.title.trim() || !celebrationForm.startDate || !celebrationForm.endDate) return;
    await createDoc("special_celebrations", {
      weekId: weekId || null,
      title: celebrationForm.title.trim(),
      description: celebrationForm.description.trim(),
      startDate: celebrationForm.startDate,
      endDate: celebrationForm.endDate,
      serviceTimes: [],
      bibleTheme: "",
      verses: [],
      scriptureReferences: [],
      image: "",
      category: celebrationForm.category.trim() || "custom",
      type: celebrationForm.category.trim() || "custom",
      hymnProgramId: null,
      notes: "",
      status: "draft",
      isPublished: false,
    });
    setCelebrationForm({ title: "", category: "", startDate: "", endDate: "", description: "" });
    await load();
  };

  const createSchedule = async () => {
    if (!scheduleForm.dayName.trim() || !scheduleForm.time) return;
    await createDoc("service_schedules", {
      dayName: scheduleForm.dayName.trim(),
      time: scheduleForm.time,
      label: scheduleForm.label.trim(),
      isRegular: true,
    });
    setScheduleForm({ dayName: "", time: "", label: "" });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black">Admin Spiritual Program</div>
            <div className="mt-1 text-slate-600">Manage years, months, weeks, services, hymn programs, regular schedules, and special celebrations.</div>
          </div>
          <button onClick={load} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Current week: {currentWeek?.title || "-"}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Years: {bundle.years.length}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Weeks: {bundle.weeks.length}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Celebrations: {bundle.celebrations.length}</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="1. Years">
          <input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="Year" className={inputClass} />
          <button onClick={createYear} className={primaryBtn}>Create year</button>
          <div className="mt-4 space-y-3">
            {bundle.years.map((item) => (
              <ListRow
                key={item.id}
                title={item.yearName}
                subtitle={item.description || ""}
                actions={[
                  <button key="select" onClick={() => { setYearId(item.id); setMonthId(""); setWeekId(""); }} className={ghostBtn}>Select</button>,
                  <button key="delete" onClick={() => removeYearDeep(item.id)} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="2. Months">
          <input value={monthName} onChange={(e) => setMonthName(e.target.value)} placeholder="Month name" className={inputClass} />
          <button onClick={createMonth} className={primaryBtn}>Create month</button>
          <div className="mt-4 space-y-3">
            {monthsForYear.map((item) => (
              <ListRow
                key={item.id}
                title={item.monthName}
                subtitle={`Year ${item.yearId}`}
                actions={[
                  <button key="select" onClick={() => { setMonthId(item.id); setWeekId(""); }} className={ghostBtn}>Select</button>,
                  <button key="delete" onClick={async () => { await deleteSimpleDoc("spiritual_months", item.id); await load(); }} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="3. Weeks">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={weekForm.weekNumber} onChange={(e) => setWeekForm((v) => ({ ...v, weekNumber: e.target.value }))} placeholder="Week number" className={inputClass} />
            <input value={weekForm.title} onChange={(e) => setWeekForm((v) => ({ ...v, title: e.target.value }))} placeholder="Theme title" className={inputClass} />
          </div>
          <textarea value={weekForm.description} onChange={(e) => setWeekForm((v) => ({ ...v, description: e.target.value }))} placeholder="Description" className={textAreaClass} />
          <input value={weekForm.bibleTheme} onChange={(e) => setWeekForm((v) => ({ ...v, bibleTheme: e.target.value }))} placeholder="Bible theme" className={inputClass} />
          <input value={weekForm.scriptureReferences} onChange={(e) => setWeekForm((v) => ({ ...v, scriptureReferences: e.target.value }))} placeholder="Scripture references (comma separated)" className={inputClass} />
          <div className="grid gap-3 md:grid-cols-2">
            <input value={weekForm.startDate} onChange={(e) => setWeekForm((v) => ({ ...v, startDate: e.target.value }))} placeholder="YYYY-MM-DD" className={inputClass} />
            <input value={weekForm.endDate} onChange={(e) => setWeekForm((v) => ({ ...v, endDate: e.target.value }))} placeholder="YYYY-MM-DD" className={inputClass} />
          </div>
          <button onClick={createWeek} className={primaryBtn}>Create week</button>
          <div className="mt-4 space-y-3">
            {weeksForMonth.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={`${item.startDate} - ${item.endDate} · Week ${item.weekNumber}`}
                actions={[
                  <button key="select" onClick={() => setWeekId(item.id)} className={ghostBtn}>Select</button>,
                  <button key="active" onClick={async () => { await setActiveWeek(item.id); await load(); }} className={ghostBtn}>{item.isActive ? "Active" : "Make active"}</button>,
                  <button key="delete" onClick={() => removeWeekDeep(item.id)} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="4. Services">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={serviceForm.serviceType} onChange={(e) => setServiceForm((v) => ({ ...v, serviceType: e.target.value }))} placeholder="Service type" className={inputClass} />
            <input value={serviceForm.serviceName} onChange={(e) => setServiceForm((v) => ({ ...v, serviceName: e.target.value }))} placeholder="Service name" className={inputClass} />
            <input value={serviceForm.date} onChange={(e) => setServiceForm((v) => ({ ...v, date: e.target.value }))} placeholder="YYYY-MM-DD" className={inputClass} />
            <input value={serviceForm.time} onChange={(e) => setServiceForm((v) => ({ ...v, time: e.target.value }))} placeholder="HH:mm" className={inputClass} />
          </div>
          <input value={serviceForm.theme} onChange={(e) => setServiceForm((v) => ({ ...v, theme: e.target.value }))} placeholder="Theme topic" className={inputClass} />
          <button onClick={createService} className={primaryBtn}>Create service</button>
          <div className="mt-4 space-y-3">
            {bundle.services.filter((item) => !weekId || item.weekId === weekId).map((item) => (
              <ListRow
                key={item.id}
                title={item.serviceName}
                subtitle={`${item.date} · ${item.time} · ${item.theme || "-"}`}
                actions={[
                  <button key="delete" onClick={async () => { await deleteSimpleDoc("spiritual_services", item.id); await load(); }} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="5. Hymn Programs">
          <input value={hymnForm.title} onChange={(e) => setHymnForm((v) => ({ ...v, title: e.target.value }))} placeholder="Program title" className={inputClass} />
          <input value={hymnForm.opening} onChange={(e) => setHymnForm((v) => ({ ...v, opening: e.target.value }))} placeholder="Opening hymn: number | title" className={inputClass} />
          <input value={hymnForm.closing} onChange={(e) => setHymnForm((v) => ({ ...v, closing: e.target.value }))} placeholder="Closing hymn: number | title" className={inputClass} />
          <button onClick={createHymn} className={primaryBtn}>Create hymn program</button>
          <div className="mt-4 space-y-3">
            {bundle.hymnPrograms.filter((item) => !weekId || item.weekId === weekId).map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={item.weekId || "-"}
                actions={[
                  <button key="delete" onClick={async () => { await deleteSimpleDoc("hymn_programs", item.id); await load(); }} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="6. Special Celebrations">
          <input value={celebrationForm.title} onChange={(e) => setCelebrationForm((v) => ({ ...v, title: e.target.value }))} placeholder="Title" className={inputClass} />
          <div className="grid gap-3 md:grid-cols-2">
            <input value={celebrationForm.startDate} onChange={(e) => setCelebrationForm((v) => ({ ...v, startDate: e.target.value }))} placeholder="YYYY-MM-DD" className={inputClass} />
            <input value={celebrationForm.endDate} onChange={(e) => setCelebrationForm((v) => ({ ...v, endDate: e.target.value }))} placeholder="YYYY-MM-DD" className={inputClass} />
          </div>
          <input value={celebrationForm.category} onChange={(e) => setCelebrationForm((v) => ({ ...v, category: e.target.value }))} placeholder="Category" className={inputClass} />
          <textarea value={celebrationForm.description} onChange={(e) => setCelebrationForm((v) => ({ ...v, description: e.target.value }))} placeholder="Description" className={textAreaClass} />
          <button onClick={createCelebration} className={primaryBtn}>Create celebration</button>
          <div className="mt-4 space-y-3">
            {bundle.celebrations.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={`${item.startDate} - ${item.endDate} · ${item.category || item.type || "custom"}`}
                actions={[
                  <button
                    key="publish"
                    onClick={async () => { await updateSimpleDoc("special_celebrations", item.id, { isPublished: !item.isPublished, status: item.isPublished ? "draft" : "published" }); await load(); }}
                    className={ghostBtn}
                  >
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>,
                  <button key="delete" onClick={async () => { await deleteSimpleDoc("special_celebrations", item.id); await load(); }} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="7. Regular Schedule">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={scheduleForm.dayName} onChange={(e) => setScheduleForm((v) => ({ ...v, dayName: e.target.value }))} placeholder="Day name" className={inputClass} />
            <input value={scheduleForm.time} onChange={(e) => setScheduleForm((v) => ({ ...v, time: e.target.value }))} placeholder="HH:mm" className={inputClass} />
          </div>
          <input value={scheduleForm.label} onChange={(e) => setScheduleForm((v) => ({ ...v, label: e.target.value }))} placeholder="Label" className={inputClass} />
          <button onClick={createSchedule} className={primaryBtn}>Create schedule</button>
          <div className="mt-4 space-y-3">
            {bundle.schedules.map((item) => (
              <ListRow
                key={item.id}
                title={item.label || item.dayName}
                subtitle={`${item.dayName} · ${item.time}`}
                actions={[
                  <button key="delete" onClick={async () => { await deleteSimpleDoc("service_schedules", item.id); await load(); }} className={dangerBtn}>Delete</button>,
                ]}
              />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function ListRow({ title, subtitle, actions }: { title: string; subtitle: string; actions: ReactNode[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-black text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200";
const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200";
const primaryBtn = "rounded-2xl bg-teal-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-teal-700";
const ghostBtn = "rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200";
const dangerBtn = "rounded-2xl bg-rose-100 px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-200";
