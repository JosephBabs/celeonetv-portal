/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadToCeleoneCdn, type CdnUploadKind } from "../lib/cdnUpload";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";
import { calculateRevenueDistribution, formatMoney } from "../lib/revenueEngine";

/**
 * AdminDashboard (extended)
 * ✅ Stats cards
 * ✅ Requests + Packages (existing)
 * ✅ NEW: "Manage" modals for:
 *  - user_data
 *  - chatrooms
 *  - posts
 *  - joinRequests
 *  - platformRequests
 *  - cantiques
 *  - channels
 *  - songs
 *  - videos
 *
 * Notes:
 * - We keep everything Firestore-only inside these modals (per your rule).
 * - For big collections, we load last 50 by createdAt when available.
 * - You can extend each modal's fields later.
 */

type ManageKey =
  | "user_data"
  | "chatrooms"
  | "posts"
  | "documents"
  | "joinRequests"
  | "platformRequests"
  | "cantiques"
  | "channels"
  | "songs"
  | "videos";

const COLLECTION_META: Record<
  ManageKey,
  {
    label: string;
    icon: string;
    primary?: string; // primary display field
    secondary?: string; // secondary display field
    orderField?: string; // optional sort field
  }
> = {
  user_data: { label: "Users", icon: "👤", primary: "email", secondary: "firstName", orderField: "createdAt" },
  chatrooms: { label: "Chatrooms", icon: "💬", primary: "name", secondary: "lastMessage", orderField: "updatedAt" },
  posts: { label: "Posts", icon: "📝", primary: "title", secondary: "category", orderField: "createdAt" },
  documents: { label: "Documents", icon: "📄", primary: "title", secondary: "category", orderField: "updatedAt" },
  joinRequests: { label: "Join Requests", icon: "⏳", primary: "email", secondary: "status", orderField: "createdAt" },
  platformRequests: { label: "Platform Requests", icon: "🧾", primary: "title", secondary: "status", orderField: "createdAt" },
  cantiques: { label: "Cantiques", icon: "🎶", primary: "title", secondary: "author", orderField: "createdAt" },
  channels: { label: "TV Channels", icon: "📺", primary: "name", secondary: "ownerId", orderField: "createdAt" },
  songs: { label: "Songs", icon: "🎧", primary: "title", secondary: "artist", orderField: "createdAt" },
  videos: { label: "Videos", icon: "🎬", primary: "title", secondary: "channelName", orderField: "createdAt" },
};

const PAGE_SIZE = 50;

