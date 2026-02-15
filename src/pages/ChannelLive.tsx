/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import HlsVideo from "../components/HlsVideo";
import { db } from "../lib/firebase";
import { APP } from "../lib/config";

export default function ChannelLive() {
  const { channelName } = useParams();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (!channelName) return;
      setLoading(true);
      try {
        // Try channels collection first
        const q1 = query(collection(db, "channels"), where("channelName", "==", channelName), limit(1));
        const s1 = await getDocs(q1);
        if (!s1.empty) {
          setChannel({ id: s1.docs[0].id, ...s1.docs[0].data() });
          return;
        }

        // Fallback: approved request
        const q2 = query(
          collection(db, "channel_requests"),
          where("channelName", "==", channelName),
          where("status", "==", "approved"),
          limit(1)
        );
        const s2 = await getDocs(q2);
        if (!s2.empty) {
          setChannel({ id: s2.docs[0].id, ...s2.docs[0].data() });
          return;
        }

        setChannel(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [channelName]);

  const hls = useMemo(() => {
    const key = channel?.streamKey;
    if (!key) return null;
    return `${APP.streaming.hlsBase}/${key}.m3u8`;
  }, [channel]);

  if (loading) return <div className="py-10 text-center text-slate-600">Chargement…</div>;

  if (!channel) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Chaîne introuvable</div>
        <div className="mt-2 text-slate-600">
          Le lien <span className="font-bold">/{channelName}/live</span> n’existe pas ou n’est pas encore approuvé.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black">{channel.displayName || channel.name || channel.channelName}</div>
            <div className="mt-1 text-slate-600">{channel.description || "Live streaming on Celeone"}</div>
          </div>
          <div className="rounded-full bg-teal-100 px-4 py-2 text-sm font-extrabold text-teal-800">
            LIVE
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
          <div className="aspect-video">
            {hls ? (
              <HlsVideo src={hls} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/85">
                Channel not currently streaming
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-600">
          Powered by HLS • CeleoneTV
        </div>
      </div>
    </div>
  );
}
