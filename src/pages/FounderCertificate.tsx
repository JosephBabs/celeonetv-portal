import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FounderCertificateActions } from "../components/founders/certificate/FounderCertificateActions";
import { FounderCertificateInfoPanel } from "../components/founders/certificate/FounderCertificateInfoPanel";
import { FounderCertificatePreview } from "../components/founders/certificate/FounderCertificatePreview";
import { loadFounderAsset, getFounderCredentials } from "../lib/founderCredentialsApi";
import { setPageMeta } from "../lib/seo";
import { useAuthUser } from "../lib/useAuthUser";

export default function FounderCertificate() {
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(true);
  const [founder, setFounder] = useState<Record<string, unknown> | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pendingCertificate, setPendingCertificate] = useState(false);

  useEffect(() => {
    setPageMeta({ title: "Certificat fondateur | Cele One", description: "Apercu et telechargement du certificat fondateur Cele One." });
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setBusy(true);
      try {
        const data = await getFounderCredentials();
        if (!active) return;
        setFounder(data.founder);
        if (data.founder) {
          const [preview, pdf] = await Promise.all([
            loadFounderAsset("certificatePreview").catch(() => ""),
            loadFounderAsset("certificatePdf").catch(() => ""),
          ]);
          if (!active) return;
          setPreviewUrl(preview);
          setPdfUrl(pdf);
          setPendingCertificate(!preview || !pdf || String((data.founder as Record<string, unknown>).credentialStatus || "") === "pending_storage");
        }
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login?returnTo=/founders/certificate" replace />;
  if (busy) return <div className="py-10 text-center text-slate-600">Chargement du certificat...</div>;
  if (!founder) return <Navigate to="/founders/dashboard" replace />;
  if (pendingCertificate) {
    return (
      <div className="space-y-6 py-6">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
          <div className="text-xs font-black uppercase tracking-wide text-amber-700">Founder certificate</div>
          <h1 className="mt-2 text-3xl font-black text-amber-950">Certificat en attente</h1>
          <p className="mt-3 text-sm font-semibold text-amber-900">Votre Founder's Pass est bien actif. Le certificat sera disponible des que l'acces Firebase Storage sera configure.</p>
          <Link to="/founders/dashboard" className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Retour au tableau de bord</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
        <FounderCertificatePreview imageUrl={previewUrl} title={String(founder.displayName || "Mon certificat")} status={String(founder.certificateStatus || founder.status || "active")} zoom={zoom} />
        <div className="space-y-4">
          <FounderCertificateInfoPanel founder={founder} />
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <FounderCertificateActions
              onZoomIn={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
              onZoomOut={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))}
              onReset={() => setZoom(1)}
              onOpenFull={() => previewUrl && window.open(previewUrl, "_blank", "noopener,noreferrer")}
              onDownloadPdf={() => pdfUrl && window.open(pdfUrl, "_blank", "noopener,noreferrer")}
              onCopyVerification={() => navigator.clipboard?.writeText(String(founder.verificationUrl || ""))}
              onPrint={() => pdfUrl && window.open(pdfUrl, "_blank", "noopener,noreferrer")}
            />
            <Link to="/founders/dashboard" className="mt-4 inline-flex text-sm font-extrabold text-[#2FA5A9] hover:underline">Retour au tableau de bord</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
