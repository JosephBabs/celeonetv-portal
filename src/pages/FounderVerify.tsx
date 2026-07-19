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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
          <div
            className="relative px-8 py-12 text-white"
            style={{ backgroundImage: "url('/spark/banner-bg.svg')", backgroundPosition: "center", backgroundSize: "cover", backgroundColor: "#081828" }}
          >
            <div className="relative max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.18em] text-white/86">VERIFICATION OFFICIELLE</div>
              <h1 className="mt-4 text-[38px] font-bold leading-tight">Verifier un certificat Founder</h1>
              <p className="mt-4 max-w-2xl text-[15px] font-medium leading-8 text-white/78">
              Entrez un numero de certificat comme `CERT-COF-2026-000018` ou scannez le QR code du certificat pour ouvrir la verification publique Cele One.
              </p>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1fr_0.82fr]">
            <form onSubmit={openVerification} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(8,24,40,0.04)]">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f8c68]">Recherche manuelle</div>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-slate-800">Numero de certificat</span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="CERT-COF-2026-000018"
                  className="rounded-[18px] border border-slate-200 bg-[#f8fafc] px-5 py-4 font-medium uppercase outline-none focus:border-[#2ed06e]"
                />
              </label>
              <button className="mt-5 inline-flex min-h-[54px] items-center justify-center rounded-full bg-[#2ed06e] px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(46,208,110,0.22)] hover:bg-[#28c464]">
                Ouvrir la verification
              </button>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold text-[#0f8c68] hover:underline">
                En cas d&apos;erreur, ecrire sur WhatsApp
              </a>
            </form>

            <div className="rounded-[24px] border border-slate-200 bg-[#f8fbfd] p-6">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f8c68]">Ce que la page verifie</div>
              <div className="mt-4 space-y-3">
                <VerifyStep text="Le numero de certificat public" />
                <VerifyStep text="Le niveau fondateur enregistre" />
                <VerifyStep text="Le numero de certificat actif" />
                <VerifyStep text="Le statut actuel du certificat" />
              </div>
              <div className="mt-5 text-sm font-medium leading-7 text-slate-700">
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
      <div className={`rounded-[28px] border p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)] ${founder ? active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8c68]">Cele One Founder&apos;s Pass</div>
        <h1 className="mt-3 text-[34px] font-bold leading-tight text-slate-900">
          {!founder ? "Certificat invalide" : active ? "Certificat verifie" : "Certificat actuellement inactif"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
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
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-[15px] font-bold text-slate-800 hover:bg-slate-50">
            Ecrire sur WhatsApp: +2290141193144
          </a>
        ) : null}
        <Link to="/founders" className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#081828] px-6 text-[15px] font-bold text-white">Retour Founder&apos;s Pass</Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] bg-white/75 p-4"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div><div className="mt-1 font-bold text-slate-900">{value}</div></div>;
}

function VerifyStep({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-white p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf9f1] text-xs font-bold text-[#0f8c68]">CO</div>
      <div className="text-sm font-medium leading-7 text-slate-700">{text}</div>
    </div>
  );
}
