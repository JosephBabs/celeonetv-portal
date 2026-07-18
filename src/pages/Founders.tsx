import { Link } from "react-router-dom";
import { APP } from "../lib/config";
import { setPageMeta } from "../lib/seo";
import { useEffect } from "react";

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
  useEffect(() => {
    setPageMeta({
      title: "Cele One Founder's Pass",
      description: "Devenez l'un des premiers batisseurs de Cele One.",
    });
  }, []);

  const chariowUrl = APP.founders.chariowPassUrl;
  const paymentUrl = chariowUrl || "https://dzrkqyqp.mychariow.shop/prd_htdw78o8";

  return (
    <div className="space-y-8 py-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#d4c295] bg-[linear-gradient(135deg,#0d2d33_0%,#15434c_52%,#2FA5A9_100%)] text-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-8 md:p-12">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black tracking-[0.22em]">CELE ONE</div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Founder&apos;s Pass</h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/85">
              Une adhesion fondatrice premium pour les premiers soutiens verifies du projet Cele One, avec un parcours clair:
              achat du produit officiel, verification backend, puis activation des identifiants fondateurs.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#f5d36d] px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-[#efc850]"
              >
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
              <Stat title="Paiement officiel" value="Produit Chariow" />
              <Stat title="Activation" value="Recu ou id d'achat" />
              <Stat title="Sortie premium" value="Certificat + carte" />
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.08] p-8 backdrop-blur lg:border-l lg:border-t-0">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Lien produit</div>
            <div className="mt-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <div className="text-lg font-black">Cele One Founder&apos;s Pass</div>
              <p className="mt-2 text-sm font-semibold leading-7 text-white/82">
                Utilisez ce lien pour finaliser votre contribution Founder&apos;s Pass sur la boutique officielle Chariow.
              </p>
              <a href={paymentUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-2xl bg-[#123b40] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0d2d33]">
                Ouvrir le produit
              </a>
              <div className="mt-4 break-all text-sm font-bold text-white/78">{paymentUrl}</div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#fff8ea] p-5 text-slate-900">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#a76f1f]">Parcours simple</div>
              <div className="mt-3 space-y-3">
                <Step label="1" text="Achetez le Founder&apos;s Pass avec le lien produit." />
                <Step label="2" text="Gardez votre recu, votre id d'achat ou une capture de la finalisation du paiement." />
                <Step label="3" text="Activez votre pass dans le portail Cele One." />
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
              Le Founder&apos;s Pass n&apos;est pas une promesse financiere. C&apos;est une adhesion de soutien verifiee, rattachee a un paiement officiel,
              puis transformee en identifiants premium apres verification et approbation.
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Apres paiement"
                desc="Ouvrez la page d'activation et collez votre recu, votre id d'achat ou une capture de la finalisation du paiement."
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
