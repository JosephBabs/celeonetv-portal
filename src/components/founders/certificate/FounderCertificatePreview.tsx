import { FounderCertificateStatus } from "./FounderCertificateStatus";

export function FounderCertificatePreview({
  documentUrl,
  mode = "pdf",
  title,
  status,
  zoom,
}: {
  documentUrl: string;
  mode?: "pdf" | "image";
  title: string;
  status?: string;
  zoom: number;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-[#0f2f33] p-4 text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Apercu certificat</div>
          <div className="mt-1 text-lg font-black">{title}</div>
        </div>
        <FounderCertificateStatus status={status} />
      </div>
      <div className="overflow-auto rounded-[1.5rem] bg-[#092327] p-4">
        <div className="mx-auto origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})`, width: "100%", maxWidth: 1100 }}>
          {documentUrl && mode === "pdf" ? (
            <iframe
              src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title="Certificat fondateur Cele One"
              className="aspect-square w-full rounded-[1rem] bg-white shadow-2xl"
            />
          ) : documentUrl ? (
            <img src={documentUrl} alt="Certificat fondateur Cele One" className="w-full rounded-[1rem] bg-white shadow-2xl" />
          ) : <div className="aspect-square animate-pulse rounded-[1rem] bg-white/10" />}
        </div>
      </div>
    </section>
  );
}
