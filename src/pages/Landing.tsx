import LivePlayerCard from "../components/LivePlayerCard";
import Pricing from "../components/Pricing";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-teal-50 p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-800">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Live TV + Créateurs
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Diffuse ta chaîne en direct sur Celeone.
            </h1>
            <p className="mt-3 text-slate-600 md:text-lg">
              Crée ta chaîne, reçois ton stream key RTMP, et partage ton lien live
              en 1 clic. Ta communauté regarde en HLS, partout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/creator/request"
                className="rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700"
              >
                Demander une chaîne
              </Link>
              <a
                href="#pricing"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-extrabold text-slate-900 hover:bg-slate-50"
              >
                Voir les tarifs
              </a>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200">
                <div className="font-black">RTMP</div>
                <div className="text-slate-600">live/{"{key}"}</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200">
                <div className="font-black">HLS</div>
                <div className="text-slate-600">/hls/{"{key}"}.m3u8</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200">
                <div className="font-black">Lien</div>
                <div className="text-slate-600">/{`{channel}`}/live</div>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <LivePlayerCard />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { t: "1) Demande", d: "Soumets ta chaîne, infos + nom + catégorie." },
          { t: "2) Paiement", d: "Choisis ton pack. Paiement + validation." },
          { t: "3) Diffusion", d: "RTMP key + page live partageable." },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="text-lg font-black">{x.t}</div>
            <div className="mt-2 text-slate-600">{x.d}</div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* CTA */}
      <section className="rounded-3xl bg-slate-900 p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-black">Prêt à lancer ta chaîne ?</div>
            <div className="mt-2 text-white/80">
              Lance ton live, invite ton audience, suis tes stats sur le panel.
            </div>
          </div>
          <Link
            to="/creator/request"
            className="rounded-2xl bg-teal-500 px-5 py-3 text-center font-extrabold text-slate-900 hover:bg-teal-400"
          >
            Soumettre une demande
          </Link>
        </div>
      </section>
    </div>
  );
}
