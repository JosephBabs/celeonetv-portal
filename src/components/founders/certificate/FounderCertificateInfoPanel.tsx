import { FounderCertificateStatus } from "./FounderCertificateStatus";

export function FounderCertificateInfoPanel({ founder }: { founder: Record<string, unknown> }) {
  const publicFounderId = String(founder.publicFounderId || "-");
  const certificateNumber = String(founder.certificateNumber || (publicFounderId !== "-" ? `CERT-${publicFounderId}` : "-"));
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#2FA5A9]">Mes identifiants fondateurs</div>
      <h2 className="mt-2 text-2xl font-black text-slate-900">{String(founder.displayName || "-")}</h2>
      <div className="mt-3"><FounderCertificateStatus status={String(founder.certificateStatus || founder.status || "active")} /></div>
      <div className="mt-5 grid gap-3">
        <Detail label="Founder ID" value={publicFounderId} />
        <Detail label="Certificate number" value={certificateNumber} />
        <Detail label="Founder level" value={String(founder.founderLevel || "-")} />
        <Detail label="Issue date" value={String(founder.issuedAt || founder.certificateIssuedAt || "-")} />
        <Detail label="Version" value={String(founder.certificateVersion || 1)} />
      </div>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 font-extrabold text-slate-900">{value}</div></div>;
}
