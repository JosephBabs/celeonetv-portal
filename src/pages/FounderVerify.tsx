/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FounderCertificateStatus } from "../components/founders/certificate/FounderCertificateStatus";
import { formatDate, founderLevelLabel, getFounderByPublicId } from "../lib/founders";
import { setPageMeta } from "../lib/seo";

export default function FounderVerify() {
  const { founderId } = useParams();
  const navigate = useNavigate();
  const [founder, setFounder] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(founderId));
  const [input, setInput] = useState(founderId || "");
  const whatsappUrl = "https://wa.me/2290141193144";

  useEffect(() => {
    setPageMeta({ title: "Verifier Founder's Pass | Cele One", description: "Verification publique Founder's Pass." });
  }, []);

  useEffect(() => {
    setInput(founderId || "");
  }, [founderId]);

  useEffect(() => {
    if (!founderId) return;
    (async () => {
      setLoading(true);
      const data = await getFounderByPublicId(String(founderId || "").trim().toUpperCase()).catch(() => null);
      setFounder(data || null);
      setLoading(false);
    })();
  }, [founderId]);

  const openVerification = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const normalized = String(input || "").trim().toUpperCase();
    if (!normalized) return;
    navigate(`/founders/verify/${encodeURIComponent(normalized)}`);
  };

  if (!founderId) {
    return (
      <div className="mx-auto max-w-4xl py-10">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,#10313a_0%,#164751_58%,#2FA5A9_100%)] px-8 py-10 text-white">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Verification officielle</div>
            <h1 className="mt-3 text-4xl font-black">Verifier un certificat Founder</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/85">
              Entrez un numero de certificat comme `CERT-COF-2026-000018` ou scannez le QR code du certificat pour ouvrir la verification publique Cele One.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1fr_0.82fr]">
            <form onSubmit={openVerification} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#2FA5A9]">Recherche manuelle</div>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-extrabold text-slate-800">Numero de certificat</span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="CERT-COF-2026-000018"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold uppercase outline-none focus:ring-2 focus:ring-teal-200"
                />
              </label>
              <button className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                Ouvrir la verification
              </button>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-extrabold text-[#2FA5A9] hover:underline">
                En cas d&apos;erreur, ecrire sur WhatsApp
              </a>
            </form>

            <div className="rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(135deg,#fff9ec_0%,#fff4dd_100%)] p-6">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#a76f1f]">Ce que la page verifie</div>
              <div className="mt-4 space-y-3">
                <VerifyStep text="Le numero de certificat public" />
                <VerifyStep text="Le niveau fondateur enregistre" />
                <VerifyStep text="Le numero de certificat actif" />
                <VerifyStep text="Le statut actuel du certificat" />
              </div>
              <div className="mt-5 text-sm font-semibold leading-6 text-slate-700">
                La verification publique n&apos;affiche ni email, ni telephone, ni montant de contribution, ni reference Chariow.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-center text-slate-600">Verification...</div>;
  const active = founder?.status === "active" || founder?.certificateStatus === "active";

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className={`rounded-[2rem] border p-8 ${founder ? active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
        <div className="text-xs font-black uppercase tracking-wide text-[#2FA5A9]">Cele One Founder's Pass</div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {!founder ? "Certificat invalide" : active ? "Certificat verifie" : "Certificat actuellement inactif"}
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-700">
          {!founder
            ? "Ce certificat n'existe pas dans la base officielle Cele One."
            : active
              ? "Ce certificat appartient a un soutien fondateur enregistre dans la base officielle Cele One."
              : "Ce numero de certificat existe bien dans la base Cele One, mais son statut n'est pas actif actuellement."}
        </p>
        {founder ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><FounderCertificateStatus status={founder.certificateStatus || founder.status} /></div>
            <Info label="Founder display name" value={founder.displayName || "-"} />
            <Info label="Public Founder ID" value={founder.publicFounderId || "-"} />
            <Info label="Founder level" value={founderLevelLabel(founder.founderLevel)} />
            <Info label="Certificate number" value={founder.certificateNumber || "-"} />
            <Info label="Joined year" value={formatDate(founder.joinedAt).slice(-4) || "-"} />
            <Info label="Issue date" value={formatDate(founder.issuedAt || founder.joinedAt)} />
            <Info label="Current status" value={founder.certificateStatus || founder.status || "-"} />
          </div>
        ) : null}
        {!founder || !active ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50">
            Ecrire sur WhatsApp: +2290141193144
          </a>
        ) : null}
        <Link to="/founders" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Retour Founder's Pass</Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/70 p-4"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 font-extrabold text-slate-900">{value}</div></div>;
}

function VerifyStep({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/75 p-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#123b40] text-xs font-black text-white">CO</div>
      <div className="text-sm font-semibold leading-6 text-slate-700">{text}</div>
    </div>
  );
}
