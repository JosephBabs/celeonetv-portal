/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HlsVideo from "../components/HlsVideo";
import { APP } from "../lib/config";
import { uploadToCeleoneCdn } from "../lib/cdnUpload";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";
import { useAuthUser } from "../lib/useAuthUser";

export default function CreatorDashboard() {
  const { user, loading } = useAuthUser();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);

  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    coverUrl: "",
  });
  const [songForm, setSongForm] = useState({
    title: "",
    artist: "",
    album: "",
    description: "",
    audioUrl: "",
    coverUrl: "",
  });

  const [savingVideo, setSavingVideo] = useState(false);
  const [savingSong, setSavingSong] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Creator Panel | Celeone TV",
      description: "Manage your channels, songs, and film videos.",
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, "user_data", user.uid);
    const unSubProfile = onSnapshot(
      profileRef,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const resolvedOwnerId = String(data?.ownerId || data?.userId || data?.uid || user.uid);
        setOwnerId(resolvedOwnerId);
      },
      () => {
        setOwnerId(user.uid);
      }
    );

    return () => {
      unSubProfile();
    };
  }, [user]);

  useEffect(() => {
    if (!user || !ownerId) return;

    const requestQ = query(collection(db, "channel_requests"), where("userId", "==", user.uid));
    const channelsQ = query(collection(db, "channels"), where("ownerId", "==", ownerId));
    const videoQ = query(collection(db, "videos"), where("ownerId", "==", ownerId));
    const songsQ = query(collection(db, "songs"), where("ownerId", "==", ownerId));

    const unSubRequests = onSnapshot(requestQ, (snap) => {
      setRequests(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
      );
    });

    const unSubChannels = onSnapshot(
      channelsQ,
      (snap) => {
        setChannels(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
        );
      },
      async () => {
        if (ownerId !== user.uid) {
          const fallbackSnap = await getDocs(query(collection(db, "channels"), where("ownerId", "==", user.uid)));
          setChannels(
            fallbackSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
          );
        } else {
          setChannels([]);
        }
      }
    );

    const unSubVideos = onSnapshot(videoQ, (snap) => {
      setVideos(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
      );
    });

    const unSubSongs = onSnapshot(
      songsQ,
      (snap) => {
        setSongs(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt))
        );
      },
      () => {
        setSongs([]);
      }
    );

    return () => {
      unSubRequests();
      unSubChannels();
      unSubVideos();
      unSubSongs();
    };
  }, [ownerId, user]);

  const approvedChannel = useMemo(() => {
    const fromChannels =
      channels.find((c: any) => c.status === "approved") ||
      channels.find((c: any) => c.streamLink || c.hlsUrl || c.streamKey) ||
      channels[0];
    return fromChannels || requests.find((r) => r.status === "approved") || null;
  }, [channels, requests]);

  const hls = useMemo(() => {
    if (!approvedChannel) return null;
    const direct =
      approvedChannel.streamLink ||
      approvedChannel.hlsUrl ||
      approvedChannel.streamUrl ||
      approvedChannel.playbackUrl ||
      approvedChannel.m3u8 ||
      approvedChannel.url;
    if (direct) return String(direct).replace(".m6u8", ".m3u8");
    if (!approvedChannel.streamKey) return null;
    return `${APP.streaming.hlsBase}/${approvedChannel.streamKey}.m3u8`;
  }, [approvedChannel]);

  const saveVideo = async () => {
    if (!user) return;
    if (!videoForm.title.trim()) return alert("Film title is required.");
    if (!videoForm.videoUrl.trim()) return alert("Film video URL is required.");
    setSavingVideo(true);
    try {
      await addDoc(collection(db, "videos"), {
        ownerId: ownerId || user.uid,
        channelName: approvedChannel?.channelName || "",
        title: videoForm.title.trim(),
        description: videoForm.description.trim(),
        videoUrl: videoForm.videoUrl.trim(),
        mediaUrl: videoForm.videoUrl.trim(),
        coverUrl: videoForm.coverUrl.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setVideoForm({ title: "", description: "", videoUrl: "", coverUrl: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to save film video.");
    } finally {
      setSavingVideo(false);
    }
  };

  const saveSong = async () => {
    if (!user) return;
    if (!songForm.title.trim()) return alert("Song title is required.");
    if (!songForm.audioUrl.trim()) return alert("Song audio URL is required.");
    setSavingSong(true);
    try {
      await addDoc(collection(db, "songs"), {
        ownerId: ownerId || user.uid,
        artist: songForm.artist.trim() || user.email || "Unknown artist",
        album: songForm.album.trim(),
        title: songForm.title.trim(),
        description: songForm.description.trim(),
        audioUrl: songForm.audioUrl.trim(),
        mediaUrl: songForm.audioUrl.trim(),
        coverUrl: songForm.coverUrl.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSongForm({ title: "", artist: "", album: "", description: "", audioUrl: "", coverUrl: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to save song.");
    } finally {
      setSavingSong(false);
    }
  };

  const removeMedia = async (collectionName: "videos" | "songs", id: string) => {
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
          <Stat label="My Channels" value={String(channels.length)} />
          <Stat label="Film Videos" value={String(videos.length)} />
          <Stat label="Songs" value={String(songs.length)} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-lg font-black">Channel Status</div>
        {approvedChannel ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Card label="Channel URL" value={`/${approvedChannel.channelName}/live`} />
            <Card label="RTMP Push" value={`${APP.streaming.rtmpBase}/${approvedChannel.streamKey || "{streamKey}"}`} mono />
            <Card label="HLS Playback" value={hls || "No playback URL"} mono />
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
        <VideoForm state={videoForm} saving={savingVideo} onChange={setVideoForm} onSubmit={saveVideo} />
        <SongForm state={songForm} saving={savingSong} onChange={setSongForm} onSubmit={saveSong} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MediaList
          title="My Film Videos"
          items={videos}
          urlField="videoUrl"
          onDelete={(id) => removeMedia("videos", id)}
        />
        <MediaList
          title="My Songs"
          items={songs}
          urlField="audioUrl"
          onDelete={(id) => removeMedia("songs", id)}
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

function VideoForm({
  state,
  saving,
  onChange,
  onSubmit,
}: {
  state: { title: string; description: string; videoUrl: string; coverUrl: string };
  saving: boolean;
  onChange: (v: { title: string; description: string; videoUrl: string; coverUrl: string }) => void;
  onSubmit: () => void;
}) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black">Publish Film Video</div>
      <div className="mt-4 grid gap-3">
        <input
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          placeholder="Film title"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />

        <input
          value={state.videoUrl}
          onChange={(e) => onChange({ ...state, videoUrl: e.target.value })}
          placeholder="Video URL"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100">
          <span>{uploadingVideo ? "Uploading..." : "Upload Film Video"}</span>
          <input
            type="file"
            className="hidden"
            disabled={uploadingVideo}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingVideo(true);
              try {
                const url = await uploadToCeleoneCdn(file, "vfilm");
                onChange({ ...state, videoUrl: url });
              } catch (err: any) {
                console.error(err);
                alert(err?.message || "Upload failed.");
              } finally {
                setUploadingVideo(false);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>

        <input
          value={state.coverUrl}
          onChange={(e) => onChange({ ...state, coverUrl: e.target.value })}
          placeholder="Cover image URL"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100">
          <span>{uploadingCover ? "Uploading..." : "Upload Cover"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingCover}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingCover(true);
              try {
                const url = await uploadToCeleoneCdn(file, "vfilm");
                onChange({ ...state, coverUrl: url });
              } catch (err: any) {
                console.error(err);
                alert(err?.message || "Upload failed.");
              } finally {
                setUploadingCover(false);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>

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
        {saving ? "Saving..." : "Create Film Video"}
      </button>
    </div>
  );
}

function SongForm({
  state,
  saving,
  onChange,
  onSubmit,
}: {
  state: { title: string; artist: string; album: string; description: string; audioUrl: string; coverUrl: string };
  saving: boolean;
  onChange: (v: { title: string; artist: string; album: string; description: string; audioUrl: string; coverUrl: string }) => void;
  onSubmit: () => void;
}) {
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black">Publish Song</div>
      <div className="mt-4 grid gap-3">
        <input
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          placeholder="Song title"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <input
          value={state.artist}
          onChange={(e) => onChange({ ...state, artist: e.target.value })}
          placeholder="Artist"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <input
          value={state.album}
          onChange={(e) => onChange({ ...state, album: e.target.value })}
          placeholder="Album"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />

        <input
          value={state.audioUrl}
          onChange={(e) => onChange({ ...state, audioUrl: e.target.value })}
          placeholder="Audio URL"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100">
          <span>{uploadingAudio ? "Uploading..." : "Upload Song Audio"}</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={uploadingAudio}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingAudio(true);
              try {
                const url = await uploadToCeleoneCdn(file, "song");
                onChange({ ...state, audioUrl: url });
              } catch (err: any) {
                console.error(err);
                alert(err?.message || "Upload failed.");
              } finally {
                setUploadingAudio(false);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>

        <input
          value={state.coverUrl}
          onChange={(e) => onChange({ ...state, coverUrl: e.target.value })}
          placeholder="Cover image URL"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
        />
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100">
          <span>{uploadingCover ? "Uploading..." : "Upload Cover"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingCover}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingCover(true);
              try {
                const url = await uploadToCeleoneCdn(file, "song");
                onChange({ ...state, coverUrl: url });
              } catch (err: any) {
                console.error(err);
                alert(err?.message || "Upload failed.");
              } finally {
                setUploadingCover(false);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>

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
        {saving ? "Saving..." : "Create Song"}
      </button>
    </div>
  );
}

function MediaList({
  title,
  items,
  urlField,
  onDelete,
}: {
  title: string;
  items: any[];
  urlField: "audioUrl" | "videoUrl";
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-black">{title}</div>
        <div className="text-sm font-bold text-slate-500">{items.length}</div>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const media = item[urlField] || item.mediaUrl;
          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="text-base font-black text-slate-900">{item.title || "Untitled"}</div>
              {item.artist ? <div className="mt-1 text-xs font-bold text-slate-600">{item.artist}</div> : null}
              <div className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description || ""}</div>
              {media ? (
                <a href={media} target="_blank" className="mt-2 block text-sm font-extrabold text-teal-700" rel="noreferrer">
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
          );
        })}
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
