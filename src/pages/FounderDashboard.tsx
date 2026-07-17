/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { formatDate, founderLevelLabel, getFounderByUserId, getLatestFounderApplication, maskReference, qrCodeUrl, verificationUrl } from "../lib/founders";
import { useAuthUser } from "../lib/useAuthUser";
import { setPageMeta } from "../lib/seo";

export default function FounderDashboard() {
  const { user, loading } = useAuthUser();
  const [application, setApplication] = useState<any>(null);
  const [founder, setFounder] = useState<any>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: "Founder Dashboard | Cele One",
      description: "Manage your Cele One Founder's Pass.",
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const [app, found] = await Promise.all([getLatestFounderApplication(user.uid), getFounderByUserId(user.uid)]);
      setApplication(app);
      setFounder(found);
      if (found) {
        const snap = await getDocs(query(collection(db, "founderBenefits"), where("active", "==", true), limit(20))).catch(() => null);
        setBenefits(snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      }
      setBusy(false);
    })();
  }, [user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login?returnTo=/founders/dashboard" replace />;
  if (busy) return <Skeleton />;

  if (!application && !founder) {
    return (
      <StateShell title="Vous n'avez pas encore active votre Founder's Pass." desc="Achetez le pass via Chariow, puis soumettez votre activation.">
        <Link to="/founders/activate" className="rounded-2xl bg-[#2FA5A9] px-5 py-3 text-sm font-extrabold text-white">Activer mon pass</Link>
      </StateShell>
    );
  }

  if (application?.status === "pending" && !founder) {
    return (
      <StateShell title="Verification en cours" desc="Votre demande est en attente de verification manuelle ou Chariow.">
        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Submission date" value={formatDate(application.createdAt)} />
          <Info label="Claimed amount" value={`${application.claimedAmount || "-"} ${application.claimedCurrency || ""}`} />
          <Info label="Order reference" value={maskReference(application.chariowOrderReference)} />
        </div>
        <a href="mailto:support@celeonetv.com" className="mt-4 inline-flex rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700">Contact support</a>
      </StateShell>
    );
  }

  if (application?.status === "rejected" && !founder) {
    return (
      <StateShell title="Activation rejetee" desc={application.rejectionReason || "Veuillez contacter Cele One pour plus d'informations."}>
        <Link to="/founders/activate" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Resubmit</Link>
      </StateShell>
    );
  }

  if (!founder) {
    return (
      <StateShell title="Activation en attente" desc="Aucun pass actif n'est encore associe a votre compte.">
        <Link to="/founders/activate" className="rounded-2xl bg-[#2FA5A9] px-5 py-3 text-sm font-extrabold text-white">Activer mon pass</Link>
      </StateShell>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <FounderPassCard founder={founder} />
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-[#2FA5A9]">Founder's Pass</div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">{founder.displayName}</h1>
              <p className="mt-1 text-sm font-bold text-slate-600">{founder.publicFounderId}</p>
            </div>
            <Status status={founder.status} />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Info label="Founder level" value={founderLevelLabel(founder.founderLevel)} />
            <Info label="Joined date" value={formatDate(founder.joinedAt)} />
            <Info label="Active status" value={String(founder.status || "active")} />
            <Info label="Public recognition" value={founder.publicRecognitionConsent ? "Enabled" : "Disabled"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => window.print()} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Download pass</button>
            <Link to="/founders/certificate" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700">Download certificate</Link>
            <button onClick={() => navigator.clipboard?.writeText(verificationUrl(founder.publicFounderId))} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700">Share verification link</button>
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Mes avantages", "Mes invitations", "Evenements disponibles", "Coulisses et visites", "Actualites reservees", "Historique de mes participations", "Parametres de reconnaissance publique", "Assistance"].map((title) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-base font-black text-slate-900">{title}</div>
            <div className="mt-2 text-sm font-semibold text-slate-600">{benefits.length ? "Eligible" : "Aucune entree disponible pour le moment."}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function FounderPassCard({ founder }: { founder: any }) {
  const publicId = String(founder.publicFounderId || "");
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-[#092f33] via-[#2FA5A9] to-[#0f766e] p-6 text-white shadow-xl print:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-black">CELE ONE</div>
        <Status status={founder.status} light />
      </div>
      <div className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-white/75">Founder's Pass</div>
      <div className="mt-1 text-2xl font-black">FOUNDING SUPPORTER</div>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/15">
          {founder.profilePhotoUrl ? <img src={founder.profilePhotoUrl} className="h-full w-full object-cover" /> : <span className="text-2xl font-black">{String(founder.firstName || "F").slice(0, 1)}</span>}
        </div>
        <div>
          <div className="text-xl font-black">{founder.displayName}</div>
          <div className="mt-1 font-mono text-sm font-bold text-white/80">{publicId}</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <CardStat label="Founder Level" value={founderLevelLabel(founder.founderLevel)} />
        <CardStat label="Member since" value={new Date().getFullYear().toString()} />
      </div>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div className="text-sm font-extrabold">Verified Founder</div>
        <img src={qrCodeUrl(publicId)} alt="Founder verification QR code" className="h-28 w-28 rounded-2xl bg-white p-2" />
      </div>
      <div className="mt-4 text-xs font-semibold text-white/70">Scan to verify this pass in the official Cele One database.</div>
    </div>
  );
}

function StateShell({ title, desc, children }: { title: string; desc: string; children: any }) {
  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">{desc}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 font-extrabold text-slate-900">{value}</div></div>;
}

function CardStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/10 p-3"><div className="text-[10px] font-black uppercase text-white/60">{label}</div><div className="font-black">{value}</div></div>;
}

function Status({ status, light }: { status?: string; light?: boolean }) {
  const active = status === "active";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${light ? "bg-white/15 text-white" : active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{status || "active"}</span>;
}

function Skeleton() {
  return <div className="py-8"><div className="h-44 animate-pulse rounded-[2rem] bg-slate-100" /></div>;
}
