import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FounderCertificateActions } from "../components/founders/certificate/FounderCertificateActions";
import { FounderCertificateInfoPanel } from "../components/founders/certificate/FounderCertificateInfoPanel";
import { FounderCertificatePreview } from "../components/founders/certificate/FounderCertificatePreview";
import { adminFounderAction, getAdminFounderCredentials, loadAdminFounderAsset } from "../lib/founderCredentialsApi";
import { setPageMeta } from "../lib/seo";

export default function AdminFounderCertificate() {
  const { founderId = "" } = useParams();
  const [busy, setBusy] = useState(true);
  const [founder, setFounder] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [zoom, setZoom] = useState(1);

  const load = async () => {
    if (!founderId) return;
    setBusy(true);
    try {
      const data = await getAdminFounderCredentials(founderId);
      setFounder(data.founder);
      setHistory(data.history || []);
      if (data.founder) {
        const [preview, pdf] = await Promise.all([
          loadAdminFounderAsset(founderId, "certificatePreview"),
          loadAdminFounderAsset(founderId, "certificatePdf"),
        ]);
        setPreviewUrl(preview);
        setPdfUrl(pdf);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setPageMeta({ title: "Admin certificat fondateur | Cele One", description: "Apercu et regeneration admin du certificat fondateur." });
    void load();
  }, [founderId]);

  if (busy) return <div className="py-10 text-center text-slate-600">Chargement...</div>;
  if (!founder) return <div className="py-10 text-center text-slate-600">Aucun fondateur trouve.</div>;

  return (
    <div className="space-y-6 py-6">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <FounderCertificatePreview documentUrl={previewUrl} mode="image" title={String(founder.displayName || "Certificat")} status={String(founder.certificateStatus || founder.status || "active")} zoom={zoom} />
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
            <div className="mt-4 grid gap-3">
              <button onClick={() => adminFounderAction({ action: "regenerate", founderId }).then(load)} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white">Regenerer</button>
              <button onClick={() => adminFounderAction({ action: "regenerate_qr", founderId }).then(load)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Regenerer le QR</button>
              <button onClick={() => adminFounderAction({ action: "revoke", founderId, note: prompt("Motif de revocation") || "" }).then(load)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white">Revoquer</button>
              <button onClick={() => adminFounderAction({ action: "restore", founderId, note: prompt("Motif de restauration") || "" }).then(load)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Restaurer</button>
            </div>
            <Link to="/admin/founders" className="mt-4 inline-flex text-sm font-extrabold text-[#2FA5A9] hover:underline">Retour admin Founders</Link>
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-black text-slate-900">Historique de generation</div>
        <div className="mt-4 space-y-3">
          {history.length ? history.map((entry, index) => (
            <div key={`${entry.createdAt || index}`} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">{String(entry.action || "-")} • {String(entry.credentialType || "-")}</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">{String(entry.createdAt || "-")}</div>
            </div>
          )) : <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Aucun historique disponible.</div>}
        </div>
      </section>
    </div>
  );
}
