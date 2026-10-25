import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { setPageMeta } from "../lib/seo";

const API_BASE = (import.meta.env.VITE_LARAVEL_API_URL || "https://api.celeonetv.com/api/v1").replace(/\/$/, "");
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.celeoneapp";
const APP_STORE = "https://apps.apple.com/search?term=Cele%20One";
type ShareKind = "items" | "shops" | "jobs" | "offers" | "cv";
type ShareItem = Record<string, any>;

const imageFor = (item: ShareItem, kind: ShareKind) => kind === "items"
  ? item.images?.find((value: unknown) => typeof value === "string") || ""
  : kind === "shops" ? item.coverUrl || item.logoUrl || ""
    : kind === "cv" ? item.photoUrl || "" : item.companyLogoUrl || "";
const titleFor = (item: ShareItem, kind: ShareKind) => kind === "cv" ? item.headline || item.name : kind === "shops" ? item.title : item.title;
const descriptionFor = (item: ShareItem, kind: ShareKind) => kind === "cv"
  ? item.summary || [item.city, item.country].filter(Boolean).join(", ")
  : item.description || item.summary || "";
const appPath = (kind: ShareKind, id: string) => kind === "items" ? `market/items/${id}` : kind === "shops" ? `market/shops/${id}` : kind === "cv" ? `market/cv/${id}` : `market/jobs/${id}`;

