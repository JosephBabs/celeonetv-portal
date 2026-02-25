import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: t("login.meta_title", "Login | Celeone TV"),
      description: t("login.meta_desc", "Sign in to your creator panel."),
    });
  }, [t]);

  const login = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/creator");
    } catch (error) {
      console.error(error);
      alert(t("login.invalid", "Invalid email or password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-8 py-8 md:grid-cols-2">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white">
        <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black">{t("login.badge", "Creator Access")}</div>
        <h1 className="mt-4 text-4xl font-black">{t("login.hero_title", "Welcome back to Cele One")}</h1>
        <p className="mt-3 text-white/80">{t("login.hero_desc", "Manage your channel and content.")}</p>
      </section>

      <form onSubmit={login} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">{t("login.title", "Login")}</h2>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("login.email", "Email")} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("login.password", "Password")} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={saving} className="mt-5 w-full rounded-2xl bg-teal-600 px-4 py-3 font-extrabold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? t("login.loading", "Logging in...") : t("login.title", "Login")}</button>
        <div className="mt-4 text-center text-sm text-slate-600">
          {t("login.no_account", "No account?")} <Link to="/register" className="font-extrabold text-teal-700">{t("login.create_one", "Create one")}</Link>
        </div>
      </form>
    </div>
  );
}
