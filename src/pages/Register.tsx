import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

export default function Register() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: t("register.meta_title", "Register | Celeone TV"),
      description: t("register.meta_desc", "Create your account."),
    });
  }, [t]);

  const register = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/creator");
    } catch (error) {
      console.error(error);
      alert(t("register.failed", "Unable to create account."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-8 py-8 md:grid-cols-2">
      <section className="rounded-3xl bg-gradient-to-br from-cyan-700 to-teal-600 p-8 text-white">
        <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black">{t("register.badge", "Start Creating")}</div>
        <h1 className="mt-4 text-4xl font-black">{t("register.hero_title", "Join Cele One")}</h1>
        <p className="mt-3 text-white/85">{t("register.hero_desc", "Open your channel and publish content.")}</p>
      </section>

      <form onSubmit={register} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">{t("register.title", "Create account")}</h2>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("register.email", "Email")} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" placeholder={t("register.password", "Password")} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={saving} className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">{saving ? t("register.loading", "Creating...") : t("register.signup", "Sign Up")}</button>
        <div className="mt-4 text-center text-sm text-slate-600">
          {t("register.have_account", "Already have an account?")} <Link to="/login" className="font-extrabold text-teal-700">{t("register.login", "Login")}</Link>
        </div>
      </form>
    </div>
  );
}
