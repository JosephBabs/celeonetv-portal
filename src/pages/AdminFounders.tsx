import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminFounderAction } from "../lib/founderCredentialsApi";
import { founderLevelLabel, formatDate, rejectFounderApplication, updateFounderStatus } from "../lib/founders";
import { db } from "../lib/firebase";
import { useUserRole } from "../lib/useUserRole";
import { setPageMeta } from "../lib/seo";

type Tab = "overview" | "applications" | "payments" | "founders" | "benefits" | "invitations" | "events" | "announcements" | "wall" | "configuration" | "audit";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "applications", label: "Applications" },
  { id: "payments", label: "Payments" },
  { id: "founders", label: "Founders" },
  { id: "benefits", label: "Benefits" },
  { id: "invitations", label: "Invitations" },
  { id: "events", label: "Events" },
  { id: "announcements", label: "Announcements" },
  { id: "wall", label: "Founder Wall" },
  { id: "configuration", label: "Configuration" },
  { id: "audit", label: "Audit Logs" },
];

export default function AdminFounders() {
  const { user } = useUserRole();
  const [tab, setTab] = useState<Tab>("overview");
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [benefitDraft, setBenefitDraft] = useState({ title: "", description: "", type: "event", location: "", active: true });
  const [announcementDraft, setAnnouncementDraft] = useState({ title: "", summary: "", content: "", published: false });

  async function load() {
    setLoading(true);
    const [apps, pays, reservs, fnds, bens, anns, logs] = await Promise.all([
      loadCollection("founderApplications"),
      loadCollection("founderPayments"),
      loadCollection("founderReservations"),
      loadCollection("founders"),
      loadCollection("founderBenefits"),
      loadCollection("founderAnnouncements"),
      loadCollection("founderAuditLogs"),
    ]);
    setApplications(apps);
    setPayments(pays);
    setReservations(reservs);
    setFounders(fnds);
    setBenefits(bens);
    setAnnouncements(anns);
    setAudit(logs);
    setLoading(false);
  }

  useEffect(() => {
    setPageMeta({ title: "Admin Founder's Pass | Cele One", description: "Manage Founder's Pass applications and members." });
    load();
  }, []);

  const stats = useMemo(() => {
    const totalVerified = payments.filter((p) => p.verified).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      applications: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      reservedFounderIds: reservations.length,
      pendingFounderIds: reservations.filter((r) => r.activationStatus === "awaiting_payment" || r.status === "not_verified").length,
      activeFounders: founders.filter((f) => f.status === "active").length,
      inactiveFounders: founders.filter((f) => f.status !== "active").length,
      totalVerified,
      pendingInvitations: 0,
      upcomingEvents: benefits.filter((b) => b.active).length,
    };
  }, [applications, benefits, founders, payments, reservations]);

  const approve = async (applicationId: string) => {
    if (!confirm("Approve this Founder application and generate Founder ID?")) return;
    await adminFounderAction({ action: "approve", applicationId });
    await load();
  };

  const reject = async (applicationId: string) => {
    const reason = prompt("Rejection reason");
    if (!reason) return;
    await rejectFounderApplication(applicationId, user?.uid || "", reason);
    await load();
  };

  const saveBenefit = async () => {
    if (!benefitDraft.title.trim()) return alert("Title required");
    await addDoc(collection(db, "founderBenefits"), {
      ...benefitDraft,
      eligibleLevels: ["supporter", "builder", "pioneer", "legacy"],
      online: false,
      registrationRequired: true,
      capacity: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setBenefitDraft({ title: "", description: "", type: "event", location: "", active: true });
    await load();
  };

  const saveAnnouncement = async () => {
    if (!announcementDraft.title.trim()) return alert("Title required");
    await addDoc(collection(db, "founderAnnouncements"), {
      ...announcementDraft,
      targetLevels: ["supporter", "builder", "pioneer", "legacy"],
      publishedAt: announcementDraft.published ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setAnnouncementDraft({ title: "", summary: "", content: "", published: false });
    await load();
  };

  return (
    <div className="space-y-5 py-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#2FA5A9]">Admin</div>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Founder's Pass</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Applications, payments, founders, benefits, invitations, events and audit logs.</p>
          </div>
          <button onClick={load} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">Refresh</button>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-extrabold ${tab === item.id ? "bg-[#2FA5A9] text-white" : "bg-slate-100 text-slate-700"}`}>{item.label}</button>
          ))}
        </div>
      </section>

      {loading ? <div className="rounded-3xl bg-slate-100 p-6">Loading...</div> : null}
      {!loading && tab === "overview" ? <Overview stats={stats} founders={founders} /> : null}
      {!loading && tab === "applications" ? <Applications rows={applications} onApprove={approve} onReject={reject} /> : null}
      {!loading && tab === "payments" ? <PaymentsTable payments={payments} reservations={reservations} founders={founders} /> : null}
      {!loading && tab === "founders" ? <FoundersTable rows={founders} onStatus={(id, status) => updateFounderStatus(id, user?.uid || "", status).then(load)} /> : null}
      {!loading && tab === "benefits" ? <EditorList rows={benefits} draft={benefitDraft} setDraft={setBenefitDraft} onSave={saveBenefit} fields={["title", "description", "type", "location"]} /> : null}
      {!loading && tab === "announcements" ? <EditorList rows={announcements} draft={announcementDraft} setDraft={setAnnouncementDraft} onSave={saveAnnouncement} fields={["title", "summary", "content"]} /> : null}
      {!loading && ["invitations", "events", "wall", "configuration"].includes(tab) ? <Placeholder tab={tab} /> : null}
      {!loading && tab === "audit" ? <Table rows={audit} fields={["action", "entityType", "entityId", "adminId"]} /> : null}
    </div>
  );
}

async function loadCollection(name: string) {
  const snap = await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(100))).catch(async () => getDocs(query(collection(db, name), limit(100))));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function Overview({ stats, founders }: { stats: any; founders: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Object.entries(stats).map(([key, value]) => <Stat key={key} label={key} value={String(value)} />)}
      <Stat label="Founder levels distribution" value={founders.map((f) => founderLevelLabel(f.founderLevel)).join(", ") || "-"} />
    </div>
  );
}

