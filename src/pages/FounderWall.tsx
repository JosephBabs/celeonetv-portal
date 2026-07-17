/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { founderLevelLabel, formatDate } from "../lib/founders";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

export default function FounderWall() {
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({ title: "Founder Wall | Cele One", description: "Mur public des fondateurs Cele One." });
    (async () => {
      const snap = await getDocs(query(collection(db, "founders"), where("status", "==", "active"), where("publicRecognitionConsent", "==", true))).catch(() => null);
      setFounders(snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#0f3c40] to-[#2FA5A9] p-8 text-white">
        <div className="text-xs font-black uppercase tracking-wide text-white/70">Cele One</div>
        <h1 className="mt-2 text-4xl font-black">Founder Wall</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold text-white/85">Seuls les fondateurs actifs ayant donne leur consentement public sont affiches ici.</p>
      </section>
      {loading ? <div className="rounded-3xl bg-slate-100 p-6 text-slate-600">Loading...</div> : null}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {founders.map((founder) => (
          <div key={founder.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 text-xl font-black text-[#2FA5A9]">
                {founder.profilePhotoUrl ? <img src={founder.profilePhotoUrl} className="h-full w-full object-cover" /> : String(founder.displayName || "F").slice(0, 1)}
              </div>
              <div>
                <div className="font-black text-slate-900">{founder.displayName}</div>
                <div className="font-mono text-xs font-bold text-slate-500">{founder.publicFounderId}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Info label="Level" value={founderLevelLabel(founder.founderLevel)} />
              <Info label="Country" value={founder.country || "-"} />
              <Info label="Joined" value={formatDate(founder.joinedAt).slice(-4) || "-"} />
            </div>
          </div>
        ))}
        {!loading && founders.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">Aucun fondateur public pour le moment.</div> : null}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] font-black uppercase text-slate-500">{label}</div><div className="font-bold text-slate-900">{value}</div></div>;
}
