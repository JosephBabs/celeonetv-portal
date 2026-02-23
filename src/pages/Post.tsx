/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { setPageMeta } from "../lib/seo";

export default function Post() {
  const { postId } = useParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  const openPostInApp = () => {
    if (!postId) return;

    const packageName = "com.celeoneapp";
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    const appSchemeUrl = `celeone://posts/${postId}`;
    const intentUrl = `intent://posts/${postId}#Intent;scheme=celeone;package=${packageName};S.browser_fallback_url=${encodeURIComponent(
      playStoreUrl
    )};end`;
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);

    if (isAndroid) {
      window.location.href = intentUrl;
      return;
    }

    const startedAt = Date.now();
    window.location.href = appSchemeUrl;
    window.setTimeout(() => {
      if (Date.now() - startedAt < 1800) {
        window.location.href = playStoreUrl;
      }
    }, 1200);
  };

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

  useEffect(() => {
    if (!post) return;
    const title = post.shareTitle || post.title || "Celeone TV";
    const description = (post.shareDescription || post.content || "").toString().trim().slice(0, 180);
    const image = post.shareImage || post.image || "https://celeonetv.com/logo.png";
    setPageMeta({
      title,
      description,
      image,
      url: window.location.href,
      type: "article",
    });
  }, [post]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Post not found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
        <div className="text-lg font-black text-teal-900">Open in app</div>
        <div className="mt-1 text-sm text-teal-900/80">
          For the best deep-link experience, open this post in the Celeone mobile app.
        </div>
        <button
          onClick={openPostInApp}
          className="mt-3 rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700"
        >
          Open in app
        </button>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        {post.image ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <img src={post.image} className="h-auto w-full" alt={post.title || "Post image"} />
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
