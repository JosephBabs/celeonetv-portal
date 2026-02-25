/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { useAuthUser } from "../lib/useAuthUser";

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function CreatorRequest() {
  const nav = useNavigate();
  const { user, loading } = useAuthUser();
  const { t } = useI18n();

  const [displayName, setDisplayName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TV");
  const [saving, setSaving] = useState(false);

  const channelSlug = useMemo(() => slugify(channelName || displayName), [channelName, displayName]);

  const submit = async () => {
    if (!user) return alert(t("creator_request.login_first", "Please login first."));
    if (!displayName.trim()) return alert(t("creator_request.name_required", "Channel name required"));
    if (!channelSlug) return alert(t("creator_request.slug_invalid", "Invalid channel name"));
    setSaving(true);
    try {
      await addDoc(collection(db, "channel_requests"), {
        userId: user.uid,
        ownerId: user.uid,
        displayName: displayName.trim(),
        channelName: channelSlug,
        description: description.trim(),
        category,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      nav("/creator");
    } catch (e: any) {
      console.error(e);
      alert(t("creator_request.failed", "Unable to submit request."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-slate-600">{t("common.loading", "Loading...")}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">{t("creator_request.title", "Request channel creation")}</div>
        <div className="mt-2 text-slate-600">{t("creator_request.subtitle", "After validation and payment you receive your RTMP key and live page.")}</div>

        {!user ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{t("creator_request.not_logged", "You are not logged in.")}</div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{t("creator_request.connected", "Connected")}: <span className="font-extrabold">{user.email || user.uid}</span></div>
        )}

        <div className="mt-6 grid gap-4">
          <Field label={t("creator_request.display_name", "Display name")}> <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("creator_request.display_placeholder", "Ex: Cele One")} /> </Field>
          <Field label={t("creator_request.url_name", "URL name (optional)")}> <input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("creator_request.url_placeholder", "Ex: cele-one")} /> <div className="mt-2 text-sm text-slate-600">{t("creator_request.final_url", "Final URL")}: <span className="font-bold">/{channelSlug}/live</span></div> </Field>
          <Field label={t("creator_request.category", "Category")}> <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"><option>TV</option><option>Gospel</option><option>News</option><option>Entertainment</option><option>Education</option></select> </Field>
          <Field label={t("creator_request.description", "Description")}> <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("creator_request.description_placeholder", "Describe your channel...")} /> </Field>

          <button onClick={submit} disabled={saving} className="rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? t("creator_request.submitting", "Submitting...") : t("creator_request.submit", "Submit request")}</button>
          <Link to="/" className="text-center font-extrabold text-slate-700 hover:text-slate-900">{t("creator_request.back_home", "Back to home")}</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><div className="mb-2 text-sm font-extrabold text-slate-700">{label}</div>{children}</div>;
}
