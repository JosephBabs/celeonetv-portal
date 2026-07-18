import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FounderCertificateActions } from "../components/founders/certificate/FounderCertificateActions";
import { FounderCertificateInfoPanel } from "../components/founders/certificate/FounderCertificateInfoPanel";
import { FounderCertificatePreview } from "../components/founders/certificate/FounderCertificatePreview";
import { buildFounderCertificatePdf } from "../lib/founderCertificateClient";
import { getFounderByUserId, getLatestFounderApplication, getLatestFounderPayment, verificationUrl } from "../lib/founders";
import { setPageMeta } from "../lib/seo";
import { useAuthUser } from "../lib/useAuthUser";

export default function FounderCertificate() {
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(true);
  const [founder, setFounder] = useState<Record<string, unknown> | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPageMeta({ title: "Certificat fondateur | Cele One", description: "Apercu et telechargement du certificat fondateur Cele One." });
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let objectUrl = "";
    (async () => {
      setBusy(true);
      try {
        let data: Record<string, unknown> | null = await getFounderByUserId(user.uid);
        if (!data) {
          const [application, payment] = await Promise.all([
            getLatestFounderApplication(user.uid).catch(() => null),
            getLatestFounderPayment(user.uid, user.email || "").catch(() => null),
          ]);
          const publicFounderId = String((application as Record<string, unknown> | null)?.publicFounderId || (payment as Record<string, unknown> | null)?.founderReferenceId || "").trim();
          if (publicFounderId) {
            data = {
              ...(application || {}),
              ...(payment || {}),
              displayName: String((application as Record<string, unknown> | null)?.displayName || `${(application as Record<string, unknown> | null)?.firstName || ""} ${(application as Record<string, unknown> | null)?.lastName || ""}` || (payment as Record<string, unknown> | null)?.customerName || user.displayName || "").trim(),
              publicFounderId,
              founderLevel: String((application as Record<string, unknown> | null)?.founderLevel || (payment as Record<string, unknown> | null)?.founderLevel || "supporter"),
              issuedAt: String((application as Record<string, unknown> | null)?.purchaseDate || (payment as Record<string, unknown> | null)?.completedAt || new Date().toISOString()),
              joinedAt: String((application as Record<string, unknown> | null)?.purchaseDate || (payment as Record<string, unknown> | null)?.completedAt || new Date().toISOString()),
              status: "active",
              certificateStatus: "active",
              verificationUrl: verificationUrl(publicFounderId),
            };
          }
        }
        if (!active) return;
        setFounder(data);
        if (data) {
          const pdfBlob = await buildFounderCertificatePdf(data);
          if (!active) return;
          objectUrl = URL.createObjectURL(pdfBlob);
          setPdfUrl(objectUrl);
        }
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login?returnTo=/founders/certificate" replace />;
  if (busy) return <div className="py-10 text-center text-slate-600">Chargement du certificat...</div>;
  if (!founder) return <Navigate to="/founders/dashboard" replace />;

  return (
    <div className="space-y-6 py-6">
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
        <FounderCertificatePreview documentUrl={pdfUrl} mode="pdf" title={String(founder.displayName || "Mon certificat")} status={String(founder.certificateStatus || founder.status || "active")} zoom={zoom} />
        <div className="space-y-4">
          <FounderCertificateInfoPanel founder={founder} />
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <FounderCertificateActions
              onZoomIn={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
              onZoomOut={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))}
              onReset={() => setZoom(1)}
              onOpenFull={() => pdfUrl && window.open(pdfUrl, "_blank", "noopener,noreferrer")}
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
