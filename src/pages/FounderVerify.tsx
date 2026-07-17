/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDate, founderLevelLabel, getFounderByPublicId } from "../lib/founders";
import { setPageMeta } from "../lib/seo";

export default function FounderVerify() {
  const { founderId } = useParams();
  const [founder, setFounder] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(founderId));

  useEffect(() => {
    setPageMeta({ title: "Verifier Founder's Pass | Cele One", description: "Verification publique Founder's Pass." });
  }, []);

  useEffect(() => {
    if (!founderId) return;
    (async () => {
      setLoading(true);
      setFounder(await getFounderByPublicId(founderId));
      setLoading(false);
    })();
  }, [founderId]);

  if (!founderId) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <h1 className="text-3xl font-black text-slate-900">Verifier un pass</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">Entrez un lien complet de verification ou scannez le QR code du Founder's Pass.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-center text-slate-600">Verification...</div>;
  const active = founder?.status === "active";

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className={`rounded-[2rem] border p-8 ${founder ? active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
        <div className="text-xs font-black uppercase tracking-wide text-[#2FA5A9]">Cele One Founder's Pass</div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {!founder ? "Pass invalide ou non enregistre" : active ? "Founder's Pass verifie" : "Pass actuellement inactif"}
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-700">
          {!founder
            ? "Ce numero de pass n'existe pas dans la base officielle Cele One."
            : active
              ? "Ce pass appartient a un membre fondateur enregistre dans la base officielle Cele One."
              : "Veuillez contacter Cele One pour plus d'informations."}
        </p>
        {founder ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Info label="Founder display name" value={founder.displayName || "-"} />
            <Info label="Public Founder ID" value={founder.publicFounderId || "-"} />
            <Info label="Founder level" value={founderLevelLabel(founder.founderLevel)} />
            <Info label="Joined year" value={formatDate(founder.joinedAt).slice(-4) || "-"} />
            <Info label="Current status" value={founder.status || "-"} />
          </div>
        ) : null}
        <Link to="/founders" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Retour Founder's Pass</Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/70 p-4"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 font-extrabold text-slate-900">{value}</div></div>;
}
