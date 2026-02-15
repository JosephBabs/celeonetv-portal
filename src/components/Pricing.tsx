import { Link } from "react-router-dom";

export default function Pricing() {
  const plans = [
    { name: "Starter", price: "5,000 FCFA", desc: "1 chaîne • Page live • Key RTMP • Stats de base" },
    { name: "Pro", price: "15,000 FCFA", desc: "Plus de visibilité • Meilleures stats • Support prioritaire" },
    { name: "Enterprise", price: "Sur devis", desc: "Organisations • Multi-chaines • SLA • Intégrations" },
  ];

  return (
    <section className="space-y-4">
      <div>
        <div className="text-2xl font-black">Tarifs</div>
        <div className="mt-2 text-slate-600">Choisis un pack pour activer ta chaîne.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="text-lg font-black">{p.name}</div>
            <div className="mt-2 text-3xl font-black">{p.price}</div>
            <div className="mt-2 text-slate-600">{p.desc}</div>
            <Link
              to="/creator/request"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
            >
              Commencer
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
