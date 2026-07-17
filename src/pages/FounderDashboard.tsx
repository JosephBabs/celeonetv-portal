/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FounderCertificateStatus } from "../components/founders/certificate/FounderCertificateStatus";
import { db } from "../lib/firebase";
import { getFounderCredentials, loadFounderAsset, retryFounderCredentialGeneration } from "../lib/founderCredentialsApi";
import { formatDate, founderLevelLabel, getFounderByUserId, getLatestFounderApplication, maskReference, qrCodeUrl, verificationUrl } from "../lib/founders";
import { useAuthUser } from "../lib/useAuthUser";
import { setPageMeta } from "../lib/seo";

export default function FounderDashboard() {
  const { user, loading } = useAuthUser();
  const [application, setApplication] = useState<any>(null);
  const [founder, setFounder] = useState<any>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [credentialFounder, setCredentialFounder] = useState<any>(null);
  const [certificateThumb, setCertificateThumb] = useState("");
  const [qrPreview, setQrPreview] = useState("");
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
        const credentialData = await getFounderCredentials().catch(() => null);
        setCredentialFounder(credentialData?.founder || null);
        if (credentialData?.founder) {
          const [certificateImage, qrImage] = await Promise.all([
            loadFounderAsset("certificatePreview").catch(() => ""),
            loadFounderAsset("qrCode").catch(() => ""),
          ]);
          setCertificateThumb(certificateImage);
          setQrPreview(qrImage);
        }
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

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#2FA5A9]">Mes identifiants fondateurs</div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">{credentialFounder?.displayName || founder.displayName}</h2>
              <div className="mt-2"><FounderCertificateStatus status={credentialFounder?.certificateStatus || founder.status} /></div>
            </div>
            {qrPreview ? <img src={qrPreview} alt="QR de verification du certificat fondateur" className="h-24 w-24 rounded-2xl border border-slate-200 bg-white p-2" /> : null}
          </div>

          {credentialFounder?.credentialStatus === "generating" ? (
            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <div className="text-lg font-black text-slate-900">Vos identifiants sont en cours de generation</div>
              <p className="mt-2 text-sm font-semibold text-slate-600">Votre certificat et votre carte Founder seront disponibles des que le processus sera termine.</p>
            </div>
          ) : credentialFounder?.credentialGenerationError ? (
            <div className="mt-5 rounded-3xl bg-rose-50 p-5">
              <div className="text-lg font-black text-rose-900">La generation de vos identifiants a rencontre un probleme.</div>
              <p className="mt-2 text-sm font-semibold text-rose-700">Notre equipe a ete informee. Vous pouvez reessayer ou contacter le support.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => retryFounderCredentialGeneration().then(() => window.location.reload())} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white">Reessayer</button>
                <a href="mailto:support@celeonetv.com" className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-extrabold text-rose-700">Contacter le support</a>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                {certificateThumb ? <img src={certificateThumb} alt="Miniature du certificat fondateur" className="w-full" /> : <div className="aspect-[1.414/1] animate-pulse bg-slate-100" />}
              </div>
              <div className="grid gap-3 content-start">
                <Info label="Founder ID" value={credentialFounder?.publicFounderId || founder.publicFounderId} />
                <Info label="Founder level" value={founderLevelLabel(credentialFounder?.founderLevel || founder.founderLevel)} />
                <Info label="Certificate number" value={String(credentialFounder?.certificateNumber || "-")} />
                <Info label="Issue date" value={formatDate(credentialFounder?.issuedAt || founder.joinedAt)} />
                <div className="flex flex-wrap gap-3">
                  <Link to="/founders/certificate" className="rounded-2xl bg-[#2FA5A9] px-4 py-3 text-sm font-extrabold text-white">Voir le certificat</Link>
                  <button onClick={() => certificateThumb && window.open(certificateThumb, "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Afficher le QR code</button>
                  <button onClick={() => navigator.clipboard?.writeText(String(credentialFounder?.verificationUrl || verificationUrl(founder.publicFounderId)))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Copier le lien de verification</button>
                </div>
              </div>
            </div>
          )}
        </div>
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
