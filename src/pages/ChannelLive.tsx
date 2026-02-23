/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HlsVideo from "../components/HlsVideo";
import { APP } from "../lib/config";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

function normalize(v: unknown) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function hasStream(channel: any) {
  return Boolean(
    channel?.streamLink ||
      channel?.hlsUrl ||
      channel?.streamUrl ||
      channel?.playbackUrl ||
      channel?.m3u8 ||
      channel?.url ||
      channel?.streamKey
  );
}

function getStreamUrl(channel: any) {
  if (!channel) return null;
  const direct =
    channel.streamLink ||
    channel.hlsUrl ||
    channel.streamUrl ||
    channel.playbackUrl ||
    channel.m3u8 ||
    channel.url;
  if (direct) {
    const raw = String(direct).trim();
    if (raw.includes(".m6u8")) return raw.replace(".m6u8", ".m3u8");
    return raw;
  }
  if (channel.streamKey) return `${APP.streaming.hlsBase}/${channel.streamKey}.m3u8`;
  return null;
}

export default function ChannelLive() {
  const { channelName } = useParams();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const routeKey = normalize(channelName);

        // Pull channels once and resolve locally across multiple fields.
        const channelsSnap = await getDocs(query(collection(db, "channels"), limit(100)));
        const channels = channelsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const directMatch = channels.find((c: any) => {
          const candidates = [
            normalize(c.channelName),
            normalize(c.name),
            normalize(c.displayName),
            normalize(c.slug),
            normalize(c.id),
          ].filter(Boolean);
          return candidates.includes(routeKey);
        });

        if (directMatch && hasStream(directMatch)) {
          setChannel(directMatch);
          return;
        }

        // Legacy fallback from approved requests.
        if (channelName) {
          const q2 = query(
            collection(db, "channel_requests"),
            where("channelName", "==", channelName),
            where("status", "==", "approved"),
            limit(1)
          );
          const s2 = await getDocs(q2);
          if (!s2.empty) {
            const req = { id: s2.docs[0].id, ...s2.docs[0].data() };
            if (hasStream(req)) {
              setChannel(req);
              return;
            }
          }
        }

        // Preferred fallback for `/channel/live` or unknown slug:
        // 1) Cele One TV from channels, 2) first streamable channel.
        const celeOne = channels.find((c: any) => {
          const label = `${c.displayName || ""} ${c.name || ""} ${c.channelName || ""}`.toLowerCase();
          return (label.includes("cele one tv") || label.includes("celeone tv")) && hasStream(c);
        });
        if (celeOne) {
          setChannel(celeOne);
          return;
        }

        const firstStreamable = channels.find((c: any) => hasStream(c)) || null;
        setChannel(firstStreamable);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [channelName]);

  const hls = useMemo(() => getStreamUrl(channel), [channel]);

  useEffect(() => {
    const titleName = channel?.displayName || channel?.name || channelName || "Live";
    setPageMeta({
      title: `${titleName} Live | Celeone TV`,
      description: `Watch ${titleName} live on Celeone TV.`,
      type: "website",
    });
  }, [channel, channelName]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading live channel...</div>;

  if (!channel || !hls) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Channel not found</div>
        <div className="mt-2 text-slate-600">
          The route <span className="font-bold">/{channelName}/live</span> does not currently map to a streamable channel.
        </div>
        <Link to="/" className="mt-4 inline-block rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">
          Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-3xl font-black">{channel.displayName || channel.name || channel.channelName}</div>
            <div className="mt-2 text-white/80">{channel.description || "Live streaming on Cele One TV"}</div>
          </div>
          <div className="rounded-full bg-red-500 px-4 py-2 text-sm font-extrabold tracking-wider text-white">LIVE</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-black">
        <div className="aspect-video">
          <HlsVideo src={hls} />
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Info label="Share URL" value={channel?.channelName ? `${APP.streaming.publicLiveBase}/${channel.channelName}/live` : window.location.href} />
        <Info label="Stream Source" value={hls} mono />
      </section>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>
      <div className={`mt-2 text-sm text-slate-900 ${mono ? "break-all font-mono" : "font-semibold"}`}>{value}</div>
    </div>
  );
}