export default function MarketplaceShare() {
  const { kind: rawKind = "", entityId = "" } = useParams();
  const kind = rawKind as ShareKind;
  const [item, setItem] = useState<ShareItem | null>(null);
  const [listings, setListings] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiPath = useMemo(() => {
    if (kind === "items") return `marketplace/listings/${encodeURIComponent(entityId)}`;
    if (kind === "shops") return `marketplace/shops/${encodeURIComponent(entityId)}`;
    if (kind === "cv") return `marketplace/public/professional-profiles/${encodeURIComponent(entityId)}`;
    return `marketplace/jobs/${encodeURIComponent(entityId)}`;
  }, [kind, entityId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setItem(null); setListings([]);
    void fetch(`${API_BASE}/${apiPath}`, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? "This marketplace page is not available." : "Could not load this marketplace page.");
        const payload = await response.json();
        return payload?.data || null;
      })
      .then(async value => {
        if (!value) throw new Error("This marketplace page is not available.");
        setItem(value);
        if (kind === "shops") {
          const response = await fetch(`${API_BASE}/marketplace/shops/${encodeURIComponent(entityId)}/listings`, { headers: { Accept: "application/json" }, signal: controller.signal });
          if (response.ok) { const rows = await response.json(); setListings(Array.isArray(rows?.data) ? rows.data : []); }
        }
      })
      .catch(error => { if (error.name !== "AbortError") setError(error.message || "Could not load this marketplace page."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiPath, entityId, kind]);

  useEffect(() => {
    if (!item) return;
    const title = String(titleFor(item, kind) || "Cele One Marketplace");
    setPageMeta({ title, description: descriptionFor(item, kind).slice(0, 220), image: imageFor(item, kind) || "https://celeonetv.com/logo.png", type: "article", url: window.location.href, canonicalPath: window.location.pathname });
  }, [item, kind]);

  const share = async () => {
    if (!item) return;
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: String(titleFor(item, kind) || "Cele One"), text: descriptionFor(item, kind), url });
    else { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
  };

  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item || submitting) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    setSubmitting(true); setFormState("");
    try {
      const response = await fetch(`${API_BASE}/marketplace/jobs/${encodeURIComponent(entityId)}/guest-applications`, {
        method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || "Application could not be submitted. Please check your details and try again.");
      setFormState("Your application was sent successfully."); formElement.reset();
    } catch (error: any) { setFormState(error.message || "Application could not be submitted."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <main className="mx-auto max-w-4xl p-8 text-slate-600" role="status">Loading marketplace page…</main>;
  if (error || !item) return <main className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8"><p className="font-bold text-slate-900">Marketplace page unavailable</p><p className="mt-2 text-slate-600">{error}</p><Link className="mt-5 inline-block font-bold text-teal-700 underline" to="/market">Browse Cele One</Link></main>;

  const title = String(titleFor(item, kind) || "Cele One Marketplace");
  const description = String(descriptionFor(item, kind) || "");
  const image = imageFor(item, kind);
  const isJob = kind === "jobs" || kind === "offers";
  const isListing = kind === "items";
  const isShop = kind === "shops";
  const isCv = kind === "cv";
  const appUrl = `celeone://${appPath(kind, entityId)}`;
  const currency = String(item.currency || "XOF");
  const price = item.pricingMode === "quote" ? "Price on request" : item.price == null ? "" : `${Number(item.price).toLocaleString()} ${currency}${item.unitLabel ? ` / ${item.unitLabel}` : ""}`;

  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:py-10">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4"><div><p className="font-black text-teal-900">Cele One Market</p><p className="text-sm text-teal-800">Marketplace and careers</p></div><button type="button" onClick={() => void share()} className="rounded-xl border border-teal-200 bg-white px-4 py-2.5 font-bold text-teal-900">{copied ? "Link copied" : "Share"}</button></header>
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {image ? <img src={image} alt={title} className="max-h-[500px] w-full bg-slate-100 object-cover" /> : <div className="flex h-48 items-center justify-center bg-teal-50 text-5xl font-black text-teal-700">{isShop ? "⌂" : isCv ? "CV" : "C"}</div>}
      <div className="space-y-5 p-5 sm:p-8">
        <div><p className="text-xs font-black uppercase tracking-widest text-teal-700">{isListing ? item.kind === "service" ? "Service" : "Product" : isShop ? "Verified boutique" : isJob ? "Job opportunity" : "Professional profile"}</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{title}</h1>{isCv && item.name ? <p className="mt-2 text-lg font-semibold text-slate-700">{item.name}</p> : null}</div>
        {isListing && price ? <p className="text-2xl font-black text-slate-900">{price}</p> : null}
        {isJob ? <div className="flex flex-wrap gap-2">{[item.companyName, item.location, item.workMode, item.employmentType, item.offerType].filter(Boolean).map((value: string) => <span key={value} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{value}</span>)}</div> : null}
        {isCv ? <div className="flex flex-wrap gap-2">{[item.city, item.country, item.availability, ...(Array.isArray(item.skills) ? item.skills.slice(0, 8).map((skill: any) => typeof skill === "string" ? skill : skill?.name).filter(Boolean) : [])].filter(Boolean).map((value: string) => <span key={value} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{value}</span>)}</div> : null}
        {description ? <p className="whitespace-pre-line leading-7 text-slate-700">{description}</p> : null}
        {isJob && Array.isArray(item.requirements) && item.requirements.length > 0 ? <section><h2 className="font-black text-slate-900">Requirements</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">{item.requirements.map((value: string) => <li key={value}>{value}</li>)}</ul></section> : null}
        {isListing || isShop ? <a href={appUrl} className="inline-flex rounded-xl bg-teal-700 px-5 py-3 font-black text-white">{isShop ? "Open boutique in app" : "Continue in the app to buy"}</a> : null}
        {isCv ? <a href={appUrl} className="inline-flex rounded-xl bg-teal-700 px-5 py-3 font-black text-white">Open profile in app</a> : null}
        {isJob ? <section id="apply" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"><h2 className="text-xl font-black text-slate-950">Apply online</h2><p className="mt-1 text-sm text-slate-600">Send your application to {item.companyName || "the hiring team"}.</p><form onSubmit={apply} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold text-slate-700">Full name<input name="applicantName" required maxLength={150} autoComplete="name" className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold text-slate-700">Email<input name="applicantEmail" required type="email" maxLength={255} autoComplete="email" className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold text-slate-700">Phone<input name="applicantPhone" required maxLength={64} autoComplete="tel" className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">Message<textarea name="message" required minLength={10} maxLength={6000} rows={5} className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" placeholder="Tell the hiring team why you are a good fit." /></label><div className="sm:col-span-2"><button disabled={submitting} className="rounded-xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-60">{submitting ? "Sending…" : "Submit application"}</button>{formState ? <p role="status" className="mt-3 text-sm font-semibold text-slate-700">{formState}</p> : null}</div></form></section> : null}
      </div>
    </article>
    {isShop && listings.length ? <section><h2 className="mb-3 text-xl font-black text-slate-950">Available in this boutique</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map(listing => <Link key={listing.id} to={`/market/items/${encodeURIComponent(listing.id)}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} className="h-48 w-full object-cover" /> : null}<div className="p-4"><h3 className="font-black text-slate-900">{listing.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{listing.description}</p></div></Link>)}</div></section> : null}
    <footer className="rounded-2xl bg-slate-900 p-5 text-white"><p className="font-black">Get the Cele One app</p><p className="mt-1 text-sm text-slate-300">Open the full marketplace experience in the app.</p><div className="mt-4 flex flex-wrap gap-3"><a href={PLAY_STORE} className="rounded-xl bg-white px-4 py-2.5 font-bold text-slate-900">Google Play</a><a href={APP_STORE} className="rounded-xl border border-slate-600 px-4 py-2.5 font-bold text-white">App Store</a></div></footer>
  </main>;
}