function Applications({ rows, onApprove, onReject }: { rows: any[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-black text-slate-900">{row.firstName} {row.lastName}</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">{row.email} - {row.chariowOrderReference}</div>
              <div className="mt-1 text-sm font-bold text-slate-500">{row.claimedAmount} {row.claimedCurrency} - {row.status}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onApprove(row.id)} disabled={row.status === "approved"} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">Approve</button>
              <button onClick={() => onReject(row.id)} disabled={row.status === "approved"} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTable({ payments, reservations, founders }: { payments: any[]; reservations: any[]; founders: any[] }) {
  const foundersByPublicId = new Map(founders.map((item) => [String(item.publicFounderId || "").trim().toUpperCase(), item]));
  const reservationByPublicId = new Map(reservations.map((item) => [String(item.publicFounderId || "").trim().toUpperCase(), item]));

  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        const founderReferenceId = String(payment.founderReferenceId || "").trim().toUpperCase();
        const reservation = reservationByPublicId.get(founderReferenceId);
        const founder = foundersByPublicId.get(founderReferenceId);
        const saleReference = String(payment.providerSaleId || payment.providerOrderReference || payment.id || "-");
        const amount = [payment.amount, payment.currency].filter(Boolean).join(" ") || "-";
        return (
          <div key={payment.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">{String(payment.provider || "chariow").toUpperCase()}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${payment.verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{payment.verified ? "Verified" : "Pending"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{String(payment.paymentStatus || "-")}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{String(payment.saleStatus || "-")}</span>
                </div>
                <div className="mt-3 text-lg font-black text-slate-900">{payment.customerName || payment.customerEmail || "Paiement Founder"}</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-500 break-all">{saleReference}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{payment.customerEmail || "-"}{payment.customerPhone ? ` - ${payment.customerPhone}` : ""}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Amount</div>
                <div className="mt-1 text-lg font-black text-slate-900">{amount}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{founderLevelLabel(payment.founderLevel)}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AdminInfo label="Founder ID" value={founderReferenceId || "-"} mono />
              <AdminInfo label="Reservation status" value={String(reservation?.activationStatus || reservation?.status || "-")} />
              <AdminInfo label="Founder record" value={String(founder?.status || "-")} />
              <AdminInfo label="Completed" value={formatDate(payment.completedAt || payment.verifiedAt || payment.createdAt)} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <AdminInfo label="Payment doc" value={String(payment.id || "-")} mono />
              <AdminInfo label="Transaction" value={String(payment.providerTransactionId || payment.channel || "-")} mono />
              <AdminInfo label="Method" value={String(payment.paymentMethod || "-")} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {founder?.id ? <Link to={`/admin/founders/members/${founder.id}/certificate`} className="rounded-2xl bg-[#2FA5A9] px-4 py-2 text-xs font-extrabold text-white">Open founder</Link> : null}
              {saleReference && saleReference !== "-" ? <button onClick={() => navigator.clipboard?.writeText(saleReference)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700">Copy sale reference</button> : null}
              {founderReferenceId ? <button onClick={() => navigator.clipboard?.writeText(founderReferenceId)} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700">Copy Founder ID</button> : null}
            </div>
          </div>
        );
      })}
      {payments.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">Aucun paiement Founder pour le moment.</div> : null}
    </div>
  );
}

function FoundersTable({ rows, onStatus }: { rows: any[]; onStatus: (id: string, status: any) => void }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-black text-slate-900">{row.displayName}</div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-500">{row.publicFounderId}</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">{founderLevelLabel(row.founderLevel)} - {row.status} - {formatDate(row.joinedAt)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/founders/members/${row.id}/certificate`} className="rounded-2xl bg-[#2FA5A9] px-3 py-2 text-xs font-extrabold text-white">Certificate</Link>
              {["active", "suspended", "revoked", "inactive"].map((status) => (
                <button key={status} onClick={() => confirm(`Set ${status}?`) && onStatus(row.id, status)} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700">{status}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditorList({ rows, draft, setDraft, onSave, fields }: { rows: any[]; draft: any; setDraft: any; onSave: () => void; fields: string[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="text-lg font-black">Create</div>
        <div className="mt-3 space-y-3">
          {fields.map((field) => <input key={field} value={draft[field] || ""} onChange={(e) => setDraft((d: any) => ({ ...d, [field]: e.target.value }))} placeholder={field} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold" />)}
          <button onClick={onSave} className="rounded-2xl bg-[#2FA5A9] px-5 py-3 text-sm font-extrabold text-white">Save</button>
        </div>
      </div>
      <Table rows={rows} fields={fields} />
    </div>
  );
}

function Table({ rows, fields }: { rows: any[]; fields: string[] }) {
  return <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr>{fields.map((f) => <th key={f} className="p-3">{f}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100">{fields.map((f) => <td key={f} className="p-3 font-semibold text-slate-700">{String(row[f] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}

function AdminInfo({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-bold text-slate-800 ${mono ? "font-mono break-all" : ""}`}>{value || "-"}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-2 text-2xl font-black text-slate-900">{value}</div></div>;
}

function Placeholder({ tab }: { tab: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">The {tab} workflow is scaffolded in the Founder database model. Use Benefits, Announcements, Applications, Payments and Founders tabs for current management.</div>;
}
