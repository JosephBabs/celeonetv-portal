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
          const [preview, pdf] = await Promise.all([loadFounderAsset("certificatePreview"), loadFounderAsset("certificatePdf")]);
          if (!active) return;
          setPreviewUrl(preview);
          setPdfUrl(pdf);
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
