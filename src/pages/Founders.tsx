import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { APP } from "../lib/config";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

const benefits = [
  {
    title: "Identifiants premium",
    desc: "Carte Founder, certificat verifie, badge digital et QR de verification apres approbation.",
    accent: "Teal",
  },
  {
    title: "Acces prioritaire",
    desc: "Ouvertures selectives vers certaines actualites, rencontres, visites et evenements reserves.",
    accent: "Gold",
  },
  {
    title: "Reconnaissance officielle",
    desc: "Presence eligible sur le mur des fondateurs et rattachement a la base Founder officielle Cele One.",
    accent: "Slate",
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
      <section className="overflow-hidden rounded-[2rem] border border-[#d4c295] bg-[linear-gradient(135deg,#071e22_0%,#103840_48%,#2FA5A9_100%)] text-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="order-2 p-8 md:p-12 lg:order-1">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black tracking-[0.22em]">CELE ONE</div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Founder&apos;s Pass</h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/85">
              Une adhesion fondatrice premium pour les premiers soutiens verifies du projet Cele One, avec un parcours clair:
              generez votre Founder ID, finalisez le paiement officiel, puis revenez pour activer votre pass.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#founder-id-reserve" className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100 lg:hidden">
                Generer mon Founder ID
              </a>
              <a href={paymentUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#f5d36d] px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-[#efc850]">
                Acheter le Founder&apos;s Pass
              </a>
              <Link to="/founders/activate" className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100">
                Activer mon pass
              </Link>
              <Link to="/founders/verify" className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">
                Verifier un pass
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Stat title="Etape 1" value="Founder ID reserve" />
              <Stat title="Etape 2" value="Produit Chariow" />
              <Stat title="Sortie premium" value="Certificat + carte" />
            </div>
          </div>

          <div className="order-1 border-b border-white/10 bg-white/[0.06] p-8 backdrop-blur lg:order-2 lg:border-b-0 lg:border-l lg:border-t-0">
            <div id="founder-id-reserve" className="rounded-[1.75rem] border border-white/12 bg-[#07181b]/55 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Avant paiement</div>
              <div className="mt-3 text-2xl font-black">Reserve your Founder ID</div>
              <p className="mt-2 text-sm font-semibold leading-7 text-white/80">
                Entrez votre nom. Nous generons un Founder ID provisoire avec statut non verifie. Vous pourrez le copier puis le coller pendant la finalisation du paiement.
              </p>

              <div className="mt-5 space-y-3">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white outline-none placeholder:text-white/45 focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={reserveFounderId}
                  disabled={saving}
                  className="w-full rounded-2xl bg-[#f5d36d] px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-[#efc850] disabled:opacity-60"
                >
                  {saving ? "Generation..." : "Generer mon Founder ID"}
                </button>
              </div>

              {error ? <div className="mt-3 rounded-2xl bg-rose-500/12 px-4 py-3 text-sm font-bold text-rose-100">{error}</div> : null}

              {reservedId ? (
                <div className="mt-4 rounded-[1.4rem] border border-amber-300/35 bg-[#fff8ea] p-4 text-slate-900">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-[#a76f1f]">Founder ID reserve</div>
                  <div className="mt-2 font-mono text-xl font-black text-slate-950">{reservedId}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">{reservedName} - statut non verifie</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={copyFounderId} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                      Copier l&apos;ID
                    </button>
                    <a href={paymentUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#123b40] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#0d2d33]">
                      Proceder au paiement
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#fff8ea] p-5 text-slate-900">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#a76f1f]">Processus</div>
              <div className="mt-3 space-y-3">
                <Step label="1" text="Generez votre Founder ID et copiez-le." />
                <Step label="2" text="Ouvrez le produit Founder&apos;s Pass et collez cet ID dans le champ ajoute a la finalisation du paiement." />
                <Step label="3" text="Gardez votre id d'achat ou une capture de la finalisation du paiement." />
                <Step label="4" text="Revenez sur Cele One pour activer votre pass avec le Founder ID et votre preuve de paiement." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#2FA5A9]">Ce que vous recevez</div>
          <div className="mt-5 grid gap-4">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} title={benefit.title} desc={benefit.desc} accent={benefit.accent} />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fff9ec_0%,#fff4dd_100%)] shadow-sm">
          <div className="border-b border-amber-200/70 bg-[linear-gradient(135deg,#fff7e7_0%,#f8ecd0_100%)] p-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#a76f1f]">Activation et verification</div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Un parcours plus propre, sans confusion</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-700">
              Le Founder&apos;s Pass n&apos;est pas une promesse financiere. C&apos;est une adhesion de soutien verifiee, rattachee a un Founder ID provisoire,
              puis transformee en identifiants premium apres verification et approbation.
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-white/80 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#123b40] text-sm font-black text-white">CO</div>
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.16em] text-[#a76f1f]">Important</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Les avantages peuvent varier selon les disponibilites, les evenements, les partenaires, la localisation et le niveau de soutien.
                    Le Founder&apos;s Pass ne constitue ni une action, ni un investissement, ni une garantie de rendement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BenefitCard({ title, desc, accent }: { title: string; desc: string; accent: string }) {
  const accents: Record<string, string> = {
    Teal: "from-[#10343b] via-[#1c5560] to-[#2FA5A9]",
    Gold: "from-[#6f4b10] via-[#a76f1f] to-[#d5a33d]",
    Slate: "from-[#1a2d33] via-[#31474d] to-[#607178]",
  };
  return (
    <div className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`h-2 w-full bg-gradient-to-r ${accents[accent] || accents.Teal}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-black text-slate-900">{title}</div>
            <div className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">{desc}</div>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
            CO
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">{title}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Step({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[1rem] bg-white p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#123b40] text-sm font-black text-white">{label}</div>
      <div className="text-sm font-semibold leading-6 text-slate-700">{text}</div>
    </div>
  );
}

function ActionCard({ title, desc, link, label }: { title: string; desc: string; link: string; label: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-base font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">{desc}</div>
      <Link to={link} className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
        {label}
      </Link>
    </div>
  );
}
