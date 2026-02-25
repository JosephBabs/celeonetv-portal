/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

type Tab = "register" | "results";

function genIdentifier() {
  return "J" + Date.now().toString(36).slice(-6).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

const phaseOrder: Record<string, number> = {
  prelim: 0,
  preselection: 1,
  selection: 2,
  final: 3,
};

export default function Jeunesse() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("register");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [identifier, setIdentifier] = useState("");
  const [resultRows, setResultRows] = useState<any[]>([]);
  const [savedIdentifier, setSavedIdentifier] = useState("");
  const [reg, setReg] = useState({
    firstName: "",
    lastName: "",
    age: "",
    currentClass: "",
    academicYear: "",
    parishName: "",
    parishShepherdNames: "",
    mainTeacherNames: "",
    shepherdPhone: "",
    teacherPhone: "",
    contactEmail: "",
    country: "",
    province: "",
    city: "",
    region: "",
    subRegion: "",
  });

  useEffect(() => {
    setPageMeta({
      title: t("jeunesse.meta_title", "Amis de Jesus | Jeunesse"),
      description: t("jeunesse.meta_desc", "Register children online and verify concours results."),
    });
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "jeunesse_settings", "global"));
        const s = snap.exists() ? snap.data() : {};
        setSettings(s || {});
      } catch {
        setSettings({});
      }
    })();
  }, []);

  const years = useMemo(() => {
    const y = Object.keys(settings?.years || {});
    const current = String(new Date().getFullYear());
    if (!y.includes(current)) y.push(current);
    return y.sort((a, b) => b.localeCompare(a));
  }, [settings]);

  const registerChild = async () => {
    const required = ["firstName", "lastName", "age", "currentClass", "academicYear", "parishName", "contactEmail", "country", "city"];

    for (const key of required) {
      if (!String((reg as any)[key] || "").trim()) {
        alert(t("jeunesse.required", "Please fill all required fields."));
        return;
      }
    }

    setLoading(true);
    try {
      const newId = genIdentifier();
      await addDoc(collection(db, "jeunesse_children"), {
        identifier: newId,
        firstName: reg.firstName.trim(),
        lastName: reg.lastName.trim(),
        age: Number(reg.age || 0),
        currentClass: reg.currentClass.trim(),
        academicYear: reg.academicYear.trim(),
        parishName: reg.parishName.trim(),
        parishShepherdNames: reg.parishShepherdNames.trim(),
        mainTeacherNames: reg.mainTeacherNames.trim(),
        shepherdPhone: reg.shepherdPhone.trim(),
        teacherPhone: reg.teacherPhone.trim(),
        contactEmail: reg.contactEmail.trim(),
        country: reg.country.trim(),
        province: reg.province.trim(),
        city: reg.city.trim(),
        region: reg.region.trim(),
        subRegion: reg.subRegion.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSavedIdentifier(newId);
      setReg({
        firstName: "",
        lastName: "",
        age: "",
        currentClass: "",
        academicYear: "",
        parishName: "",
        parishShepherdNames: "",
        mainTeacherNames: "",
        shepherdPhone: "",
        teacherPhone: "",
        contactEmail: "",
        country: "",
        province: "",
        city: "",
        region: "",
        subRegion: "",
      });
    } catch (e: any) {
      alert(e?.message || t("jeunesse.failed_register", "Failed to register."));
    } finally {
      setLoading(false);
    }
  };

  const verifyResults = async () => {
    const idf = identifier.trim();
    if (!idf) return alert(t("jeunesse.enter_identifier", "Enter identifier."));

    setChecking(true);
    setResultRows([]);
    try {
      let rows: any[] = [];
      try {
        const snap = await getDocs(query(collection(db, "jeunesse_results"), where("identifier", "==", idf), where("year", "==", year)));
        rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        const snap = await getDocs(query(collection(db, "jeunesse_results"), where("identifier", "==", idf)));
        rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r: any) => String(r.year || "") === year);
      }

      rows.sort((a, b) => (phaseOrder[a.phase] ?? 99) - (phaseOrder[b.phase] ?? 99));
      setResultRows(rows);
      if (rows.length === 0) alert(t("jeunesse.not_found", "No results found for this identifier/year."));
    } catch (e: any) {
      alert(e?.message || t("jeunesse.failed_verify", "Failed to check results."));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">{t("jeunesse.title", "Amis de Jesus - Jeunesse")}</div>
        <div className="mt-1 text-slate-600">{t("jeunesse.subtitle", "Online child registration and concours results verification.")}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setTab("register")} className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${tab === "register" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>{t("jeunesse.tab_register", "Registration")}</button>
          <button onClick={() => setTab("results")} className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${tab === "results" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>{t("jeunesse.tab_results", "Verify Results")}</button>
        </div>
      </div>

      {tab === "register" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-black">{t("jeunesse.reg_title", "Child Registration")}</div>
          {savedIdentifier ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {t("jeunesse.reg_success", "Registration successful. Child identifier:")} <span className="font-black">{savedIdentifier}</span>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input value={reg.firstName} onChange={(v) => setReg((s) => ({ ...s, firstName: v }))} placeholder="First name*" />
            <Input value={reg.lastName} onChange={(v) => setReg((s) => ({ ...s, lastName: v }))} placeholder="Last name*" />
            <Input value={reg.age} onChange={(v) => setReg((s) => ({ ...s, age: v }))} placeholder="Age*" />
            <Input value={reg.currentClass} onChange={(v) => setReg((s) => ({ ...s, currentClass: v }))} placeholder="Current class*" />
            <Input value={reg.academicYear} onChange={(v) => setReg((s) => ({ ...s, academicYear: v }))} placeholder="Academic year*" />
            <Input value={reg.parishName} onChange={(v) => setReg((s) => ({ ...s, parishName: v }))} placeholder="Parish name*" />
            <Input value={reg.parishShepherdNames} onChange={(v) => setReg((s) => ({ ...s, parishShepherdNames: v }))} placeholder="Parish shepherd names" />
            <Input value={reg.mainTeacherNames} onChange={(v) => setReg((s) => ({ ...s, mainTeacherNames: v }))} placeholder="Main teacher names" />
            <Input value={reg.shepherdPhone} onChange={(v) => setReg((s) => ({ ...s, shepherdPhone: v }))} placeholder="Shepherd phone" />
            <Input value={reg.teacherPhone} onChange={(v) => setReg((s) => ({ ...s, teacherPhone: v }))} placeholder="Teacher phone" />
            <Input value={reg.contactEmail} onChange={(v) => setReg((s) => ({ ...s, contactEmail: v }))} placeholder="Contact email*" />
            <Input value={reg.country} onChange={(v) => setReg((s) => ({ ...s, country: v }))} placeholder="Country*" />
            <Input value={reg.province} onChange={(v) => setReg((s) => ({ ...s, province: v }))} placeholder="Province" />
            <Input value={reg.city} onChange={(v) => setReg((s) => ({ ...s, city: v }))} placeholder="City*" />
            <Input value={reg.region} onChange={(v) => setReg((s) => ({ ...s, region: v }))} placeholder="Region" />
            <Input value={reg.subRegion} onChange={(v) => setReg((s) => ({ ...s, subRegion: v }))} placeholder="Sub-region" />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={registerChild} disabled={loading} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">{loading ? t("jeunesse.submitting", "Submitting...") : t("jeunesse.submit", "Submit Registration")}</button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-black">{t("jeunesse.verify_title", "Concours Results Verification")}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <Input value={identifier} onChange={setIdentifier} placeholder={t("jeunesse.identifier_placeholder", "Enter child identifier")} />
            <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={verifyResults} disabled={checking} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">{checking ? t("jeunesse.checking", "Checking...") : t("jeunesse.verify", "Verify")}</button>
          </div>

          <div className="mt-4 space-y-2">
            {resultRows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-black text-slate-900">{String(r.phase || "phase").toUpperCase()}</div>
                  <div className={`rounded-full px-3 py-1 text-xs font-black ${r.passed || r.status === "passed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{r.status || (r.passed ? "passed" : "failed")}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700">{t("jeunesse.avg", "Average")}: {r.average ?? "—"}</div>
                <div className="text-sm text-slate-700">{t("jeunesse.notes", "Notes")}: {r.notes || "—"}</div>
              </div>
            ))}
            {resultRows.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">{t("jeunesse.no_results", "No result displayed.")}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />;
}
