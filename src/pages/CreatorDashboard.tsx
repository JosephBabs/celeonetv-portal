/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuthUser } from "../lib/useAuthUser";
import { APP } from "../lib/config";
import HlsVideo from "../components/HlsVideo";

export default function CreatorDashboard() {
  const { user, loading } = useAuthUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [livePreviewOpen, setLivePreviewOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const qy = query(
      collection(db, "channel_requests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qy, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const latest = useMemo(() => requests[0], [requests]);

  if (loading) return <div className="py-10 text-center text-slate-600">Chargement…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Panel créateur</div>
        <div className="mt-2 text-slate-600">Connecte-toi pour voir tes demandes.</div>
        <Link to="/" className="mt-4 inline-block font-extrabold text-teal-700">
          Retour accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-black">Panel créateur</div>
            <div className="mt-1 text-slate-600">{user.email || user.uid}</div>
          </div>
          <Link
            to="/creator/request"
            className="rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
          >
            Nouvelle demande
          </Link>
        </div>

        {latest ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MiniStat label="Status" value={latest.status} />
            <MiniStat label="Channel URL" value={`/${latest.channelName}/live`} />
            <MiniStat label="Catégorie" value={latest.category || "—"} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            Aucune demande. Crée ta première chaîne.
          </div>
        )}
      </div>

      {/* List requests */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-lg font-black">Mes demandes</div>
        <div className="mt-4 space-y-3">
          {requests.map((r) => {
            const key = r.streamKey as string | undefined;
            const hls = key ? `${APP.streaming.hlsBase}/${key}.m3u8` : null;
            const rtmp = key ? `${APP.streaming.rtmpBase}/${key}` : null;
            const share = r.channelName ? `${APP.streaming.publicLiveBase}/${r.channelName}/live` : null;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-black">{r.displayName}</div>
                    <div className="text-sm text-slate-600">/{r.channelName}/live</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                {r.status === "approved" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <KeyCard title="RTMP Push URL" value={rtmp || "—"} />
                    <KeyCard title="HLS Playback" value={hls || "—"} />
                    <KeyCard title="Share Link" value={share || "—"} />
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <div className="text-sm font-extrabold text-slate-700">Preview</div>
                      {hls ? (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                          <div className="aspect-video">
                            <HlsVideo src={hls} />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">Aucun HLS.</div>
                      )}

                      {hls ? (
                        <button
                          onClick={() => setLivePreviewOpen((v) => (v === r.id ? null : r.id))}
                          className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 font-extrabold text-white hover:bg-slate-800"
                        >
                          {livePreviewOpen === r.id ? "Fermer preview" : "Ouvrir preview"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-600">
                    {r.status === "pending"
                      ? "En attente de validation. Tu seras notifié après review."
                      : "Demande rejetée. Tu peux refaire une demande."}
                  </div>
                )}
              </div>
            );
          })}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              Aucune demande.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{String(value)}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </div>
  );
}

function KeyCard({ title, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="text-sm font-extrabold text-slate-700">{title}</div>
      <div className="mt-2 break-all rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-800">{value}</div>
    </div>
  );
}
