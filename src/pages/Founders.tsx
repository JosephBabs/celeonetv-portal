import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { APP } from "../lib/config";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

const benefits = [
  {
    title: "Founder ID reserve",
    desc: "Un identifiant provisoire que vous copiez avant paiement pour relier votre soutien au bon dossier Founder.",
  },
  {
    title: "Activation verifiee",
    desc: "Apres paiement, votre id d'achat ou capture est controle pour activer correctement le pass fondateur.",
  },
  {
    title: "Certificat et verification",
    desc: "Le certificat et la carte Founder restent consultables et verifiables depuis les routes officielles Cele One.",
  },
];

const stepCards = [
  {
    title: "Reserve",
    desc: "Entrez simplement votre nom pour generer votre Founder ID.",
  },
  {
    title: "Pay",
    desc: "Collez cet identifiant pendant la finalisation du paiement Chariow.",
  },
  {
    title: "Activate",
    desc: "Revenez avec votre id d'achat ou capture de paiement pour activer le pass.",
  },
];

export default function Founders() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reservedId, setReservedId] = useState("");
  const [reservedName, setReservedName] = useState("");

  useEffect(() => {
    setPageMeta({
      title: "Cele One Founder's Pass",
      description: "Devenez l'un des premiers batisseurs de Cele One.",
    });
  }, []);

  const paymentUrl = APP.founders.chariowPassUrl || "https://dzrkqyqp.mychariow.shop/prd_htdw78o8";

  const generateFounderReferenceId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `COF-${year}-${random}`;
  };

  const reserveFounderId = async () => {
    const normalizedName = displayName.trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      setError("Entrez votre nom pour generer votre Founder ID.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const parts = normalizedName.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      const founderReferenceId = generateFounderReferenceId();
      const reservationId = `reservation_${founderReferenceId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      const now = new Date().toISOString();

      await setDoc(doc(db, "founderReservations", reservationId), {
        publicFounderId: founderReferenceId,
        firstName,
        lastName,
        displayName: normalizedName,
        status: "not_verified",
        activationStatus: "awaiting_payment",
        source: "founders_portal_client",
        paymentId: "",
        applicationId: "",
        founderId: "",
        userId: "",
        email: "",
        createdAt: now,
        updatedAt: now,
      });

      setReservedId(founderReferenceId);
      setReservedName(normalizedName);
    } catch (caught) {
      console.error(caught);
      setError("Impossible de generer votre Founder ID pour le moment. Verifiez la configuration Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const copyFounderId = async () => {
    if (!reservedId) return;
    await navigator.clipboard?.writeText(reservedId).catch(() => null);
  };

  return (
    <div className="space-y-8 py-6">
      <section
        className="relative overflow-hidden rounded-[28px] bg-[#081828] px-6 py-16 text-white md:px-10"
        style={{ backgroundImage: "url('/spark/banner-bg.svg')", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.18em] text-white/86">
              CELE ONE FOUNDER&apos;S PASS
            </div>
            <h1 className="mt-6 text-[40px] font-bold leading-[1.04] md:text-[58px]">A cleaner founder flow, built around your real process</h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-white/78">
              Generez votre Founder ID, finalisez le paiement officiel sur Chariow, puis revenez activer et verifier votre pass sans confusion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={paymentUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-[#2ed06e] px-7 text-[15px] font-bold text-white">
                Acheter le Founder&apos;s Pass
              </a>
              <Link to="/founders/activate" className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-white px-7 text-[15px] font-bold text-[#081828]">
                Activer mon pass
              </Link>
              <Link to="/founders/verify" className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-[15px] font-bold text-white">
                Verifier un pass
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-7 text-slate-900 shadow-[0_18px_48px_rgba(8,24,40,0.18)]">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Avant paiement</div>
            <h2 className="mt-4 text-[32px] font-bold leading-tight text-[#081828]">Reserve your Founder ID</h2>
            <p className="mt-3 text-[15px] font-medium leading-8 text-slate-600">
              Entrez votre nom. Nous generons un Founder ID provisoire avec statut non verifie. Vous pourrez le coller pendant la finalisation du paiement.
            </p>

            <div className="mt-6 space-y-4">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full rounded-[18px] border border-slate-200 bg-[#f8fafc] px-5 py-4 font-medium outline-none focus:border-[#2ed06e]"
              />
              <button
                type="button"
                onClick={reserveFounderId}
                disabled={saving}
                className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#081828] px-7 text-[15px] font-bold text-white disabled:opacity-60"
              >
                {saving ? "Generation..." : "Generer mon Founder ID"}
              </button>
            </div>

            {error ? <div className="mt-4 rounded-[18px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

            {reservedId ? (
              <div className="mt-5 rounded-[22px] border border-slate-200 bg-[#f8fbfd] p-5">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Founder ID reserve</div>
                <div className="mt-3 font-mono text-[24px] font-bold text-[#081828]">{reservedId}</div>
                <div className="mt-2 text-sm font-medium text-slate-600">{reservedName} - statut non verifie</div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={copyFounderId} className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-[15px] font-bold text-slate-700">
                    Copier l&apos;ID
                  </button>
                  <a href={paymentUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-[#2ed06e] px-6 text-[15px] font-bold text-white">
                    Proceder au paiement
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {stepCards.map((step, index) => (
          <div key={step.title} className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Etape {index + 1}</div>
            <div className="mt-4 text-[28px] font-bold text-[#081828]">{step.title}</div>
            <p className="mt-3 text-[15px] font-medium leading-8 text-slate-600">{step.desc}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Ce que vous recevez</div>
          <h2 className="mt-4 text-[34px] font-bold leading-tight text-[#081828]">Founder benefits presented with a cleaner Spark card rhythm</h2>
          <div className="mt-6 grid gap-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-[22px] border border-slate-200 bg-[#f8fbfd] p-5">
                <div className="text-[20px] font-bold text-[#081828]">{benefit.title}</div>
                <div className="mt-2 text-sm font-medium leading-7 text-slate-600">{benefit.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Activation et verification</div>
          <h2 className="mt-4 text-[34px] font-bold leading-tight text-[#081828]">Un parcours plus propre, sans confusion</h2>
          <p className="mt-4 text-[15px] font-medium leading-8 text-slate-600">
            Le Founder&apos;s Pass n&apos;est pas une promesse financiere. C&apos;est une adhesion de soutien verifiee, rattachee a un Founder ID provisoire,
            puis transformee en identifiants premium apres verification et approbation.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ActionCard
              title="Apres paiement"
              desc="Ouvrez la page d'activation et collez votre Founder ID, puis votre id d'achat ou votre capture de paiement."
              link="/founders/activate"
              label="Aller a l'activation"
            />
            <ActionCard
              title="Verification publique"
              desc="Chaque certificat et chaque carte Founder peuvent etre verifies depuis la route officielle Cele One."
              link="/founders/verify"
              label="Ouvrir la verification"
            />
          </div>

          <div className="mt-6 rounded-[22px] border border-slate-200 bg-[#f8fbfd] p-5">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Important</div>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              Gardez votre id d&apos;achat ou une capture de la finalisation du paiement. Les avantages peuvent varier selon la disponibilite,
              les evenements, les partenaires, la localisation et le niveau de soutien.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ title, desc, link, label }: { title: string; desc: string; link: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#f8fbfd] p-5">
      <div className="text-[20px] font-bold text-[#081828]">{title}</div>
      <div className="mt-2 text-sm font-medium leading-7 text-slate-600">{desc}</div>
      <Link to={link} className="mt-5 inline-flex min-h-[50px] items-center justify-center rounded-full bg-[#081828] px-6 text-[15px] font-bold text-white">
        {label}
      </Link>
    </div>
  );
}
