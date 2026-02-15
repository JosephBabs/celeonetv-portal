import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";

export default function Post() {
  const { postId } = useParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "posts", postId));
        setPost(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [postId]);

  if (loading) return <div className="py-10 text-center text-slate-600">Chargement…</div>;

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Post introuvable</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* open in app banner */}
      <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
        <div className="text-lg font-black text-teal-900">Ouvrir dans l’application</div>
        <div className="mt-1 text-sm text-teal-900/80">
          Pour la meilleure expérience (deeplink), ouvre ce post dans l’app mobile Celeone.
        </div>
        <button
          onClick={() => alert("Deep link (on détaille plus tard)")}
          className="mt-3 rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
        >
          Ouvrir dans l’app
        </button>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        {post.image ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <img src={post.image} className="h-auto w-full" />
          </div>
        ) : null}

        <h1 className="mt-4 text-3xl font-black">{post.title || "Post"}</h1>
        <div className="mt-2 text-slate-600">{post.createdAt?.toDate?.().toLocaleString?.() || ""}</div>

        <div className="prose prose-slate mt-5 max-w-none">
          <p style={{ whiteSpace: "pre-wrap" }}>{post.content || ""}</p>
        </div>
      </article>
    </div>
  );
}
