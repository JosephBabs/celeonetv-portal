/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HlsVideo from "../components/HlsVideo";
import { APP } from "../lib/config";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";
import { useAuthUser } from "../lib/useAuthUser";

export default function CreatorDashboard() {
  const { user, loading } = useAuthUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);

  const [videoForm, setVideoForm] = useState({ title: "", description: "", mediaUrl: "" });
  const [podcastForm, setPodcastForm] = useState({ title: "", description: "", mediaUrl: "" });
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingPodcast, setSavingPodcast] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Creator Panel | Celeone TV",
      description: "Manage your channels, podcasts, and video content.",
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const requestQ = query(collection(db, "channel_requests"), where("userId", "==", user.uid));
    const videoQ = query(collection(db, "videos"), where("ownerId", "==", user.uid));
    const podcastQ = query(collection(db, "podcasts"), where("ownerId", "==", user.uid));

    const unSubRequests = onSnapshot(requestQ, (snap) => {
      setRequests(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
      );
    });
    const unSubVideos = onSnapshot(videoQ, (snap) => {
      setVideos(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
      );
    });
    const unSubPodcasts = onSnapshot(
      podcastQ,
      (snap) => {
        setPodcasts(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
        );
      },
      () => {
        setPodcasts([]);
      }
    );

    return () => {
      unSubRequests();
      unSubVideos();
      unSubPodcasts();
    };
  }, [user]);

  const approvedChannel = useMemo(() => requests.find((r) => r.status === "approved"), [requests]);

  const hls = useMemo(() => {
    if (!approvedChannel?.streamKey) return null;
    return `${APP.streaming.hlsBase}/${approvedChannel.streamKey}.m3u8`;
  }, [approvedChannel]);

  const saveVideo = async () => {
    if (!user) return;
    if (!videoForm.title.trim()) return alert("Video title is required.");
    setSavingVideo(true);
    try {
      await addDoc(collection(db, "videos"), {
        ownerId: user.uid,
        channelName: approvedChannel?.channelName || "",
        title: videoForm.title.trim(),
        description: videoForm.description.trim(),
        mediaUrl: videoForm.mediaUrl.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setVideoForm({ title: "", description: "", mediaUrl: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to save video.");
    } finally {
      setSavingVideo(false);
    }
  };

  const savePodcast = async () => {
    if (!user) return;
    if (!podcastForm.title.trim()) return alert("Podcast title is required.");
    setSavingPodcast(true);
    try {
      await addDoc(collection(db, "podcasts"), {
        ownerId: user.uid,
        channelName: approvedChannel?.channelName || "",
        title: podcastForm.title.trim(),
        description: podcastForm.description.trim(),
        mediaUrl: podcastForm.mediaUrl.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setPodcastForm({ title: "", description: "", mediaUrl: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to save podcast.");
    } finally {
      setSavingPodcast(false);
    }
  };

  const removeMedia = async (collectionName: "videos" | "podcasts", id: string) => {
    if (!confirm("Delete this item?")) return;
    await deleteDoc(doc(db, collectionName, id));
  };

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Creator Panel</div>
        <div className="mt-2 text-slate-600">Login to manage your channels and media.</div>
        <Link to="/login" className="mt-4 inline-block font-extrabold text-teal-700">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-3xl font-black">Creator Panel</div>
            <div className="mt-1 text-white/80">{user.email || user.uid}</div>
          </div>
          <div className="flex gap-2">
            <Link to="/creator/request" className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-100">
              New Channel Request
            </Link>
            <Link to="/chatrooms/create" className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10">
              Create Chatroom
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Stat label="Requests" value={String(requests.length)} />
          <Stat label="Approved" value={String(requests.filter((r) => r.status === "approved").length)} />
          <Stat label="Videos" value={String(videos.length)} />
          <Stat label="Podcasts" value={String(podcasts.length)} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-lg font-black">Channel Status</div>
        {approvedChannel ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Card label="Channel URL" value={`/${approvedChannel.channelName}/live`} />
            <Card label="RTMP Push" value={`${APP.streaming.rtmpBase}/${approvedChannel.streamKey || "{streamKey}"}`} mono />
            <Card label="HLS Playback" value={`${APP.streaming.hlsBase}/${approvedChannel.streamKey || "{streamKey}"}.m3u8`} mono />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No approved channel yet. Submit a request to activate live streaming.
          </div>
        )}
        {hls ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            <div className="aspect-video">
              <HlsVideo src={hls} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MediaForm
          title="Publish Video"
          state={videoForm}
          saving={savingVideo}
          onChange={setVideoForm}
          onSubmit={saveVideo}
        />
        <MediaForm
          title="Publish Podcast"
          state={podcastForm}
          saving={savingPodcast}
          onChange={setPodcastForm}
          onSubmit={savePodcast}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MediaList
          title="My Videos"
          items={videos}
          onDelete={(id) => removeMedia("videos", id)}
        />
        <MediaList
          title="My Podcasts"
          items={podcasts}
          onDelete={(id) => removeMedia("podcasts", id)}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
      <div className="text-xs font-extrabold text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function Card({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>
      <div className={`mt-2 text-sm font-semibold text-slate-900 ${mono ? "break-all font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function MediaForm({
  title,
  state,
  saving,
  onChange,
  onSubmit,
}: {
  title: string;
  state: { title: string; description: string; mediaUrl: string };
  saving: boolean;
  onChange: (v: { title: string; description: string; mediaUrl: string }) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black">{title}</div>
      <div className="mt-4 grid gap-3">
        <input
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          placeholder="Title"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <input
          value={state.mediaUrl}
          onChange={(e) => onChange({ ...state, mediaUrl: e.target.value })}
          placeholder="Media URL"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <textarea
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          placeholder="Description"
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>
      <button
        disabled={saving}
        onClick={onSubmit}
        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving..." : `Save ${title.includes("Video") ? "Video" : "Podcast"}`}
      </button>
    </div>
  );
}

function MediaList({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: any[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-black">{title}</div>
        <div className="text-sm font-bold text-slate-500">{items.length}</div>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="text-base font-black text-slate-900">{item.title || "Untitled"}</div>
            <div className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description || ""}</div>
            {item.mediaUrl ? (
              <a href={item.mediaUrl} target="_blank" className="mt-2 block text-sm font-extrabold text-teal-700" rel="noreferrer">
                Open media link
              </a>
            ) : null}
            <div className="mt-3">
              <button
                onClick={() => onDelete(item.id)}
                className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No content yet.</div>
        ) : null}
      </div>
    </div>
  );
}

function getTime(value: any) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}
