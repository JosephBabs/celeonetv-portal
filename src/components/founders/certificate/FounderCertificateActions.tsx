export function FounderCertificateActions({
  onZoomIn,
  onZoomOut,
  onReset,
  onOpenFull,
  onDownloadPdf,
  onCopyVerification,
  onPrint,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onOpenFull: () => void;
  onDownloadPdf: () => void;
  onCopyVerification: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="grid gap-3">
      <button onClick={onZoomIn} className="rounded-2xl bg-[#123b40] px-4 py-3 text-sm font-extrabold text-white">Zoom avant</button>
      <button onClick={onZoomOut} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Zoom arriere</button>
      <button onClick={onReset} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Reinitialiser</button>
      <button onClick={onOpenFull} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Plein ecran</button>
      <button onClick={onDownloadPdf} className="rounded-2xl bg-[#2FA5A9] px-4 py-3 text-sm font-extrabold text-white">Telecharger le PDF</button>
      <button onClick={onPrint} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Imprimer</button>
      <button onClick={onCopyVerification} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700">Copier le lien de verification</button>
    </div>
  );
}
