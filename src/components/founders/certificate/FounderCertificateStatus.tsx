import { certificateStatusLabel } from "../../../lib/founderCertificateUtils";

export function FounderCertificateStatus({ status }: { status?: string }) {
  const normalized = String(status || "active").toLowerCase();
  const classes = normalized === "revoked"
    ? "bg-rose-100 text-rose-700"
    : normalized === "suspended"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${classes}`}>{certificateStatusLabel(status)}</span>;
}
