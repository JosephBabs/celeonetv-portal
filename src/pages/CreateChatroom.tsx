/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { useAuthUser } from "../lib/useAuthUser";
import { setPageMeta } from "../lib/seo";

export default function CreateChatroom() {
  const { t } = useI18n();
  const { user, loading } = useAuthUser();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("francais");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: t("chatroom.meta_title", "Create Chatroom | Celeone TV"),
      description: t("chatroom.meta_desc", "Create a public community chatroom."),
    });
  }, [t]);

  const createRoom = async (e: any) => {
    e.preventDefault();
    if (!user) return alert(t("chatroom.login_first", "Please login first."));
    if (!name.trim()) return alert(t("chatroom.name_required", "Chatroom name is required."));
    setSaving(true);
    try {
      await addDoc(collection(db, "chatrooms"), {
        ownerId: user.uid,
        name: name.trim(),
        description: description.trim(),
        language,
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      nav("/creator");
    } catch (error) {
      console.error(error);
      alert(t("chatroom.failed", "Failed to create chatroom."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-slate-600">{t("common.loading", "Loading...")}</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
        <div className="text-3xl font-black">{t("chatroom.title", "Create Chatroom")}</div>
        <div className="mt-2 text-white/80">{t("chatroom.subtitle", "Launch your community room.")}</div>
      </div>

      <form onSubmit={createRoom} className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4">
          <Field label={t("chatroom.room_name", "Room Name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("chatroom.room_name_placeholder", "Cele One Worship Room")} />
          </Field>
          <Field label={t("chatroom.language", "Language")}>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200">
              <option value="goun">goun</option>
              <option value="francais">francais</option>
              <option value="yoruba">yoruba</option>
              <option value="anglais">anglais</option>
            </select>
          </Field>
          <Field label={t("chatroom.description", "Description")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("chatroom.description_placeholder", "What should members discuss?")} />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Link to="/" className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-200">{t("common.cancel", "Cancel")}</Link>
          <button disabled={saving} className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? t("chatroom.creating", "Creating...") : t("chatroom.title", "Create Chatroom")}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return <div className="space-y-2"><div className="text-sm font-extrabold text-slate-700">{label}</div>{children}</div>;
}
