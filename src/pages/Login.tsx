import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      navigate(searchParams.get("returnTo") || "/");
    } catch (error) {
      console.error(error);
      alert(t("login.invalid", "Invalid email or password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-[78vh] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="space-y-5">
        <div className="portal-badge">{t("login.badge", "Creator Access")}</div>
        <h1 className="max-w-xl text-4xl font-bold leading-[1.05] text-[#081828] md:text-6xl">
          {t("login.hero_title", "Welcome back to Cele One")}
        </h1>
        <p className="max-w-xl text-base font-semibold leading-8 text-slate-600">
          {t("login.hero_desc", "Manage your channel and content.")}
        </p>
        <div className="grid gap-4">
          <HeroPoint title="Secure sign in" text="Access the same portal data, creator tools and founder workflows through the upgraded interface." />
          <HeroPoint title="Cleaner experience" text="The visual system now follows the lighter Spark-style product presentation you selected." />
        </div>
      </section>

      <form onSubmit={login} className="portal-card bg-white p-8 md:p-10">
        <div className="text-sm font-black uppercase tracking-[0.18em] text-[#25b860]">{t("login.title", "Login")}</div>
        <h2 className="mt-3 text-3xl font-bold text-[#081828]">Sign in to your portal</h2>
        <div className="mt-6 space-y-4">
          <input placeholder={t("login.email", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder={t("login.password", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={saving} className="portal-btn portal-btn-primary mt-6 w-full disabled:opacity-60">
          {saving ? t("login.loading", "Logging in...") : t("login.title", "Login")}
        </button>
        <div className="mt-5 text-center text-sm font-semibold text-slate-600">
          {t("login.no_account", "No account?")} <Link to="/register" className="font-extrabold text-[#25b860]">{t("login.create_one", "Create one")}</Link>
        </div>
      </form>
    </div>
  );
}

function HeroPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="portal-card bg-white p-5">
      <div className="text-lg font-bold text-[#081828]">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">{text}</div>
    </div>
  );
}
