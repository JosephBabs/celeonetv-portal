/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { APP } from "../lib/config";
import { useI18n } from "../lib/i18n";
import HlsVideo from "../components/HlsVideo";

export default function Home() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [liveChannel, setLiveChannel] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const chSnap = await getDocs(query(collection(db, "channels"), orderBy("createdAt", "desc"), limit(30)));
        const chList = chSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChannels(chList);

        const featuredSnap = await getDocs(query(collection(db, "channels"), where("featured", "==", true), limit(1)));
        if (!featuredSnap.empty) setLiveChannel({ id: featuredSnap.docs[0].id, ...featuredSnap.docs[0].data() });
        else if (chList.length > 0) setLiveChannel(chList[0]);
        else {
          const reqSnap = await getDocs(query(collection(db, "channel_requests"), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(1)));
          if (!reqSnap.empty) setLiveChannel({ id: reqSnap.docs[0].id, ...reqSnap.docs[0].data() });
        }

        const pSnap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6)));
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
    return key ? `${APP.streaming.hlsBase}/${key}.m3u8` : null;
  }, [liveChannel]);

  const liveUrl = useMemo(() => (liveChannel?.channelName ? `/${liveChannel.channelName}/live` : null), [liveChannel]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-2xl font-black text-slate-900">{t("home.live_tv", "Live TV")}</div>
            <div className="mt-1 text-slate-600">{liveChannel?.displayName || liveChannel?.name || t("home.no_channel", "No channel")} <span className="text-slate-400">•</span> {liveChannel?.description || t("home.streaming", "Streaming on CeleoneTV")}</div>
          </div>
          <div className="flex items-center gap-2">
            {liveUrl ? <Link to={liveUrl} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800">{t("home.open_live", "Open live page")}</Link> : null}
            <button onClick={() => setPickerOpen(true)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-200">{t("home.switch_channel", "Switch channel")}</button>
          </div>
        </div>
        <div className="border-t border-slate-200"><div className="aspect-video w-full bg-slate-900">{loading ? <div className="flex h-full items-center justify-center text-white/80">{t("common.loading", "Loading...")}</div> : hls ? <HlsVideo src={hls} /> : <div className="flex h-full items-center justify-center text-white/85">{t("home.not_streaming", "Channel not currently streaming")}</div>}</div></div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between"><div className="text-lg font-black text-slate-900">{t("home.channels", "Channels")}</div><div className="text-sm font-bold text-slate-600">{channels.length} {t("home.available", "available")}</div></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {channels.slice(0, 12).map((c) => (
            <button key={c.id} onClick={() => setLiveChannel(c)} className={`rounded-full px-4 py-2 text-sm font-extrabold ${(liveChannel?.id === c.id) ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}>{c.name || c.displayName || c.channelName}</button>
          ))}
          {channels.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{t("home.no_channels", "No channels yet.")}</div> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="text-lg font-black text-slate-900">{t("home.latest_posts", "Latest posts")}</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to={`/posts/${p.id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white hover:shadow-sm">
              <div className="aspect-video bg-slate-100">{p.image ? <img src={p.image} className="h-full w-full object-cover" /> : null}</div>
              <div className="p-4"><div className="line-clamp-2 text-lg font-black text-slate-900 group-hover:text-teal-700">{p.title || t("home.post", "Post")}</div><div className="mt-2 line-clamp-2 text-sm text-slate-600">{p.content || ""}</div></div>
            </Link>
          ))}
          {posts.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{t("home.no_posts", "No posts available.")}</div> : null}
        </div>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5">
            <div className="flex items-center justify-between"><div className="text-lg font-black">{t("home.choose_channel", "Choose channel")}</div><button onClick={() => setPickerOpen(false)} className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-extrabold">{t("common.close", "Close")}</button></div>
            <div className="mt-4 grid gap-3">
              {channels.map((c) => (
                <button key={c.id} onClick={() => { setLiveChannel(c); setPickerOpen(false); }} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <div className="text-left"><div className="font-black text-slate-900">{c.name || c.displayName || c.channelName}</div><div className="text-sm text-slate-600">{c.description || "-"}</div></div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{t("home.open", "OPEN")}</div>
                </button>
              ))}
              {channels.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{t("home.no_channels", "No channels yet.")}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
