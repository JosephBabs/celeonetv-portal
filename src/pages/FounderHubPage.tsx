/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { getFounderByUserId } from "../lib/founders";
import { useAuthUser } from "../lib/useAuthUser";
import { FounderPassCard } from "./FounderDashboard";

const pageMeta: Record<string, { title: string; desc: string }> = {
  pass: { title: "Digital Founder Pass", desc: "Votre carte numerique Founder's Pass." },
  certificate: { title: "Founder Certificate", desc: "Certificat de soutien genere depuis les donnees verifiees." },
  benefits: { title: "Mes avantages", desc: "Avantages disponibles selon votre niveau Founder." },
  invitations: { title: "Mes invitations", desc: "Invitations et statuts de participation." },
  events: { title: "Evenements disponibles", desc: "Evenements et visites eligibles." },
  announcements: { title: "Actualites reservees", desc: "Annonces publiees pour les fondateurs." },
};

export default function FounderHubPage() {
  const { section = "pass" } = useParams();
  const { user, loading } = useAuthUser();
  const [founder, setFounder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const meta = pageMeta[section] || pageMeta.pass;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const found = await getFounderByUserId(user.uid);
      setFounder(found);
      if (section === "benefits") {
        const snap = await getDocs(query(collection(db, "founderBenefits"), where("active", "==", true), limit(50))).catch(() => null);
        setItems(snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      } else if (section === "invitations") {
        const snap = await getDocs(query(collection(db, "founderInvitations"), where("founderId", "==", found?.id || ""), limit(50))).catch(() => null);
        setItems(snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      } else if (section === "announcements") {
        const snap = await getDocs(query(collection(db, "founderAnnouncements"), where("published", "==", true), limit(50))).catch(() => null);
        setItems(snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      }
      setBusy(false);
    })();
  }, [section, user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to={`/login?returnTo=/founders/${section}`} replace />;
  if (busy) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!founder) return <Navigate to="/founders/dashboard" replace />;

  if (section === "pass") return <div className="mx-auto max-w-lg py-8"><FounderPassCard founder={founder} /></div>;

  if (section === "certificate") {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="rounded-[2rem] border-8 border-[#2FA5A9] bg-white p-10 text-center print:border-[#2FA5A9]">
          <div className="text-sm font-black uppercase tracking-[0.3em] text-[#2FA5A9]">Cele One</div>
          <h1 className="mt-5 text-4xl font-black text-slate-900">Founder Certificate</h1>
          <p className="mt-8 text-sm font-semibold text-slate-600">Ce certificat confirme l'enregistrement de son detenteur en tant que soutien fondateur de Cele One.</p>
          <div className="mt-6 text-3xl font-black text-slate-900">{founder.displayName}</div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-600">{founder.publicFounderId}</div>
          <p className="mx-auto mt-8 max-w-2xl text-xs font-bold leading-6 text-slate-500">Ce certificat ne constitue ni une action, ni un titre financier, ni une garantie de rendement.</p>
          <button onClick={() => window.print()} className="mt-8 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white print:hidden">Download certificate PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">{meta.title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">{meta.desc}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-lg font-black text-slate-900">{item.title || item.status || item.id}</div>
            <p className="mt-2 text-sm font-semibold text-slate-600">{item.description || item.summary || "Eligible - sous reserve de disponibilite."}</p>
          </div>
        ))}
        {items.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">Aucune entree disponible pour le moment.</div> : null}
      </section>
      <Link to="/founders/dashboard" className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">Retour dashboard</Link>
    </div>
  );
}
