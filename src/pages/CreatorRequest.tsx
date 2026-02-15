/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuthUser } from "../lib/useAuthUser";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CreatorRequest() {
  const nav = useNavigate();
  const { user, loading } = useAuthUser();

  const [displayName, setDisplayName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TV");
  const [saving, setSaving] = useState(false);

  const channelSlug = useMemo(() => slugify(channelName || displayName), [channelName, displayName]);

  const submit = async () => {
    if (!user) {
      alert("Connecte-toi d'abord (Firebase Auth).");
      return;
    }
    if (!displayName.trim()) return alert("Nom de chaîne requis");
    if (!channelSlug) return alert("Channel name invalide");
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
      alert("Erreur: impossible d'envoyer la demande.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-slate-600">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Demander la création d’une chaîne</div>
        <div className="mt-2 text-slate-600">
          Après validation + paiement, tu reçois ton RTMP key et ta page live partageable.
        </div>

        {!user ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Tu n’es pas connecté. Connecte-toi via Firebase Auth dans ton app / site.
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            Connecté: <span className="font-extrabold">{user.email || user.uid}</span>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          <Field label="Nom affiché (display)">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Ex: Cèlè One"
            />
          </Field>

          <Field label="Nom URL (optionnel)">
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Ex: cele-one"
            />
            <div className="mt-2 text-sm text-slate-600">
              URL finale: <span className="font-bold">/{channelSlug}/live</span>
            </div>
          </Field>

          <Field label="Catégorie">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option>TV</option>
              <option>Gospel</option>
              <option>News</option>
              <option>Entertainment</option>
              <option>Education</option>
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Décris ta chaîne…"
            />
          </Field>

          <button
            onClick={submit}
            disabled={saving}
            className="rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Envoi…" : "Soumettre la demande"}
          </button>

          <Link to="/" className="text-center font-extrabold text-slate-700 hover:text-slate-900">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <div className="mb-2 text-sm font-extrabold text-slate-700">{label}</div>
      {children}
    </div>
  );
}
