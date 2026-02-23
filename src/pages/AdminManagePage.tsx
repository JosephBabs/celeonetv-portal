/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
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

type SectionKey = "functions" | "cantiques" | "posts" | "documents" | "channel-requests" | "chatrooms";

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
  documents: {
    title: "Documents",
    collection: "documents",
    primary: "title",
    secondary: "category",
    orderField: "updatedAt",
    description: "Manage essential ECC documents and HTML content.",
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
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [mobileTab, setMobileTab] = useState<"list" | "editor">("list");
  const [newHymn, setNewHymn] = useState({
    title: "",
    hymnNumber: "",
    language: "francais",
    musicalKey: "",
    hymnContent: "",
  });
  const [newPost, setNewPost] = useState({
    title: "",
    category: "Actualites",
    description: "",
    image: "",
    contentHtml: "",
  });

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
    setSearch("");
    setLanguage("all");
    setMobileTab("list");
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
    const image = String(draft?.image || "https://celeonetv.com/logo.jpeg");

    setDraft((prev: any) => ({
      ...prev,
      shareTitle: title,
      shareDescription: description,
      shareImage: image,
    }));
  };

  const createHymn = async () => {
    if (!cfg || cfg.collection !== "cantiques") return;
    if (!newHymn.title.trim()) return alert("Hymn title is required.");
    if (!newHymn.hymnNumber.trim()) return alert("Hymn number is required.");
    if (!newHymn.hymnContent.trim()) return alert("Hymn content is required.");
    setCreating(true);
    try {
      await addDoc(collection(db, "cantiques"), {
        title: newHymn.title.trim(),
        hymnNumber: newHymn.hymnNumber.trim(),
        language: newHymn.language,
        musicalKey: newHymn.musicalKey.trim(),
        hymnContent: newHymn.hymnContent.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewHymn({
        title: "",
        hymnNumber: "",
        language: "francais",
        musicalKey: "",
        hymnContent: "",
      });
      await load();
      alert("Hymn added.");
    } catch (e) {
      console.error(e);
      alert("Failed to add hymn.");
    } finally {
      setCreating(false);
    }
  };

  const createPost = async () => {
    if (!cfg || cfg.collection !== "posts") return;
    if (!newPost.title.trim()) return alert("Post title is required.");
    if (!newPost.contentHtml.trim()) return alert("Post HTML content is required.");
    setCreating(true);
    try {
      const contentText = stripHtml(newPost.contentHtml).slice(0, 10000);
      await addDoc(collection(db, "posts"), {
        title: newPost.title.trim(),
        category: newPost.category.trim(),
        description: newPost.description.trim(),
        image: newPost.image.trim(),
        contentHtml: newPost.contentHtml.trim(),
        content: contentText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewPost({
        title: "",
        category: "Actualites",
        description: "",
        image: "",
        contentHtml: "",
      });
      await load();
      alert("Post created.");
    } catch (e) {
      console.error(e);
      alert("Failed to create post.");
    } finally {
      setCreating(false);
    }
  };

  const sortedSections = useMemo(
    () => Object.keys(SECTION_CONFIG) as SectionKey[],
    []
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (cfg?.collection === "cantiques" && language !== "all") {
        const lang = String(it.language || it.lang || "").toLowerCase();
        if (lang !== language) return false;
      }

      if (!q) return true;
      const title = String(it.title || "").toLowerCase();
      const content = String(it.hymnContent || it.contentHtml || it.content || it.lyrics || it.text || "").toLowerCase();
      const number = String(it.number || it.hymnNumber || it.numero || "").toLowerCase();
      const author = String(it.author || "").toLowerCase();
      return (
        title.includes(q) ||
        content.includes(q) ||
        number.includes(q) ||
        author.includes(q)
      );
    });
  }, [cfg?.collection, items, language, search]);

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

      {cfg.collection === "cantiques" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-black text-slate-900">Add Hymn</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={newHymn.title}
              onChange={(e) => setNewHymn((v) => ({ ...v, title: e.target.value }))}
              placeholder="Title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            <input
              value={newHymn.hymnNumber}
              onChange={(e) => setNewHymn((v) => ({ ...v, hymnNumber: e.target.value }))}
              placeholder="Hymn Number (ex: 87)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            <select
              value={newHymn.language}
              onChange={(e) => setNewHymn((v) => ({ ...v, language: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value="francais">francais</option>
              <option value="anglais">anglais</option>
              <option value="yoruba">yoruba</option>
              <option value="goun">goun</option>
            </select>
            <input
              value={newHymn.musicalKey}
              onChange={(e) => setNewHymn((v) => ({ ...v, musicalKey: e.target.value }))}
              placeholder="Musical Key (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
          <div className="mt-3">
            <HtmlEditor
              value={newHymn.hymnContent}
              onChange={(v) => setNewHymn((s) => ({ ...s, hymnContent: v }))}
              placeholder="Paste hymn HTML content here..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={creating}
              onClick={createHymn}
              className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Add Hymn"}
            </button>
          </div>
        </div>
      ) : null}

      {cfg.collection === "posts" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-black text-slate-900">Create Post</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={newPost.title}
              onChange={(e) => setNewPost((v) => ({ ...v, title: e.target.value }))}
              placeholder="Post Title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            <input
              value={newPost.category}
              onChange={(e) => setNewPost((v) => ({ ...v, category: e.target.value }))}
              placeholder="Category"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            <input
              value={newPost.description}
              onChange={(e) => setNewPost((v) => ({ ...v, description: e.target.value }))}
              placeholder="Description"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200 md:col-span-2"
            />
            <input
              value={newPost.image}
              onChange={(e) => setNewPost((v) => ({ ...v, image: e.target.value }))}
              placeholder="Image URL"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200 md:col-span-2"
            />
          </div>
          <div className="mt-3">
            <HtmlEditor
              value={newPost.contentHtml}
              onChange={(v) => setNewPost((s) => ({ ...s, contentHtml: v }))}
              placeholder="Write post HTML content..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={creating}
              onClick={createPost}
              className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {creating ? "Publishing..." : "Create Post"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <button
            onClick={() => setMobileTab("list")}
            className={`rounded-2xl px-3 py-2 text-sm font-extrabold ${mobileTab === "list" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}
          >
            Documents
          </button>
          <button
            onClick={() => setMobileTab("editor")}
            className={`rounded-2xl px-3 py-2 text-sm font-extrabold ${mobileTab === "editor" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}
          >
            Editor
          </button>
        </div>

        <div className={`rounded-3xl border border-slate-200 bg-white p-4 ${mobileTab === "editor" ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-slate-700">Documents</div>
            <div className="text-xs font-bold text-slate-500">{filteredItems.length}</div>
          </div>
          <div className="mt-3 space-y-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={cfg.collection === "cantiques" ? "Search hymn number or text" : "Search documents"}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
            {cfg.collection === "cantiques" ? (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="all">all languages</option>
                <option value="goun">goun</option>
                <option value="francais">francais</option>
                <option value="yoruba">yoruba</option>
                <option value="anglais">anglais</option>
              </select>
            ) : null}
          </div>
          {loading ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              Loading...
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    setSelected(it);
                    setDraft(it);
                    setMobileTab("editor");
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
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                  No records found.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className={`rounded-3xl border border-slate-200 bg-white p-4 md:p-5 ${mobileTab === "list" ? "hidden lg:block" : ""}`}>
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
                    const isHymnTextField =
                      cfg.collection === "cantiques" &&
                      ["hymncontent", "content", "lyrics", "text", "verse"].includes(k.toLowerCase());
                    const isDocumentTextField =
                      cfg.collection === "documents" &&
                      ["contenthtml", "content", "description"].includes(k.toLowerCase());
                    const isPostHtmlField =
                      cfg.collection === "posts" &&
                      ["contenthtml", "content"].includes(k.toLowerCase());
                    return (
                      <div key={k} className="rounded-2xl border border-slate-200 p-3">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-600">{k}</div>
                        {isHymnTextField || isDocumentTextField || isPostHtmlField ? (
                          <HtmlEditor
                            value={String(v ?? "")}
                            onChange={(value) => setDraft((prev: any) => ({ ...prev, [k]: value }))}
                            placeholder={`Edit ${k} HTML...`}
                          />
                        ) : isComplex ? (
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

function HtmlEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[260px] w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm font-medium outline-none focus:ring-2 focus:ring-teal-200"
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-600">Preview</div>
        <div
          className="prose prose-slate max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      </div>
    </div>
  );
}

function stripHtml(html: string) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
