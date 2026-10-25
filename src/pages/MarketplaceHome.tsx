import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { setPageMeta } from "../lib/seo";

const API_BASE = (import.meta.env.VITE_LARAVEL_API_URL || "https://api.celeonetv.com/api/v1").replace(/\/$/, "");
type Feed = { listings: any[]; shops: any[]; jobs: any[] };

export default function MarketplaceHome() {
  const [feed, setFeed] = useState<Feed>({ listings: [], shops: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setPageMeta({ title: "Cele One Market | Products, boutiques and careers", description: "Browse products, services, boutiques and job offers in the Cele One marketplace.", image: "https://celeonetv.com/logo.png", type: "website", url: window.location.href, canonicalPath: "/market" });
    const controller = new AbortController();
    void fetch(`${API_BASE}/marketplace/feed?limit=30`, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Marketplace is temporarily unavailable."); return response.json(); })
      .then(payload => setFeed({ listings: payload?.data?.listings || [], shops: payload?.data?.shops || [], jobs: payload?.data?.jobs || [] }))
      .catch(e => { if (e.name !== "AbortError") setError(e.message || "Marketplace is temporarily unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const section = (title: string, rows: any[], path: (item: any) => string, image: (item: any) => string, detail: (item: any) => string) => rows.length ? <section><div className="mb-4 flex items-end justify-between"><h2 className="text-2xl font-black text-slate-950">{title}</h2><span className="text-sm text-slate-500">{rows.length} featured</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(item => <Link key={item.id} to={path(item)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">{image(item) ? <img src={image(item)} alt={item.title || item.companyName || "Cele One Market"} className="h-48 w-full bg-slate-100 object-cover" /> : <div className="flex h-40 items-center justify-center bg-teal-50 text-3xl font-black text-teal-700">Cele One</div>}<div className="p-4"><h3 className="font-black text-slate-900">{item.title || item.headline || item.companyName}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{detail(item)}</p></div></Link>)}</div></section> : null;
  return <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:py-12"><header className="rounded-3xl bg-gradient-to-br from-teal-800 to-slate-950 p-7 text-white sm:p-12"><p className="text-sm font-black uppercase tracking-[.2em] text-teal-200">Cele One Market</p><h1 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">Products, boutiques and opportunities</h1><p className="mt-4 max-w-2xl leading-7 text-teal-50">Explore marketplace listings and hiring offers. Product orders and checkout are completed securely in the Cele One app. Job applications can be submitted here.</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://play.google.com/store/apps/details?id=com.celeoneapp" className="rounded-xl bg-white px-4 py-3 font-black text-slate-900">Get the app</a><a href="https://apps.apple.com/search?term=Cele%20One" className="rounded-xl border border-teal-200 px-4 py-3 font-black text-white">App Store</a></div></header>{loading ? <p role="status" className="text-slate-600">Loading marketplace…</p> : null}{error ? <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">{error}</p> : null}{section("Products and services", feed.listings, item => `/market/items/${encodeURIComponent(item.id)}`, item => item.images?.[0] || "", item => item.description || item.shopTitle || "View this listing")}{section("Boutiques", feed.shops, item => `/market/shops/${encodeURIComponent(item.id)}`, item => item.coverUrl || item.logoUrl || "", item => item.description || [item.city, item.country].filter(Boolean).join(", "))}{section("Job offers", feed.jobs, item => `/market/jobs/${encodeURIComponent(item.id)}`, item => item.companyLogoUrl || "", item => [item.companyName, item.location, item.workMode].filter(Boolean).join(" · "))}{!loading && !feed.listings.length && !feed.shops.length && !feed.jobs.length && !error ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">New marketplace listings and opportunities will appear here.</p> : null}</main>;
}
