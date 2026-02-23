/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

type SectionKey = "functions" | "cantiques" | "posts" | "channel-requests" | "chatrooms";

const SECTION_CONFIG: Record<
  SectionKey,
  {
    title: string;
    collection: string;
    primary: string;
    secondary: string;
    orderField?: string;
    description: string;
  }
> = {
  functions: {
    title: "Functions Requests",
    collection: "platformRequests",
    primary: "title",
    secondary: "status",
    orderField: "createdAt",
    description: "Manage platform function requests from users.",
  },
  cantiques: {
    title: "Cantiques",
    collection: "cantiques",
    primary: "title",
    secondary: "author",
    orderField: "createdAt",
    description: "Manage cantiques catalog and metadata.",
  },
  posts: {
    title: "Posts Editor",
    collection: "posts",
    primary: "title",
    secondary: "category",
    orderField: "createdAt",
    description: "Edit posts and social share metadata.",
  },
  "channel-requests": {
    title: "Channel Requests",
    collection: "channel_requests",
    primary: "displayName",
    secondary: "status",
    orderField: "createdAt",
    description: "Review and update creator channel requests.",
  },
  chatrooms: {
    title: "Chatrooms",
    collection: "chatrooms",
    primary: "name",
    secondary: "lastMessage",
    orderField: "updatedAt",
    description: "Manage chatrooms and moderation fields.",
  },
};

function isValidSection(v: string | undefined): v is SectionKey {
  if (!v) return false;
  return v in SECTION_CONFIG;
}

export default function AdminManagePage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const cfg = isValidSection(section) ? SECTION_CONFIG[section] : null;

  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cfg) {
      setPageMeta({
        title: "Admin | Celeone TV",
        description: "Admin management pages",
      });
      return;
    }
    setPageMeta({
      title: `${cfg.title} | Celeone Admin`,
      description: cfg.description,
      type: "website",
    });
  }, [cfg]);

  const load = async () => {
    if (!cfg) return;
    setLoading(true);
    try {
      let snap;
      try {
        if (cfg.orderField) {
          snap = await getDocs(
            query(collection(db, cfg.collection), orderBy(cfg.orderField as any, "desc"), limit(100))
          );
        } else {
          snap = await getDocs(query(collection(db, cfg.collection), limit(100)));
        }
      } catch {
        snap = await getDocs(query(collection(db, cfg.collection), limit(100)));
      }

      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(rows);
      if (selected?.id) {
        const next = rows.find((x) => x.id === selected.id) || null;
        setSelected(next);
        setDraft(next);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelected(null);
    setDraft(null);
    setItems([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.collection]);

  const save = async () => {
    if (!cfg || !selected?.id || !draft) return;
    setSaving(true);
    try {
      const { id, ...payload } = draft;
      payload.updatedAt = serverTimestamp();
      await updateDoc(doc(db, cfg.collection, selected.id), payload);
      await load();
      alert("Saved.");
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!cfg || !selected?.id) return;
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDoc(doc(db, cfg.collection, selected.id));
      setSelected(null);
      setDraft(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
    }
  };

  const approveChannelRequest = async () => {
    if (!cfg || cfg.collection !== "channel_requests" || !selected?.id) return;
    await updateDoc(doc(db, cfg.collection, selected.id), {
      status: "approved",
      updatedAt: serverTimestamp(),
    });
    await load();
  };

  const rejectChannelRequest = async () => {
    if (!cfg || cfg.collection !== "channel_requests" || !selected?.id) return;
    await updateDoc(doc(db, cfg.collection, selected.id), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
    await load();
  };

  const applyPostShareMeta = async () => {
    if (!cfg || cfg.collection !== "posts" || !selected?.id) return;
    const title = String(draft?.title || "Celeone TV");
    const content = String(draft?.content || "");
    const description = content.trim().replace(/\s+/g, " ").slice(0, 180);
    const image = String(draft?.image || "https://celeonetv.com/logo.png");

    setDraft((prev: any) => ({
      ...prev,
      shareTitle: title,
      shareDescription: description,
      shareImage: image,
    }));
  };

  const sortedSections = useMemo(
    () => Object.keys(SECTION_CONFIG) as SectionKey[],
    []
  );

  if (!cfg) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Unknown admin page</div>
        <div className="mt-2 text-slate-600">Select a valid section.</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {sortedSections.map((key) => (
            <Link
              key={key}
              to={`/admin/${key}`}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
            >
              {SECTION_CONFIG[key].title}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black">{cfg.title}</div>
            <div className="mt-1 text-slate-600">{cfg.description}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
            >
              Back to Dashboard
            </button>
            <button
              onClick={load}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-700">Documents</div>
          {loading ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              Loading...
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    setSelected(it);
                    setDraft(it);
                  }}
                  className={`w-full rounded-2xl border p-3 text-left ${
                    selected?.id === it.id
                      ? "border-teal-200 bg-teal-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="truncate text-sm font-black text-slate-900">
                    {String(it[cfg.primary] || it.id)}
                  </div>
                  <div className="mt-1 truncate text-xs font-semibold text-slate-600">
                    {String(it[cfg.secondary] || "")}
                  </div>
                </button>
              ))}
              {items.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                  No records found.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          {!selected || !draft ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              Select a document from the left list.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {String(draft[cfg.primary] || "Document")}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">ID: {selected.id}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cfg.collection === "channel_requests" ? (
                    <>
                      <button
                        onClick={approveChannelRequest}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={rejectChannelRequest}
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {cfg.collection === "posts" ? (
                    <button
                      onClick={applyPostShareMeta}
                      className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
                    >
                      Fill Share Meta
                    </button>
                  ) : null}
                  {cfg.collection === "posts" ? (
                    <Link
                      to={`/posts/${selected.id}`}
                      target="_blank"
                      className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
                    >
                      Open Post
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3">
                {Object.entries(draft)
                  .filter(([k]) => k !== "id")
                  .map(([k, v]) => {
                    const isComplex = typeof v === "object" && v !== null;
                    return (
                      <div key={k} className="rounded-2xl border border-slate-200 p-3">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-600">{k}</div>
                        {isComplex ? (
                          <textarea
                            value={safeStringify(v)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setDraft((prev: any) => ({ ...prev, [k]: parsed }));
                              } catch {
                                setDraft((prev: any) => ({ ...prev, [k]: e.target.value }));
                              }
                            }}
                            className="mt-2 h-24 w-full rounded-2xl border border-slate-200 p-3 font-mono text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                          />
                        ) : (
                          <input
                            value={String(v ?? "")}
                            onChange={(e) => setDraft((prev: any) => ({ ...prev, [k]: smartCast(e.target.value) }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => {
                    setDraft(selected);
                  }}
                  className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
                >
                  Reset
                </button>
                <button
                  onClick={remove}
                  className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
                <button
                  disabled={saving}
                  onClick={save}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function smartCast(input: string) {
  const t = input.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  const n = Number(t);
  if (t !== "" && !Number.isNaN(n) && String(n) === t) return n;
  return input;
}
