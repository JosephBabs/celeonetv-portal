/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { APP } from "../lib/config";
import HlsVideo from "../components/HlsVideo";

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [liveChannel, setLiveChannel] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        // 1) Load channels list (to allow switching)
        const chSnap = await getDocs(
          query(collection(db, "channels"), orderBy("createdAt", "desc"), limit(30))
        );
        const chList = chSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChannels(chList);

        // 2) Choose ongoing TV:
        //    featured first
        const featuredSnap = await getDocs(
          query(collection(db, "channels"), where("featured", "==", true), limit(1))
        );
        if (!featuredSnap.empty) {
          setLiveChannel({ id: featuredSnap.docs[0].id, ...featuredSnap.docs[0].data() });
        } else if (chList.length > 0) {
          // fallback: first channel available
          setLiveChannel(chList[0]);
        } else {
          // fallback: try approved requests if channels not created yet
          const reqSnap = await getDocs(
            query(
              collection(db, "channel_requests"),
              where("status", "==", "approved"),
              orderBy("createdAt", "desc"),
              limit(1)
            )
          );
          if (!reqSnap.empty) setLiveChannel({ id: reqSnap.docs[0].id, ...reqSnap.docs[0].data() });
        }

        // 3) Load recent posts preview
        const pSnap = await getDocs(
          query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6))
        );
        setPosts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const hls = useMemo(() => {
    const key = liveChannel?.streamKey;
    if (!key) return null;
    return `${APP.streaming.hlsBase}/${key}.m3u8`;
  }, [liveChannel]);

  const liveUrl = useMemo(() => {
    const slug = liveChannel?.channelName;
    if (!slug) return null;
    return `/${slug}/live`;
  }, [liveChannel]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-2xl font-black text-slate-900">TV en direct</div>
            <div className="mt-1 text-slate-600">
              {liveChannel?.displayName || liveChannel?.name || "Aucune chaîne"}{" "}
              <span className="text-slate-400">•</span>{" "}
              {liveChannel?.description || "Streaming sur CeleoneTV"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {liveUrl ? (
              <Link
                to={liveUrl}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Ouvrir la page live
              </Link>
            ) : null}

            <button
              onClick={() => setPickerOpen(true)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-200"
            >
              Changer de chaîne
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="border-t border-slate-200">
          <div className="aspect-video w-full bg-slate-900">
            {loading ? (
              <div className="flex h-full items-center justify-center text-white/80">
                Chargement…
              </div>
            ) : hls ? (
              <HlsVideo src={hls} />
            ) : (
              <div className="flex h-full items-center justify-center text-white/85">
                Channel not currently streaming
              </div>
            )}
          </div>
        </div>

        {/* CTA row */}
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <CTA
            title="Créer une chaîne TV"
            desc="Soumets ta demande, puis paiement, puis tu reçois ta clé RTMP."
            to="/creator/request"
            primary
          />
          <CTA
            title="Accéder au panel créateur"
            desc="Voir statut, clés, et preview live."
            to="/creator"
          />
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-extrabold text-slate-700">RTMP format</div>
            <div className="mt-2 rounded-2xl bg-white p-3 font-mono text-xs text-slate-800">
              {APP.streaming.rtmpBase}/{"{key}"}
            </div>
            <div className="mt-2 text-xs text-slate-600">
              (La génération de key sera faite côté Node quand on active le paiement)
            </div>
          </div>
        </div>
      </div>

      {/* CHANNELS ROW */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black text-slate-900">Chaînes</div>
          <div className="text-sm font-bold text-slate-600">{channels.length} disponibles</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {channels.slice(0, 12).map((c) => {
            const active = (liveChannel?.id === c.id) || (liveChannel?.channelName && c.channelName === liveChannel.channelName);
            return (
              <button
                key={c.id}
                onClick={() => setLiveChannel(c)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                {c.name || c.displayName || c.channelName}
              </button>
            );
          })}
          {channels.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              Aucune chaîne encore.
            </div>
          ) : null}
        </div>
      </div>

      {/* POSTS PREVIEW */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="text-lg font-black text-slate-900">Derniers posts</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/posts/${p.id}`}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white hover:shadow-sm"
            >
              <div className="aspect-video bg-slate-100">
                {p.image ? (
                  <img src={p.image} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-lg font-black text-slate-900 group-hover:text-teal-700">
                  {p.title || "Post"}
                </div>
                <div className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {p.content || ""}
                </div>
              </div>
            </Link>
          ))}
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              Aucun post disponible.
            </div>
          ) : null}
        </div>
      </div>

      {/* Channel Picker Modal */}
      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-black">Choisir une chaîne</div>
              <button
                onClick={() => setPickerOpen(false)}
                className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-extrabold"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setLiveChannel(c);
                    setPickerOpen(false);
                  }}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="text-left">
                    <div className="font-black text-slate-900">
                      {c.name || c.displayName || c.channelName}
                    </div>
                    <div className="text-sm text-slate-600">
                      {c.description || "—"}
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                    OPEN
                  </div>
                </button>
              ))}
              {channels.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  Aucune chaîne.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CTA({
  title,
  desc,
  to,
  primary,
}: {
  title: string;
  desc: string;
  to: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`rounded-3xl border p-4 ${
        primary
          ? "border-teal-200 bg-teal-50 hover:bg-teal-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className={`text-base font-black ${primary ? "text-teal-900" : "text-slate-900"}`}>
        {title}
      </div>
      <div className={`mt-1 text-sm ${primary ? "text-teal-900/80" : "text-slate-600"}`}>
        {desc}
      </div>
      <div className={`mt-3 text-sm font-extrabold ${primary ? "text-teal-700" : "text-slate-900"}`}>
        Ouvrir →
      </div>
    </Link>
  );
}
