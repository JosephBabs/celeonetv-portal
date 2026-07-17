import { Link } from "react-router-dom";
import { APP } from "../lib/config";
import { setPageMeta } from "../lib/seo";
import { useEffect } from "react";

const benefits = [
  "Badge fondateur dans Cele One",
  "Carte numerique personnalisee",
  "Certificat de soutien",
  "Acces anticipe a certaines actualites",
  "Acces aux coulisses de certains tournages",
  "Invitations a certaines visites ou activites",
  "Acces prioritaire a certains evenements",
  "Sessions privees ou rencontres avec l'equipe",
  "Nom sur le mur des fondateurs, avec consentement",
  "Opportunites futures reservees aux detenteurs eligibles",
];

export default function Founders() {
  useEffect(() => {
    setPageMeta({
      title: "Cele One Founder's Pass",
      description: "Devenez l'un des premiers batisseurs de Cele One.",
    });
  }, []);

  const chariowUrl = APP.founders.chariowPassUrl;

  return (
    <div className="space-y-8 py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-teal-100 bg-gradient-to-br from-[#0f3c40] via-[#2FA5A9] to-[#0f766e] p-8 text-white shadow-sm md:p-12">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-black tracking-wide">CELE ONE</div>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Cele One Founder's Pass</h1>
          <p className="mt-4 text-xl font-extrabold text-white/90">Devenez l'un des premiers batisseurs de Cele One.</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90 md:text-base">
            Le Founder's Pass reconnait les premieres personnes qui contribuent au developpement de Cele One. Les detenteurs verifies peuvent beneficier d'un acces prioritaire a certaines actualites, experiences, visites, tournages, evenements et programmes reserves aux membres fondateurs.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={chariowUrl || "#chariow-missing"}
              target={chariowUrl ? "_blank" : undefined}
              rel="noreferrer"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
              onClick={(event) => {
                if (!chariowUrl) {
                  event.preventDefault();
                  alert("Chariow product URL is not configured yet.");
                }
              }}
            >
              Obtenir mon Founder's Pass
            </a>
            <Link to="/founders/activate" className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-200">Activer mon pass</Link>
            <Link to="/founders/verify" className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">Verifier un pass</Link>
            <Link to="/login?returnTo=/founders/dashboard" className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">Se connecter</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-lg font-black text-[#2FA5A9]">CO</div>
            <div className="mt-4 text-base font-black text-slate-900">{benefit}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <div className="text-sm font-black uppercase tracking-wide text-amber-800">Important</div>
        <p className="mt-2 text-sm font-bold leading-6 text-amber-950">
          Les avantages sont progressifs, peuvent varier selon les evenements, les disponibilites, la localisation, les partenaires et le niveau de soutien. Le Founder's Pass ne constitue ni un investissement financier, ni une promesse de rendement, ni une action dans Cele One.
        </p>
      </section>
    </div>
  );
}
