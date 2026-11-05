/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import HlsVideo from "../components/HlsVideo";
import { openShareInApp } from "../lib/deepLinks";
import { setPageMeta } from "../lib/seo";

const API = "https://live.celeonetv.com/api/social/live/active";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.celeoneapp";
const APP_STORE = "https://apps.apple.com/search?term=Cele%20One";

function sessionIdOf(value: any) {
  return String(value?.sessionId || value?.id || value?.public_id || "");
}

export default function LiveShare() {
  const { liveId = "" } = useParams();
  const [live, setLive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const webUrl = useMemo(() => `${window.location.origin}/live/${encodeURIComponent(liveId)}`, [liveId]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    fetch(`${API}?_=${Date.now()}`, { headers: { Accept: "application/json", "Cache-Control": "no-cache" }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`LIVE_${response.status}`);
        return response.json();
      })
      .then(payload => {
        const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data?.items) ? payload.data.items : Array.isArray(payload?.data) ? payload.data : [];
        const item = items.find((candidate: any) => sessionIdOf(candidate) === decodeURIComponent(liveId));
        if (!cancelled) setLive(item || null);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [liveId]);

  const title = live ? `${live.title || live.hostName || "Cele One LIVE"} | Cele One` : "Cele One LIVE";
  const description = live ? `Watch ${live.hostName || live.title || "this host"} live on Cele One.` : "Open this live broadcast on Cele One.";
  const poster = String(live?.thumbnailUrl || live?.hostAvatar || "https://celeonetv.com/logo.png");
  const playback = String(live?.playbackUrl || live?.hlsUrl || "");
  useEffect(() => {
    setPageMeta({ title, description, image: poster, url: webUrl, canonicalPath: `/live/${encodeURIComponent(liveId)}`, type: "website", structuredData: live ? {
      "@context": "https://schema.org", "@type": "VideoObject", name: title, description, thumbnailUrl: [poster], contentUrl: playback || webUrl, url: webUrl, uploadDate: live.startedAtMs ? new Date(Number(live.startedAtMs)).toISOString() : undefined,
    } : undefined });
  }, [title, description, poster, webUrl, liveId, live, playback]);

  const openApp = () => openShareInApp("live", liveId);
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 text-slate-900">
      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {live?.hostAvatar ? <img src={live.hostAvatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
            <div className="min-w-0"><h1 className="truncate text-2xl font-black">{live?.title || live?.hostName || "Cele One LIVE"}</h1><p className="mt-1 text-white/70">{live?.hostName || "Live broadcast"}{live?.topic ? ` · ${live.topic}` : ""}</p></div>
          </div>
          <span className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black tracking-wider">LIVE</span>
        </div>
        {playback ? <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black"><HlsVideo src={playback} poster={poster} autoPlay={false} /></div> : <div className="mt-6 rounded-2xl bg-white/10 p-5 text-white/80">{loading ? "Finding this live broadcast…" : failed ? "Live details are temporarily unavailable." : "This broadcast is no longer live."}</div>}
        {live?.description ? <p className="mt-4 whitespace-pre-wrap text-white/80">{live.description}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={openApp} className="rounded-xl bg-rose-600 px-5 py-3 font-extrabold text-white">Open in Cele One</button>
          <a href={PLAY_STORE} className="rounded-xl bg-white px-5 py-3 font-extrabold text-slate-950">Download for Android</a>
          <a href={APP_STORE} className="rounded-xl bg-white/15 px-5 py-3 font-extrabold text-white">Get the iPhone app</a>
        </div>
        <p className="mt-4 text-xs text-white/50">Share link: {webUrl}</p>
      </section>
    </main>
  );
}
