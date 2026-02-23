/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

export default function Landing() {
  const [featuredChannels, setFeaturedChannels] = useState<any[]>([]);

  useEffect(() => {
    setPageMeta({
      title: "CeleOne | Plateforme Sociale Mobile Chrétienne Céleste",
      description:
        "CeleOne rassemble actualités, réformes, décisions officielles ECC, chat communautaire et diffusion TV/Radio en direct dans un espace sécurisé.",
    });
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDocs(query(collection(db, "channels"), orderBy("createdAt", "desc"), limit(6)));
        setFeaturedChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-800 p-8 text-white md:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-black tracking-wide">
              CELEONE ECC PLATFORM
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              CeleOne, une plateforme sociale mobile pour la communauté chrétienne céleste.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
              Une application de communication et d&apos;information qui rassemble actualités, réformes, décisions officielles et échanges communautaires dans un espace sécurisé et interactif.
            </p>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
              Objectif: aider les fidèles à accéder à des informations fiables, comprendre les décisions importantes, participer aux discussions, et limiter la propagation des fausses informations et de l&apos;intoxication.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/creator/request"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-100"
              >
                Créer une chaîne TV
              </Link>
              <Link
                to="/chatrooms/create"
                className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Créer un chatroom
              </Link>
              <Link
                to="/creator"
                className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Ouvrir mon panel
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <div className="text-sm font-extrabold text-white/80">Informations clés</div>
            <div className="mt-4 grid gap-3">
              <InfoCard
                title="En cinq langues"
                value="Français, Anglais, Yoruba, Fon, Espagnol"
              />
              <InfoCard
                title="Documents ECC"
                value="Embarque les documents importants et cruciaux pour référence publique."
              />
              <InfoCard
                title="Transmission en direct"
                value="Plusieurs chaînes TV/Web TV + Radio Alléluia FM peuvent diffuser sur la plateforme."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          title="Actualités fiables"
          desc="Centralisation des décisions officielles, réformes et informations validées."
        />
        <Feature
          title="Espace communautaire"
          desc="Chatrooms et commentaires pour l'opinion publique et l'engagement citoyen."
        />
        <Feature
          title="Système de diffusion abordable"
          desc="Infrastructure simple et accessible pour que les chaînes streament directement."
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xl font-black text-slate-900">Chaînes en position sur l'application</div>
            <div className="mt-1 text-sm text-slate-600">
              Les chaînes de télévision peuvent demander une position et streamer directement dans CeleOne.
            </div>
          </div>
          <Link
            to="/creator/request"
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Demander le streaming
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {featuredChannels.map((c) => (
            <Link
              key={c.id}
              to={`/${c.channelName || "channel"}/live`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
            >
              <div className="text-base font-black text-slate-900">{c.displayName || c.name || c.channelName}</div>
              <div className="mt-1 text-sm text-slate-600 line-clamp-2">{c.description || "Chaîne disponible en direct sur CeleOne."}</div>
            </Link>
          ))}
          {featuredChannels.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Aucune chaîne trouvée pour le moment.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-white/70">{title}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </div>
  );
}