export default function AdminDashboard() {
  const nav = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: "Admin Dashboard | Celeone TV",
      description: "Manage users, posts, chatrooms, cantiques, requests and channels.",
    });
  }, []);

  // ---------- stats ----------
  const [counts, setCounts] = useState({
    users: 0,
    chatrooms: 0,
    posts: 0,
    documents: 0,
    pendingRequests: 0,
    platformRequests: 0,
    cantiques: 0,
    tvChannels: 0,
    filmsAndSongs: 0,
    videos: 0,
    subscriptionPackages: 0,
    activeUserSubscriptions: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async () => {
    try {
      setRefreshing(true);

      const [
        usersSnap,
        chatroomsSnap,
        postsSnap,
        documentsSnap,
        pendingSnap,
        platformSnap,
        cantiquesSnap,
        tvSnap,
        songsSnap,
        videosSnap,
        subscriptionPackagesSnap,
        userSubscriptionsSnap,
      ] = await Promise.all([
        getDocs(collection(db, "user_data")),
        getDocs(collection(db, "chatrooms")),
        getDocs(collection(db, "posts")),
        getDocs(collection(db, "documents")),
        getDocs(collection(db, "joinRequests")),
        getDocs(collection(db, "platformRequests")),
        getDocs(collection(db, "cantiques")),
        getDocs(collection(db, "channels")),
        getDocs(collection(db, "songs")),
        getDocs(collection(db, "videos")),
        getDocs(collection(db, "subscription_packages")),
        getDocs(collection(db, "user_subscriptions")),
      ]);

      setCounts({
        users: usersSnap.size,
        chatrooms: chatroomsSnap.size,
        posts: postsSnap.size,
        documents: documentsSnap.size,
        pendingRequests: pendingSnap.size,
        platformRequests: platformSnap.size,
        cantiques: cantiquesSnap.size,
        tvChannels: tvSnap.size,
        filmsAndSongs: songsSnap.size,
        videos: videosSnap.size,
        subscriptionPackages: subscriptionPackagesSnap.size,
        activeUserSubscriptions: userSubscriptionsSnap.docs.filter((d) => d.data()?.status === "active").length,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    } finally {
      setLoadingCounts(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- requests + subscriptions ----------
  const [requests, setRequests] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [songsRevenueRows, setSongsRevenueRows] = useState<any[]>([]);
  const [videosRevenueRows, setVideosRevenueRows] = useState<any[]>([]);
  const [periodDays, setPeriodDays] = useState(30);
  const [songMonetizeThreshold, setSongMonetizeThreshold] = useState(100);
  const [videoMonetizeThreshold, setVideoMonetizeThreshold] = useState(100);
  const [creatingSong, setCreatingSong] = useState(false);
  const [creatingVideoItem, setCreatingVideoItem] = useState(false);
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    album: "",
    description: "",
    coverUrl: "",
    audioUrl: "",
    ownerId: "",
  });
  const [newVideoItem, setNewVideoItem] = useState({
    title: "",
    channelName: "",
    artistId: "",
    coverUrl: "",
    link: "",
    isPremium: false,
    type: "movie" as "movie" | "series" | "musicVideo",
    description: "",
    duration: "",
    uploadTime: "",
    captionsUrl: "",
  });
  const [episodeDraft, setEpisodeDraft] = useState({
    title: "",
    coverUrl: "",
    link: "",
    duration: "",
    episodeNumber: 1,
    seasonNumber: 1,
  });
  const [newEpisodes, setNewEpisodes] = useState<any[]>([]);
  const [uploadingSongAudio, setUploadingSongAudio] = useState(false);
  const [uploadingSongCover, setUploadingSongCover] = useState(false);
  const [uploadingVideoLink, setUploadingVideoLink] = useState(false);
  const [uploadingVideoCover, setUploadingVideoCover] = useState(false);
  const [uploadingEpisodeLink, setUploadingEpisodeLink] = useState(false);
  const [uploadingEpisodeCover, setUploadingEpisodeCover] = useState(false);
  const [manageEpisodeDraft, setManageEpisodeDraft] = useState({
    title: "",
    coverUrl: "",
    link: "",
    duration: "",
    episodeNumber: 1,
    seasonNumber: 1,
  });

  // package form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDays, setPDays] = useState("30");

  // modals
  const [modalOpen, setModalOpen] = useState<
    | null
    | "CREATE_PACKAGE"
    | "EDIT_PACKAGE"
    | "VIEW_REQUEST"
    | "MANAGE_COLLECTION"
    | "CREATE_MEDIA"
    | "USER_SUBSCRIPTIONS"
    | "JEUNESSE_ADMIN"
  >(null);

  const [activePkg, setActivePkg] = useState<any>(null);
  // const [activeReq, setActiveReq] = useState<any>(null);
  const [jeunesseLoading, setJeunesseLoading] = useState(false);
  const [jeunesseChildren, setJeunesseChildren] = useState<any[]>([]);
  const [jeunesseResults, setJeunesseResults] = useState<any[]>([]);
  const [jeunesseSettings, setJeunesseSettings] = useState<any>({});
  const [jeunesseYear, setJeunesseYear] = useState(String(new Date().getFullYear()));
  const [jeunesseSearch, setJeunesseSearch] = useState("");
  const [jeunesseTab, setJeunesseTab] = useState<"children" | "results" | "settings">("children");
  const [periodDraft, setPeriodDraft] = useState({
    prelimStart: "",
    prelimEnd: "",
    preselectionStart: "",
    preselectionEnd: "",
    selectionStart: "",
    selectionEnd: "",
    finalStart: "",
    finalEnd: "",
  });
  const [resultDraft, setResultDraft] = useState({
    identifier: "",
    phase: "prelim",
    status: "passed",
    average: "",
    notes: "",
  });

  useEffect(() => {
    const q1 = query(collection(db, "channel_requests"), orderBy("createdAt", "desc"));
    const u1 = onSnapshot(q1, (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    const q2 = query(collection(db, "subscription_packages"), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(q2, (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    const q3 = query(collection(db, "user_subscriptions"), orderBy("updatedAt", "desc"));
    const u3 = onSnapshot(
      q3,
      (snap) => setUserSubscriptions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setUserSubscriptions([])
    );

    const q4 = query(collection(db, "songs"), limit(1000));
    const u4 = onSnapshot(
      q4,
      (snap) => setSongsRevenueRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setSongsRevenueRows([])
    );

    const q5 = query(collection(db, "videos"), limit(1000));
    const u5 = onSnapshot(
      q5,
      (snap) => setVideosRevenueRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setVideosRevenueRows([])
    );

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, []);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const revenueModel = useMemo(
    () =>
      calculateRevenueDistribution({
        subscriptions: userSubscriptions,
        songs: songsRevenueRows,
        videos: videosRevenueRows,
        periodDays,
        songMonetizeThreshold,
        videoMonetizeThreshold,
      }),
    [periodDays, songMonetizeThreshold, songsRevenueRows, userSubscriptions, videoMonetizeThreshold, videosRevenueRows]
  );

  const approve = async (r: any) => {
    await updateDoc(doc(db, "channel_requests", r.id), {
      status: "approved",
      updatedAt: serverTimestamp(),
    });
    alert("Approved. Next step: generate streamKey via Node + create channel doc, then write back to Firestore.");
  };

  const reject = async (r: any) => {
    await updateDoc(doc(db, "channel_requests", r.id), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
  };

  const createPackage = async () => {
    if (!pName.trim()) return alert("Package name required");
    if (!pPrice.trim()) return alert("Price required");

    await addDoc(collection(db, "subscription_packages"), {
      name: pName.trim(),
      price: Number(pPrice || "0"),
      durationDays: Number(pDays || "30"),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setPName("");
    setPPrice("");
    setPDays("30");
    setModalOpen(null);
  };

  const openEditPackage = (pkg: any) => {
    setActivePkg(pkg);
    setPName(pkg.name || "");
    setPPrice(String(pkg.price ?? ""));
    setPDays(String(pkg.durationDays ?? "30"));
    setModalOpen("EDIT_PACKAGE");
  };

  const saveEditPackage = async () => {
    if (!activePkg) return;
    if (!pName.trim()) return alert("Package name required");
    if (!pPrice.trim()) return alert("Price required");

    await updateDoc(doc(db, "subscription_packages", activePkg.id), {
      name: pName.trim(),
      price: Number(pPrice || "0"),
      durationDays: Number(pDays || "30"),
      updatedAt: serverTimestamp(),
    });

    setActivePkg(null);
    setPName("");
    setPPrice("");
    setPDays("30");
    setModalOpen(null);
  };

  const togglePackage = async (pkg: any) => {
    await updateDoc(doc(db, "subscription_packages", pkg.id), {
      isActive: !pkg.isActive,
      updatedAt: serverTimestamp(),
    });
  };

  // ---------- NEW: Manage Collection modal state ----------
  const [manageKey, setManageKey] = useState<ManageKey | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageItems, setManageItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [manageMobileTab, setManageMobileTab] = useState<"list" | "editor">("list");

  // edit form (generic key/value editor)
  const [editDraft, setEditDraft] = useState<any>({});
  const [editJsonMode, setEditJsonMode] = useState(false);
  const [editJsonText, setEditJsonText] = useState("");

  const openManage = async (key: ManageKey) => {
    setManageKey(key);
    setSelectedItem(null);
    setEditDraft({});
    setEditJsonMode(false);
    setEditJsonText("");
    setManageMobileTab("list");
    setModalOpen("MANAGE_COLLECTION");
    await loadManageItems(key);
  };

/**
 * 加载管理项目的异步函数
 * @param key - 管理键，用于标识要加载的集合
 */
  const loadManageItems = async (key: ManageKey) => {
    setManageLoading(true);
    try {
      const meta = COLLECTION_META[key];
      // try best-effort ordered query if orderField exists; fallback to plain getDocs
      let items: any[] = [];
      try {
        if (meta.orderField) {
          const q = query(
            collection(db, key),
            orderBy(meta.orderField as any, "desc"),
            limit(PAGE_SIZE)
          );
          const snap = await getDocs(q);
          items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Some collections (like songs) may not have orderField on all docs.
          // Firestore excludes missing-field docs from ordered queries, so fallback.
          if (items.length === 0) {
            const plainSnap = await getDocs(collection(db, key));
            items = plainSnap.docs.slice(0, PAGE_SIZE).map((d) => ({ id: d.id, ...d.data() }));
          }
        } else {
          const snap = await getDocs(collection(db, key));
          items = snap.docs.slice(0, PAGE_SIZE).map((d) => ({ id: d.id, ...d.data() }));
        }
      } catch {
        const snap = await getDocs(collection(db, key));
        items = snap.docs.slice(0, PAGE_SIZE).map((d) => ({ id: d.id, ...d.data() }));
      }

      setManageItems(items);
    } catch (e) {
      console.error("Load manage items error:", e);
      alert("Failed to load collection data.");
    } finally {
      setManageLoading(false);
    }
  };

  const openItem = (item: any) => {
    setSelectedItem(item);
    setEditDraft(item);
    setEditJsonText(JSON.stringify(item, null, 2));
    setManageMobileTab("editor");
  };

  const saveItem = async () => {
    if (!manageKey || !selectedItem?.id) return;

    try {
      const ref = doc(db, manageKey, selectedItem.id);

      let payload: any = {};

      if (editJsonMode) {
        try {
          const parsed = JSON.parse(editJsonText || "{}");
          // Never allow overwriting id field
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = parsed;
          payload = rest;
        } catch (e) {
          alert(`Invalid JSON. ${e}`);
          return;
        }
      } else {
        // simple form mode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = editDraft || {};
        payload = rest;
      }

      // common updatedAt
      payload.updatedAt = serverTimestamp();

      await updateDoc(ref, payload);
      alert("Saved.");

      // refresh list item locally
      setManageItems((prev) =>
        prev.map((x) => (x.id === selectedItem.id ? { ...x, ...payload } : x))
      );
      // refresh selected view
      setSelectedItem((prev: any) => (prev ? { ...prev, ...payload } : prev));
    } catch (e) {
      console.error("Save item error:", e);
      alert("Failed to save.");
    }
  };

  const deleteItem = async () => {
    if (!manageKey || !selectedItem?.id) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, manageKey, selectedItem.id));
      setManageItems((prev) => prev.filter((x) => x.id !== selectedItem.id));
      setSelectedItem(null);
      setEditDraft({});
      setEditJsonText("");
      alert("Deleted.");
      // refresh counts (optional)
      fetchCounts();
    } catch (e) {
      console.error("Delete item error:", e);
      alert("Failed to delete.");
    }
  };

  const uploadAsset = async (file: File, kind: CdnUploadKind) => {
    const url = await uploadToCeleoneCdn(file, kind);
    return String(url || "").trim();
  };

  const addEpisodeDraft = () => {
    if (!episodeDraft.title.trim()) return alert("Episode title is required.");
    if (!episodeDraft.link.trim()) return alert("Episode link is required.");
    const ep = {
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: episodeDraft.title.trim(),
      coverUrl: episodeDraft.coverUrl.trim(),
      link: episodeDraft.link.trim(),
      duration: episodeDraft.duration.trim(),
      episodeNumber: Number(episodeDraft.episodeNumber || 1),
      seasonNumber: Number(episodeDraft.seasonNumber || 1),
      createdAt: Date.now(),
    };
    setNewEpisodes((prev) => [...prev, ep]);
    setEpisodeDraft({
      title: "",
      coverUrl: "",
      link: "",
      duration: "",
      episodeNumber: ep.episodeNumber + 1,
      seasonNumber: ep.seasonNumber,
    });
  };

  const createSong = async () => {
    if (!newSong.title.trim()) return alert("Song title is required.");
    if (!newSong.audioUrl.trim()) return alert("Song audio URL is required.");
    setCreatingSong(true);
    try {
      await addDoc(collection(db, "songs"), {
        title: newSong.title.trim(),
        artist: newSong.artist.trim(),
        album: newSong.album.trim(),
        description: newSong.description.trim(),
        coverUrl: newSong.coverUrl.trim(),
        audioUrl: newSong.audioUrl.trim(),
        mediaUrl: newSong.audioUrl.trim(),
        ownerId: newSong.ownerId.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewSong({
        title: "",
        artist: "",
        album: "",
        description: "",
        coverUrl: "",
        audioUrl: "",
        ownerId: "",
      });
      await fetchCounts();
      await loadManageItems("songs");
      alert("Song created.");
    } catch (e) {
      console.error(e);
      alert("Failed to create song.");
    } finally {
      setCreatingSong(false);
    }
  };

  const createVideoItem = async () => {
    if (!newVideoItem.title.trim()) return alert("Video title is required.");
    if (!newVideoItem.link.trim()) return alert("Video link is required.");
    if (newVideoItem.type === "series" && newEpisodes.length === 0) {
      return alert("Add at least one episode for series.");
    }
    setCreatingVideoItem(true);
    try {
      await addDoc(collection(db, "videos"), {
        title: newVideoItem.title.trim(),
        channelName: newVideoItem.channelName.trim(),
        artistId: newVideoItem.artistId.trim(),
        coverUrl: newVideoItem.coverUrl.trim(),
        link: newVideoItem.link.trim(),
        mediaUrl: newVideoItem.link.trim(),
        videoUrl: newVideoItem.link.trim(),
        isPremium: Boolean(newVideoItem.isPremium),
        type: newVideoItem.type,
        description: newVideoItem.description.trim(),
        duration: newVideoItem.duration.trim(),
        uploadTime: newVideoItem.uploadTime.trim(),
        captionsUrl: newVideoItem.captionsUrl.trim(),
        episodes: newVideoItem.type === "series" ? newEpisodes : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewVideoItem({
        title: "",
        channelName: "",
        artistId: "",
        coverUrl: "",
        link: "",
        isPremium: false,
        type: "movie",
        description: "",
        duration: "",
        uploadTime: "",
        captionsUrl: "",
      });
      setNewEpisodes([]);
      setEpisodeDraft({
        title: "",
        coverUrl: "",
        link: "",
        duration: "",
        episodeNumber: 1,
        seasonNumber: 1,
      });
      await fetchCounts();
      await loadManageItems("videos");
      alert("Video item created.");
    } catch (e) {
      console.error(e);
      alert("Failed to create video item.");
    } finally {
      setCreatingVideoItem(false);
    }
  };

  const addEpisodeToSelectedSeries = async () => {
    if (manageKey !== "videos" || !selectedItem?.id) return;
    if (String(selectedItem?.type || "") !== "series") return;
    if (!manageEpisodeDraft.title.trim()) return alert("Episode title is required.");
    if (!manageEpisodeDraft.link.trim()) return alert("Episode link is required.");
    const nextEpisode = {
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: manageEpisodeDraft.title.trim(),
      coverUrl: manageEpisodeDraft.coverUrl.trim(),
      link: manageEpisodeDraft.link.trim(),
      duration: manageEpisodeDraft.duration.trim(),
      episodeNumber: Number(manageEpisodeDraft.episodeNumber || 1),
      seasonNumber: Number(manageEpisodeDraft.seasonNumber || 1),
      createdAt: Date.now(),
    };
    const existing = Array.isArray(selectedItem.episodes) ? selectedItem.episodes : [];
    const episodes = [...existing, nextEpisode];
    try {
      await updateDoc(doc(db, "videos", selectedItem.id), {
        episodes,
        updatedAt: serverTimestamp(),
      });
      setSelectedItem((prev: any) => ({ ...prev, episodes }));
      setEditDraft((prev: any) => ({ ...prev, episodes }));
      setManageEpisodeDraft({
        title: "",
        coverUrl: "",
        link: "",
        duration: "",
        episodeNumber: nextEpisode.episodeNumber + 1,
        seasonNumber: nextEpisode.seasonNumber,
      });
      await loadManageItems("videos");
      alert("Episode added.");
    } catch (e) {
      console.error(e);
      alert("Failed to add episode.");
    }
  };

  const loadJeunesseAdminData = async (yearArg?: string) => {
    const year = String(yearArg || jeunesseYear || new Date().getFullYear());
    setJeunesseLoading(true);
    try {
      const settingsRef = doc(db, "jeunesse_settings", "global");
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};
      setJeunesseSettings(settings || {});

      const y = (settings?.years || {})[year] || {};
      const periods = y?.periods || {};
      setPeriodDraft({
        prelimStart: periods?.prelim?.start || "",
        prelimEnd: periods?.prelim?.end || "",
        preselectionStart: periods?.preselection?.start || "",
        preselectionEnd: periods?.preselection?.end || "",
        selectionStart: periods?.selection?.start || "",
        selectionEnd: periods?.selection?.end || "",
        finalStart: periods?.final?.start || "",
        finalEnd: periods?.final?.end || "",
      });

      let childrenSnap;
      try {
        childrenSnap = await getDocs(query(collection(db, "jeunesse_children"), orderBy("createdAt", "desc"), limit(400)));
      } catch {
        childrenSnap = await getDocs(query(collection(db, "jeunesse_children"), limit(400)));
      }
      setJeunesseChildren(childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      let resultSnap;
      try {
        resultSnap = await getDocs(query(collection(db, "jeunesse_results"), orderBy("createdAt", "desc"), limit(400)));
      } catch {
        resultSnap = await getDocs(query(collection(db, "jeunesse_results"), limit(400)));
      }
      const results = resultSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setJeunesseResults(results.filter((r: any) => String(r?.year || "") === year || !r?.year));
    } catch (e) {
      console.error(e);
      alert("Failed to load Jeunesse data.");
    } finally {
      setJeunesseLoading(false);
    }
  };

  const openJeunesseAdmin = async () => {
    setModalOpen("JEUNESSE_ADMIN");
    await loadJeunesseAdminData(jeunesseYear);
  };

  const saveJeunessePeriods = async () => {
    try {
      const year = String(jeunesseYear || new Date().getFullYear());
      const ref = doc(db, "jeunesse_settings", "global");
      const existingYears = jeunesseSettings?.years || {};
      const currentYear = existingYears[year] || {};
      const currentConcours =
        currentYear?.concours ||
        {
          prelim: { candidates: [], passed: {} },
          preselection: { candidates: [], passed: {} },
          selection: { candidates: [], passed: {} },
          final: { candidates: [], passed: {} },
        };

      const next = {
        ...jeunesseSettings,
        years: {
          ...existingYears,
          [year]: {
            ...currentYear,
            periods: {
              prelim: { start: periodDraft.prelimStart.trim(), end: periodDraft.prelimEnd.trim() },
              preselection: { start: periodDraft.preselectionStart.trim(), end: periodDraft.preselectionEnd.trim() },
              selection: { start: periodDraft.selectionStart.trim(), end: periodDraft.selectionEnd.trim() },
              final: { start: periodDraft.finalStart.trim(), end: periodDraft.finalEnd.trim() },
            },
            concours: currentConcours,
          },
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, next, { merge: true });
      alert("Jeunesse exam dates saved.");
      await loadJeunesseAdminData(year);
    } catch (e) {
      console.error(e);
      alert("Failed to save Jeunesse settings.");
    }
  };

  const saveJeunesseResult = async () => {
    const identifier = resultDraft.identifier.trim();
    const phase = String(resultDraft.phase || "prelim");
    if (!identifier) return alert("Identifier is required.");
    const year = String(jeunesseYear || new Date().getFullYear());
    const docId = `${year}_${identifier}_${phase}`;

    const child = jeunesseChildren.find((c: any) => String(c.identifier || "").trim() === identifier);
    const averageNum = Number(resultDraft.average);

    try {
      await setDoc(
        doc(db, "jeunesse_results", docId),
        {
          identifier,
          year,
          phase,
          passed: String(resultDraft.status).toLowerCase() === "passed",
          status: resultDraft.status,
          average: Number.isFinite(averageNum) ? averageNum : null,
          notes: resultDraft.notes.trim(),
          childId: child?.id || "",
          firstName: child?.firstName || "",
          lastName: child?.lastName || "",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      setResultDraft({ identifier: "", phase: "prelim", status: "passed", average: "", notes: "" });
      await loadJeunesseAdminData(year);
      alert("Jeunesse result saved.");
    } catch (e) {
      console.error(e);
      alert("Failed to save result.");
    }
  };

  // Simple admin actions for some collections
  const quickActions = useMemo(() => {
    if (!manageKey) return [];
    if (manageKey === "joinRequests") {
      return [
        {
          label: "Approve",
          className: "bg-emerald-600 hover:bg-emerald-700 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "joinRequests", selectedItem.id), {
              status: "approved",
              updatedAt: serverTimestamp(),
            });
            alert("Approved.");
            await loadManageItems("joinRequests");
          },
        },
        {
          label: "Reject",
          className: "bg-rose-600 hover:bg-rose-700 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "joinRequests", selectedItem.id), {
              status: "rejected",
              updatedAt: serverTimestamp(),
            });
            alert("Rejected.");
            await loadManageItems("joinRequests");
          },
        },
      ];
    }

    if (manageKey === "platformRequests") {
      return [
        {
          label: "Mark Processing",
          className: "bg-slate-900 hover:bg-slate-800 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "platformRequests", selectedItem.id), {
              status: "processing",
              updatedAt: serverTimestamp(),
            });
            alert("Updated.");
            await loadManageItems("platformRequests");
          },
        },
        {
          label: "Mark Done",
          className: "bg-emerald-600 hover:bg-emerald-700 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "platformRequests", selectedItem.id), {
              status: "done",
              updatedAt: serverTimestamp(),
            });
            alert("Updated.");
            await loadManageItems("platformRequests");
          },
        },
      ];
    }

    if (manageKey === "user_data") {
      return [
        {
          label: "Restrict / Unrestrict",
          className: "bg-slate-900 hover:bg-slate-800 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "user_data", selectedItem.id), {
              restricted: !selectedItem.restricted,
              updatedAt: serverTimestamp(),
            });
            alert("Updated.");
            await loadManageItems("user_data");
          },
        },
      ];
    }

    if (manageKey === "channels") {
      return [
        {
          label: "Set Featured",
          className: "bg-teal-600 hover:bg-teal-700 text-white",
          run: async () => {
            if (!selectedItem?.id) return;
            await updateDoc(doc(db, "channels", selectedItem.id), {
              featured: true,
              updatedAt: serverTimestamp(),
            });
            alert("Channel set as featured.");
            await loadManageItems("channels");
          },
        },
      ];
    }

    return [];
  }, [manageKey, selectedItem]);

  // ---------- UI helpers ----------
  const stats = useMemo(
    () => [
      { key: "user_data" as ManageKey, label: "Users", value: counts.users, icon: "👤" },
      { key: "chatrooms" as ManageKey, label: "Chatrooms", value: counts.chatrooms, icon: "💬" },
      { key: "posts" as ManageKey, label: "Posts", value: counts.posts, icon: "📝" },
      { key: "documents" as ManageKey, label: "Documents", value: counts.documents, icon: "📄" },
      { key: "joinRequests" as ManageKey, label: "Join Requests", value: counts.pendingRequests, icon: "⏳" },
      { key: "platformRequests" as ManageKey, label: "Platform Requests", value: counts.platformRequests, icon: "🧾" },
      { key: "cantiques" as ManageKey, label: "Cantiques", value: counts.cantiques, icon: "🎶" },
      { key: "channels" as ManageKey, label: "TV Channels", value: counts.tvChannels, icon: "📺" },
      { key: "songs" as ManageKey, label: "Songs", value: counts.filmsAndSongs, icon: "🎧" },
      { key: "videos" as ManageKey, label: "Videos", value: counts.videos, icon: "🎬" },
    ],
    [counts]
  );

  const manageRouteMap: Partial<Record<ManageKey, string>> = {
    platformRequests: "/admin/functions",
    cantiques: "/admin/cantiques",
    posts: "/admin/posts",
    documents: "/admin/documents",
    chatrooms: "/admin/chatrooms",
  };

  return (
    <div className="space-y-6">
      {/* ---------- header ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black">Admin Dashboard</div>
            <div className="mt-2 text-slate-600">
              Stats + management modals for all Firestore collections.
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-extrabold text-slate-700">
                Packages: {counts.subscriptionPackages}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-extrabold text-emerald-800">
                Active subs: {counts.activeUserSubscriptions}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-500">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchCounts}
              className="rounded-2xl bg-slate-900 px-4 py-2 font-extrabold text-white hover:bg-slate-800"
            >
              {refreshing ? "Refreshing…" : "Refresh Stats"}
            </button>

            <button
              onClick={() => {
                setPName("");
                setPPrice("");
                setPDays("30");
                setModalOpen("CREATE_PACKAGE");
              }}
              className="rounded-2xl bg-teal-600 px-4 py-2 font-extrabold text-white hover:bg-teal-700"
            >
              + New Package
            </button>
          </div>
        </div>
      </div>

      {/* ---------- revenue intelligence ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">Revenue Intelligence</div>
            <div className="mt-1 text-sm text-slate-600">
              Payout simulation based on active subscriptions, stream/play volume, and protected company margin.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-600">Period</span>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value={7}>7d</option>
              <option value={30}>30d</option>
              <option value={90}>90d</option>
            </select>
            <span className="ml-2 text-xs font-extrabold text-slate-600">Song threshold</span>
            <input
              type="number"
              min={1}
              value={songMonetizeThreshold}
              onChange={(e) => setSongMonetizeThreshold(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-2xl border border-slate-200 px-2 py-2 text-sm font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
            />
            <span className="text-xs font-extrabold text-slate-600">Video threshold</span>
            <input
              type="number"
              min={1}
              value={videoMonetizeThreshold}
              onChange={(e) => setVideoMonetizeThreshold(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-2xl border border-slate-200 px-2 py-2 text-sm font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Recognized Revenue" value={formatMoney(revenueModel.recognizedRevenue)} />
          <MiniStat label="Company Share" value={formatMoney(revenueModel.companyShare)} />
          <MiniStat label="Creator Pool" value={formatMoney(revenueModel.creatorPool)} />
          <MiniStat label="Active Subs" value={String(revenueModel.activeSubscriptions)} />
          <MiniStat label="Monetized Songs" value={`${revenueModel.monetizedSongCount}/${revenueModel.eligibleSongCount}`} />
          <MiniStat label="Monetized Videos" value={`${revenueModel.monetizedVideoCount}/${revenueModel.eligibleVideoCount}`} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">Top Artist Payouts</div>
              <div className="text-xs font-bold text-slate-500">Pool: {formatMoney(revenueModel.songPool)}</div>
            </div>
            <div className="mt-3 space-y-2">
              {revenueModel.artistPayouts.slice(0, 6).map((p) => (
                <div key={p.creatorId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">{p.creatorName || p.creatorId}</div>
                    <div className="text-xs text-slate-600">{Math.round(p.plays)} plays</div>
                  </div>
                  <div className="font-black text-teal-700">{formatMoney(p.amount)}</div>
                </div>
              ))}
              {revenueModel.artistPayouts.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No song play data in this period.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">Top Filmmaker Payouts</div>
              <div className="text-xs font-bold text-slate-500">Pool: {formatMoney(revenueModel.videoPool)}</div>
            </div>
            <div className="mt-3 space-y-2">
              {revenueModel.filmmakerPayouts.slice(0, 6).map((p) => (
                <div key={p.creatorId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">{p.creatorName || p.creatorId}</div>
                    <div className="text-xs text-slate-600">{Math.round(p.plays)} plays</div>
                  </div>
                  <div className="font-black text-indigo-700">{formatMoney(p.amount)}</div>
                </div>
              ))}
              {revenueModel.filmmakerPayouts.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No video play data in this period.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">Monetized Songs (Per Content)</div>
              <div className="text-xs font-bold text-slate-500">Threshold: {revenueModel.monetizationThresholds.song} plays</div>
            </div>
            <div className="mt-3 space-y-2">
              {revenueModel.songContentPayouts.slice(0, 8).map((c: any) => (
                <div key={c.contentId} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-600">{c.creatorName || c.creatorId} • {Math.round(c.plays)} plays</div>
                    </div>
                    <div className="text-sm font-black text-emerald-700">{formatMoney(c.amount)}</div>
                  </div>
                </div>
              ))}
              {revenueModel.songContentPayouts.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  No song crossed monetization threshold in this period.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">Monetized Videos (Per Content)</div>
              <div className="text-xs font-bold text-slate-500">Threshold: {revenueModel.monetizationThresholds.video} plays</div>
            </div>
            <div className="mt-3 space-y-2">
              {revenueModel.videoContentPayouts.slice(0, 8).map((c: any) => (
                <div key={c.contentId} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-600">{c.creatorName || c.creatorId} • {Math.round(c.plays)} plays</div>
                    </div>
                    <div className="text-sm font-black text-indigo-700">{formatMoney(c.amount)}</div>
                  </div>
                </div>
              ))}
              {revenueModel.videoContentPayouts.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  No video crossed monetization threshold in this period.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-700">
          Policy: fee {Math.round(revenueModel.policy.paymentInfraFeePct * 100)}% + operations reserve {Math.round(revenueModel.policy.operationsReservePct * 100)}%.
          Creator pool target {Math.round(revenueModel.policy.targetCreatorPoolPct * 100)}%, with guaranteed company minimum profit floor {Math.round(revenueModel.policy.minCompanyProfitPct * 100)}%.
        </div>
      </div>      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">Songs And Movies</div>
            <div className="mt-1 text-sm text-slate-600">Create songs, movies, series and episodes from modal workflow.</div>
          </div>
          <button
            onClick={() => setModalOpen("CREATE_MEDIA")}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Open Create Modal
          </button>
        </div>
      </div>

      {/* ---------- stats grid + manage buttons ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">Manage Collections</div>
          <div className="text-sm font-bold text-slate-500">
            {loadingCounts ? "Loading…" : "Click Manage to edit via modal"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.key} className="rounded-3xl border border-slate-200 p-5 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{s.icon}</div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                  {COLLECTION_META[s.key]?.label}
                </div>
              </div>

              <div className="mt-3 text-sm font-extrabold text-slate-600">{s.label}</div>
              <div className="mt-1 text-3xl font-black text-slate-900">
                {loadingCounts ? "—" : s.value}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openManage(s.key)}
                  className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                >
                  Manage
                </button>
                <button
                  onClick={() => {
                    if (s.key === "joinRequests" || s.key === "channels") {
                      nav("/admin/channel-requests");
                      return;
                    }
                    const to = manageRouteMap[s.key];
                    if (to) nav(to);
                    else openManage(s.key);
                  }}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200"
                >
                  Open Page
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Inside each modal: list (latest {PAGE_SIZE}), open item, edit fields, save, delete.
          For Join Requests / Platform Requests / Users / Channels you also get quick action buttons.
        </div>
      </div>

      {/* ---------- channel requests (your existing section) ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">Channel Requests</div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
            Pending: {pending.length}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black">{r.displayName}</div>
                  <div className="text-sm text-slate-600">/{r.channelName}/live • {r.category || "—"}</div>
                  <div className="mt-1 text-sm text-slate-600">{r.description || "—"}</div>
                </div>
                <Pill status={r.status} />
              </div>

              {r.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(r)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 font-extrabold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(r)}
                    className="rounded-2xl bg-rose-600 px-4 py-2 font-extrabold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              No requests yet.
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- subscription packages ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">Subscription Packages</div>

          <button
            onClick={() => {
              setPName("");
              setPPrice("");
              setPDays("30");
              setModalOpen("CREATE_PACKAGE");
            }}
            className="rounded-2xl bg-teal-600 px-4 py-2 font-extrabold text-white hover:bg-teal-700"
          >
            + Create
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.id} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black">{p.name}</div>
                  <div className="mt-1 text-2xl font-black">{Number(p.price || 0).toLocaleString()} FCFA</div>
                  <div className="mt-1 text-sm text-slate-600">{p.durationDays} days</div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openEditPackage(p)}
                    className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePackage(p)}
                    className={`rounded-2xl px-3 py-2 text-sm font-extrabold ${
                      p.isActive
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                    }`}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm font-extrabold text-slate-700">Status</div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {p.isActive ? "ACTIVE" : "INACTIVE"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {packages.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            No packages yet.
          </div>
        ) : null}
      </div>      {/* ---------- user subscriptions ---------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">User Subscriptions</div>
            <div className="mt-1 text-sm text-slate-600">View all user subscriptions in modal panel.</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
              Active: {userSubscriptions.filter((s) => s.status === "active").length}
            </div>
            <button
              onClick={() => setModalOpen("USER_SUBSCRIPTIONS")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Open Subscriptions
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">Jeunesse (Amis de Jesus)</div>
            <div className="mt-1 text-sm text-slate-600">Manage online registrations, exam dates and results.</div>
          </div>
          <button
            onClick={openJeunesseAdmin}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Open Jeunesse Admin
          </button>
        </div>
      </div>

      {/* ---------- MODAL: create/edit package ---------- */}
      <Modal
        open={modalOpen === "CREATE_PACKAGE" || modalOpen === "EDIT_PACKAGE"}
        onClose={() => {
          setModalOpen(null);
          setActivePkg(null);
        }}
        title={modalOpen === "EDIT_PACKAGE" ? "Edit Package" : "Create Package"}
        subtitle="Manage subscription offers (name, price, duration)."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Name">
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Starter"
            />
          </Field>

          <Field label="Price">
            <input
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="5000 FCFA"
            />
          </Field>

          <Field label="Duration (days)">
            <input
              value={pDays}
              onChange={(e) => setPDays(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="30"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            onClick={() => setModalOpen(null)}
            className="rounded-2xl bg-slate-100 px-5 py-3 font-extrabold text-slate-800 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={modalOpen === "EDIT_PACKAGE" ? saveEditPackage : createPackage}
            className="rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700"
          >
            {modalOpen === "EDIT_PACKAGE" ? "Save Changes" : "Create Package"}
          </button>
        </div>
      </Modal>

      <Modal
        open={modalOpen === "CREATE_MEDIA"}
        onClose={() => setModalOpen(null)}
        title="Create Songs And Movies"
        subtitle="Add songs, movies, series and episodes."
        wide
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-black text-slate-900">New Song</div>
            <div className="mt-3 grid gap-3">
              <input value={newSong.title} onChange={(e) => setNewSong((v) => ({ ...v, title: e.target.value }))} placeholder="Title" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newSong.artist} onChange={(e) => setNewSong((v) => ({ ...v, artist: e.target.value }))} placeholder="Artist" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newSong.album} onChange={(e) => setNewSong((v) => ({ ...v, album: e.target.value }))} placeholder="Album" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newSong.ownerId} onChange={(e) => setNewSong((v) => ({ ...v, ownerId: e.target.value }))} placeholder="Owner ID (optional)" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <textarea value={newSong.description} onChange={(e) => setNewSong((v) => ({ ...v, description: e.target.value }))} placeholder="Description" className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newSong.audioUrl} onChange={(e) => setNewSong((v) => ({ ...v, audioUrl: e.target.value }))} placeholder="Audio URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"><span>{uploadingSongAudio ? "Uploading..." : "Upload Song Audio"}</span><input type="file" accept="audio/*" className="hidden" disabled={uploadingSongAudio} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingSongAudio(true); try { const url = await uploadAsset(file, "song"); setNewSong((v) => ({ ...v, audioUrl: url })); } catch (err: any) { alert(err?.message || "Upload failed."); } finally { setUploadingSongAudio(false); e.currentTarget.value = ""; } }} /></label>
              <input value={newSong.coverUrl} onChange={(e) => setNewSong((v) => ({ ...v, coverUrl: e.target.value }))} placeholder="Cover URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"><span>{uploadingSongCover ? "Uploading..." : "Upload Cover"}</span><input type="file" accept="image/*" className="hidden" disabled={uploadingSongCover} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingSongCover(true); try { const url = await uploadAsset(file, "song"); setNewSong((v) => ({ ...v, coverUrl: url })); } catch (err: any) { alert(err?.message || "Upload failed."); } finally { setUploadingSongCover(false); e.currentTarget.value = ""; } }} /></label>
              <button onClick={createSong} disabled={creatingSong} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">{creatingSong ? "Creating..." : "Create Song"}</button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-black text-slate-900">New Video Item</div>
            <div className="mt-3 grid gap-3">
              <input value={newVideoItem.title} onChange={(e) => setNewVideoItem((v) => ({ ...v, title: e.target.value }))} placeholder="Title" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newVideoItem.type} onChange={(e) => setNewVideoItem((v) => ({ ...v, type: e.target.value as "movie" | "series" | "musicVideo" }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"><option value="movie">movie</option><option value="series">series</option><option value="musicVideo">musicVideo</option></select>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={newVideoItem.isPremium} onChange={(e) => setNewVideoItem((v) => ({ ...v, isPremium: e.target.checked }))} />Premium</label>
              </div>
              <input value={newVideoItem.channelName} onChange={(e) => setNewVideoItem((v) => ({ ...v, channelName: e.target.value }))} placeholder="Channel Name" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newVideoItem.artistId} onChange={(e) => setNewVideoItem((v) => ({ ...v, artistId: e.target.value }))} placeholder="Artist ID / Creator ID" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <textarea value={newVideoItem.description} onChange={(e) => setNewVideoItem((v) => ({ ...v, description: e.target.value }))} placeholder="Description" className="min-h-[90px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <input value={newVideoItem.link} onChange={(e) => setNewVideoItem((v) => ({ ...v, link: e.target.value }))} placeholder="Video link" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"><span>{uploadingVideoLink ? "Uploading..." : "Upload Video File"}</span><input type="file" className="hidden" disabled={uploadingVideoLink} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingVideoLink(true); try { const url = await uploadAsset(file, "vfilm"); setNewVideoItem((v) => ({ ...v, link: url })); } catch (err: any) { alert(err?.message || "Upload failed."); } finally { setUploadingVideoLink(false); e.currentTarget.value = ""; } }} /></label>
              <input value={newVideoItem.coverUrl} onChange={(e) => setNewVideoItem((v) => ({ ...v, coverUrl: e.target.value }))} placeholder="Cover URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"><span>{uploadingVideoCover ? "Uploading..." : "Upload Cover"}</span><input type="file" accept="image/*" className="hidden" disabled={uploadingVideoCover} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingVideoCover(true); try { const url = await uploadAsset(file, "vfilm"); setNewVideoItem((v) => ({ ...v, coverUrl: url })); } catch (err: any) { alert(err?.message || "Upload failed."); } finally { setUploadingVideoCover(false); e.currentTarget.value = ""; } }} /></label>
              {newVideoItem.type === "series" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-600">Series Episodes</div>
                  <div className="mt-2 grid gap-2">
                    <input value={episodeDraft.title} onChange={(e) => setEpisodeDraft((v) => ({ ...v, title: e.target.value }))} placeholder="Episode title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
                    <input value={episodeDraft.link} onChange={(e) => setEpisodeDraft((v) => ({ ...v, link: e.target.value }))} placeholder="Episode link" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
                    <button type="button" onClick={addEpisodeDraft} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800">Add Episode</button>
                    <div className="space-y-2">{newEpisodes.map((ep, idx) => <div key={ep.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><div className="truncate font-bold text-slate-800">S{ep.seasonNumber}E{ep.episodeNumber} • {ep.title}</div><button type="button" onClick={() => setNewEpisodes((prev) => prev.filter((_, i) => i !== idx))} className="rounded-lg bg-rose-100 px-2 py-1 font-extrabold text-rose-700 hover:bg-rose-200">Remove</button></div>)}</div>
                  </div>
                </div>
              ) : null}
              <button onClick={createVideoItem} disabled={creatingVideoItem} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">{creatingVideoItem ? "Creating..." : "Create Video Item"}</button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalOpen === "USER_SUBSCRIPTIONS"}
        onClose={() => setModalOpen(null)}
        title="User Subscriptions"
        subtitle="Active and historical subscription records."
        wide
      >
        <div className="space-y-3">
          {userSubscriptions.slice(0, 200).map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black">{s.packageName || "Package"}</div>
                  <div className="text-sm text-slate-600">UID: {s.uid || "—"}</div>
                </div>
                <Pill status={s.status || "unknown"} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold">Price:</span> {Number(s.price || 0).toLocaleString()} FCFA</div>
                <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold">Start:</span> {formatEpoch(s.startAt)}</div>
                <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold">End:</span> {formatEpoch(s.endAt)}</div>
              </div>
            </div>
          ))}
          {userSubscriptions.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">No user subscriptions yet.</div> : null}
        </div>
      </Modal>

      <Modal
        open={modalOpen === "JEUNESSE_ADMIN"}
        onClose={() => setModalOpen(null)}
        title="Jeunesse Admin (Amis de Jesus)"
        subtitle="Manage registrations, exam dates and results."
        wide
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setJeunesseTab("children")} className={`rounded-xl px-3 py-2 text-sm font-extrabold ${jeunesseTab === "children" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>Children</button>
              <button onClick={() => setJeunesseTab("results")} className={`rounded-xl px-3 py-2 text-sm font-extrabold ${jeunesseTab === "results" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>Results</button>
              <button onClick={() => setJeunesseTab("settings")} className={`rounded-xl px-3 py-2 text-sm font-extrabold ${jeunesseTab === "settings" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>Exam Dates</button>
            </div>
            <div className="flex items-center gap-2">
              <input value={jeunesseYear} onChange={(e) => setJeunesseYear(e.target.value)} className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <button onClick={() => loadJeunesseAdminData(jeunesseYear)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white">Reload</button>
            </div>
          </div>

          {jeunesseLoading ? <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Loading...</div> : null}

          {jeunesseTab === "children" ? (
            <div>
              <input value={jeunesseSearch} onChange={(e) => setJeunesseSearch(e.target.value)} placeholder="Search by name, identifier, parish, city" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
              <div className="mt-3 space-y-2">
                {jeunesseChildren
                  .filter((c: any) => {
                    const q = jeunesseSearch.trim().toLowerCase();
                    if (!q) return true;
                    const blob = `${c.firstName || ""} ${c.lastName || ""} ${c.identifier || ""} ${c.parishName || ""} ${c.city || ""}`.toLowerCase();
                    return blob.includes(q);
                  })
                  .slice(0, 200)
                  .map((c: any) => (
                    <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                      <div className="font-black text-slate-900">{`${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed"}</div>
                      <div className="text-xs font-semibold text-slate-600">ID: {c.identifier || "—"} • {c.parishName || "—"} • {c.city || "—"}</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {jeunesseTab === "results" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-sm font-black">Set Result</div>
                <div className="mt-2 grid gap-2">
                  <input value={resultDraft.identifier} onChange={(e) => setResultDraft((v) => ({ ...v, identifier: e.target.value }))} placeholder="Child identifier" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={resultDraft.phase} onChange={(e) => setResultDraft((v) => ({ ...v, phase: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"><option value="prelim">prelim</option><option value="preselection">preselection</option><option value="selection">selection</option><option value="final">final</option></select>
                    <select value={resultDraft.status} onChange={(e) => setResultDraft((v) => ({ ...v, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"><option value="passed">passed</option><option value="failed">failed</option></select>
                  </div>
                  <input value={resultDraft.average} onChange={(e) => setResultDraft((v) => ({ ...v, average: e.target.value }))} placeholder="Average mark" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
                  <textarea value={resultDraft.notes} onChange={(e) => setResultDraft((v) => ({ ...v, notes: e.target.value }))} placeholder="Notes" className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
                  <button onClick={saveJeunesseResult} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800">Save Result</button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-sm font-black">Results ({jeunesseResults.length})</div>
                <div className="mt-2 space-y-2">
                  {jeunesseResults.slice(0, 150).map((r: any) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="text-sm font-black text-slate-900">{r.identifier || "—"} • {r.phase || "—"}</div>
                      <div className="text-xs font-semibold text-slate-600">{r.status || (r.passed ? "passed" : "failed")} • avg: {r.average ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {jeunesseTab === "settings" ? (
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="text-sm font-black">Exam Dates ({jeunesseYear})</div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input value={periodDraft.prelimStart} onChange={(e) => setPeriodDraft((v) => ({ ...v, prelimStart: e.target.value }))} placeholder="prelim start" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.prelimEnd} onChange={(e) => setPeriodDraft((v) => ({ ...v, prelimEnd: e.target.value }))} placeholder="prelim end" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.preselectionStart} onChange={(e) => setPeriodDraft((v) => ({ ...v, preselectionStart: e.target.value }))} placeholder="preselection start" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.preselectionEnd} onChange={(e) => setPeriodDraft((v) => ({ ...v, preselectionEnd: e.target.value }))} placeholder="preselection end" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.selectionStart} onChange={(e) => setPeriodDraft((v) => ({ ...v, selectionStart: e.target.value }))} placeholder="selection start" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.selectionEnd} onChange={(e) => setPeriodDraft((v) => ({ ...v, selectionEnd: e.target.value }))} placeholder="selection end" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.finalStart} onChange={(e) => setPeriodDraft((v) => ({ ...v, finalStart: e.target.value }))} placeholder="final start" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <input value={periodDraft.finalEnd} onChange={(e) => setPeriodDraft((v) => ({ ...v, finalEnd: e.target.value }))} placeholder="final end" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
              </div>
              <button onClick={saveJeunessePeriods} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800">Save Exam Dates</button>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* ---------- MODAL: Manage Collection ---------- */}
      <Modal
        open={modalOpen === "MANAGE_COLLECTION"}
        onClose={() => {
          setModalOpen(null);
          setManageKey(null);
          setSelectedItem(null);
          setManageItems([]);
          setManageMobileTab("list");
        }}
        title={manageKey ? `${COLLECTION_META[manageKey].icon} Manage ${COLLECTION_META[manageKey].label}` : "Manage"}
        subtitle={`Edit Firestore docs directly. Showing latest ${PAGE_SIZE}.`}
        wide
      >
        {!manageKey ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">No collection selected.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:hidden">
              <button
                onClick={() => setManageMobileTab("list")}
                className={`rounded-2xl px-3 py-2 text-sm font-extrabold ${
                  manageMobileTab === "list" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                Items
              </button>
              <button
                onClick={() => setManageMobileTab("editor")}
                className={`rounded-2xl px-3 py-2 text-sm font-extrabold ${
                  manageMobileTab === "editor" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                Editor
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            {/* Left: list */}
            <div className={`rounded-3xl border border-slate-200 bg-white p-4 ${manageMobileTab === "editor" ? "hidden md:block" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">Items</div>
                <button
                  onClick={() => loadManageItems(manageKey)}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200"
                >
                  Refresh
                </button>
              </div>

              {manageLoading ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                  Loading…
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {manageItems.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => openItem(it)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left ${
                        selectedItem?.id === it.id
                          ? "border-teal-200 bg-teal-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900">
                            {pickField(it, COLLECTION_META[manageKey].primary) || it.id}
                          </div>
                          <div className="mt-1 truncate text-xs font-bold text-slate-600">
                            {pickField(it, COLLECTION_META[manageKey].secondary) || "—"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700">
                          {shortId(it.id)}
                        </div>
                      </div>
                    </button>
                  ))}

                  {manageItems.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                      No items found.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Right: editor */}
            <div className={`rounded-3xl border border-slate-200 bg-white p-4 md:p-5 ${manageMobileTab === "list" ? "hidden md:block" : ""}`}>
              {!selectedItem ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-700">
                  Select an item on the left to view/edit.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        {pickField(selectedItem, COLLECTION_META[manageKey].primary) || "Document"}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-600">
                        Doc ID: {selectedItem.id}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((a) => (
                        <button
                          key={a.label}
                          onClick={a.run}
                          className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${a.className}`}
                        >
                          {a.label}
                        </button>
                      ))}

                      <button
                        onClick={deleteItem}
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {manageKey === "videos" && String(selectedItem?.type || "") === "series" ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-600">Add Episode To Series</div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <input
                          value={manageEpisodeDraft.title}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, title: e.target.value }))}
                          placeholder="Episode title"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <input
                          value={manageEpisodeDraft.link}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, link: e.target.value }))}
                          placeholder="Episode link"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <input
                          value={manageEpisodeDraft.coverUrl}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, coverUrl: e.target.value }))}
                          placeholder="Episode cover URL"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <input
                          value={manageEpisodeDraft.duration}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, duration: e.target.value }))}
                          placeholder="Duration"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <input
                          type="number"
                          min={1}
                          value={manageEpisodeDraft.seasonNumber}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, seasonNumber: Math.max(1, Number(e.target.value) || 1) }))}
                          placeholder="Season #"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <input
                          type="number"
                          min={1}
                          value={manageEpisodeDraft.episodeNumber}
                          onChange={(e) => setManageEpisodeDraft((v) => ({ ...v, episodeNumber: Math.max(1, Number(e.target.value) || 1) }))}
                          placeholder="Episode #"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100">
                          <span>{uploadingEpisodeLink ? "Uploading..." : "Upload Episode File"}</span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingEpisodeLink}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingEpisodeLink(true);
                              try {
                                const url = await uploadAsset(file, "vfilm");
                                setManageEpisodeDraft((v) => ({ ...v, link: url }));
                              } catch (err: any) {
                                console.error(err);
                                alert(err?.message || "Upload failed.");
                              } finally {
                                setUploadingEpisodeLink(false);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100">
                          <span>{uploadingEpisodeCover ? "Uploading..." : "Upload Episode Cover"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingEpisodeCover}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingEpisodeCover(true);
                              try {
                                const url = await uploadAsset(file, "vfilm");
                                setManageEpisodeDraft((v) => ({ ...v, coverUrl: url }));
                              } catch (err: any) {
                                console.error(err);
                                alert(err?.message || "Upload failed.");
                              } finally {
                                setUploadingEpisodeCover(false);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={addEpisodeToSelectedSeries}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                        >
                          Add Episode
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Toggle edit mode */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                    <div className="text-sm font-extrabold text-slate-700">
                      Edit Mode:{" "}
                      <span className="font-black">{editJsonMode ? "JSON" : "Form"}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditJsonMode(false);
                          setEditDraft(selectedItem);
                        }}
                        className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${
                          !editJsonMode ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                        }`}
                      >
                        Form
                      </button>
                      <button
                        onClick={() => {
                          setEditJsonMode(true);
                          setEditJsonText(JSON.stringify(selectedItem, null, 2));
                        }}
                        className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${
                          editJsonMode ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="mt-4">
                    {editJsonMode ? (
                      <textarea
                        value={editJsonText}
                        onChange={(e) => setEditJsonText(e.target.value)}
                        className="h-[55vh] min-h-[260px] w-full rounded-3xl border border-slate-200 bg-white p-4 font-mono text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200 md:h-[360px]"
                      />
                    ) : (
                      <KeyValueEditor
                        value={editDraft}
                        onChange={setEditDraft}
                        lockedKeys={["id"]}
                        collectionKey={manageKey}
                      />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => openItem(selectedItem)}
                      className="rounded-2xl bg-slate-100 px-5 py-3 font-extrabold text-slate-800 hover:bg-slate-200"
                    >
                      Reset
                    </button>
                    <button
                      onClick={saveItem}
                      className="rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700"
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ----------------- UI PARTS ----------------- */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-base font-black text-slate-900">{value}</div>
    </div>
  );
}

function Pill({ status }: any) {
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

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: any;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 p-2 md:items-center md:p-4">
      <div className={`h-[92vh] w-full ${wide ? "max-w-6xl" : "max-w-3xl"} rounded-2xl bg-white shadow-xl md:h-[85vh] md:rounded-3xl flex flex-col`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 md:p-5">
          <div className="min-w-0">
            <div className="text-base font-black md:text-lg">{title}</div>
            {subtitle ? <div className="mt-1 text-xs font-semibold text-slate-600 md:text-sm">{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200 md:rounded-2xl md:px-4 md:text-sm"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-extrabold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

/**
 * Generic KV editor:
 * - edits only primitive + string values nicely
 * - keeps complex objects/arrays as JSON in a textarea field
 */
function KeyValueEditor({
  value,
  onChange,
  lockedKeys = [],
  collectionKey,
}: {
  value: any;
  onChange: (v: any) => void;
  lockedKeys?: string[];
  collectionKey?: ManageKey | null;
}) {
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const entries = Object.entries(value || {}).filter(([k]) => !lockedKeys.includes(k));

  const setField = (key: string, val: any) => {
    onChange({ ...(value || {}), [key]: val });
  };

  const canUploadField = (field: string) => {
    const k = field.toLowerCase();
    if (collectionKey === "posts") return ["image", "shareimage", "thumbnail", "coverurl"].includes(k);
    if (collectionKey === "songs") return ["coverurl", "image", "mediaurl", "audiourl", "url", "fileurl"].includes(k);
    if (collectionKey === "videos") return ["mediaurl", "videourl", "streamlink", "url", "coverurl", "thumbnail"].includes(k);
    return false;
  };

  const uploadKindFor = (): CdnUploadKind => {
    if (collectionKey === "songs") return "song";
    if (collectionKey === "videos") return "vfilm";
    return "posts";
  };

  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => {
        const isComplex = typeof v === "object" && v !== null;
        return (
          <div key={k} className="rounded-3xl border border-slate-200 p-4">
            <div className="text-xs font-black text-slate-600">{k}</div>

            {isComplex ? (
              <textarea
                value={safeStringify(v)}
                onChange={(e) => {
                  try {
                    setField(k, JSON.parse(e.target.value));
                  } catch {
                    // keep as raw string while typing to avoid blocking
                    setField(k, e.target.value);
                  }
                }}
                className="mt-2 h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              />
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  value={String(v ?? "")}
                  onChange={(e) => setField(k, castSmart(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                />
                {canUploadField(k) ? (
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100">
                    <span>{uploadingField === k ? "Uploading..." : `Upload ${k}`}</span>
                    <input
                      type="file"
                      accept={k.toLowerCase().includes("image") || k.toLowerCase().includes("cover") || k.toLowerCase().includes("thumbnail") ? "image/*" : "*/*"}
                      className="hidden"
                      disabled={uploadingField === k}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingField(k);
                        try {
                          const url = await uploadToCeleoneCdn(file, uploadKindFor());
                          setField(k, url);
                        } catch (err: any) {
                          console.error(err);
                          alert(err?.message || "Upload failed.");
                        } finally {
                          setUploadingField(null);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      {entries.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
          No editable fields found (or only locked keys).
        </div>
      ) : null}
    </div>
  );
}

/* ----------------- helpers ----------------- */

function pickField(obj: any, key?: string) {
  if (!obj || !key) return "";
  const v = obj[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  // Firestore Timestamp?
  if (typeof v?.toDate === "function") return v.toDate().toLocaleString();
  return "";
}

function shortId(id: string) {
  if (!id) return "";
  return id.length <= 8 ? id : `${id.slice(0, 4)}…${id.slice(-3)}`;
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// tries to cast strings into boolean/number/null, else keep string
function castSmart(input: string) {
  const t = input.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (t === "undefined") return undefined;
  // number?
  const n = Number(t);
  if (t !== "" && !Number.isNaN(n) && String(n) === t) return n;
  return input;
}

function formatEpoch(value: any) {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Date(n).toLocaleString();
}


