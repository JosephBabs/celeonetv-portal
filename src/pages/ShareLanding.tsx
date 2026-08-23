/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { openShareInApp, type ShareContentType } from "../lib/deepLinks";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

const TYPE_CONFIG: Record<string, { type: ShareContentType; collection: string; label: string; routeTitle: string }> = {
  social: { type: "social", collection: "posts", label: "Social post", routeTitle: "CeleOne Social" },
  hymns: { type: "hymn", collection: "cantiques", label: "Hymn", routeTitle: "CeleOne Hymns" },
  themes: { type: "theme", collection: "weekly_themes", label: "Theme of the week", routeTitle: "CeleOne Theme of the Week" },
  "weekly-themes": { type: "weekly-theme", collection: "weekly_themes", label: "Theme of the week", routeTitle: "CeleOne Theme of the Week" },
  "weekly-programs": { type: "weekly-program", collection: "weeklyPrograms", label: "Weekly program", routeTitle: "CeleOne Weekly Program" },
  videos: { type: "video", collection: "videos", label: "Video", routeTitle: "CeleOne Video" },
  songs: { type: "song", collection: "songs", label: "Song", routeTitle: "CeleOne Song" },
};

export default function ShareLanding() {
  const { contentId = "" } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shareType = location.pathname.split("/").filter(Boolean)[0] || "";
  const cfg = TYPE_CONFIG[shareType];
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  const appParams = useMemo(
    () => ({
      language: searchParams.get("language") || undefined,
      moduleId: searchParams.get("moduleId") || undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    const run = async () => {
      if (!cfg || !contentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, cfg.collection, contentId));
        setItem(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [cfg, contentId]);

  useEffect(() => {
    const title = shareTitle(item) || cfg?.routeTitle || "CeleOne";
    const description = shareDescription(item) || "Open this CeleOne content in the mobile app.";
    const image = shareImage(item) || "https://celeonetv.com/logo.png";
    setPageMeta({
      title,
      description,
      image,
      url: window.location.href,
      type: cfg?.type === "hymn" || cfg?.type === "theme" ? "article" : "website",
    });
  }, [cfg, item]);

  if (!cfg) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Content type not supported</div>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;

  const title = shareTitle(item) || cfg.routeTitle;
  const description = shareDescription(item);
  const image = shareImage(item);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
        <div className="text-sm font-black uppercase tracking-wide text-teal-700">{cfg.label}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <div className="mt-2 text-sm text-teal-900/80">
          View this content here first, then open it in the CeleOne mobile app if it is installed on your phone.
        </div>
        <button
          onClick={() => openShareInApp(cfg.type, contentId, appParams)}
          className="mt-4 rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
        >
          Open in app
        </button>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        {image ? (
          <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200">
            <img src={image} className="h-auto w-full" alt={title} />
          </div>
        ) : null}

        {!item ? (
          <div className="text-slate-600">This content was not found on the portal.</div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>
            {description ? <p className="mt-3 whitespace-pre-wrap text-slate-700">{description}</p> : null}
            <PreviewDetails item={item} />
          </>
        )}
      </article>
    </div>
  );
}

function PreviewDetails({ item }: { item: any }) {
  const fields = [
    ["Number", item.hymnNumber || item.number],
    ["Language", item.language],
    ["Date", item.date || item.startDate || item.serviceDate],
    ["Theme", textValue(item.theme || item.bibleTheme)],
    ["Bible", textValue(item.bibleReference || item.bibleLesson || item.bibleReadingText)],
  ].filter(([, value]) => Boolean(value));

  if (!fields.length) return null;

  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
          <dd className="mt-1 font-bold text-slate-900">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function shareTitle(item: any) {
  return textValue(item?.shareTitle || item?.title || item?.name || item?.theme || item?.bibleTheme || item?.hymnTitle);
}

function shareDescription(item: any) {
  const value = item?.shareDescription || item?.description || item?.content || item?.hymnContent || item?.bibleLesson || item?.bibleReadingText;
  return stripHtml(textValue(value)).slice(0, 700);
}

function shareImage(item: any) {
  return textValue(item?.shareImage || item?.image || item?.coverUrl || item?.thumbnail || item?.posterUrl);
}

function textValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return textValue(value.fr || value.en || value.default || Object.values(value)[0]);
  return "";
}

function stripHtml(value: string) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
