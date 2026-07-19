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
    <div className="grid min-h-[78vh] items-center gap-8 lg:grid-cols-[0.98fr_0.82fr]">
      <section className="portal-grid-bg overflow-hidden rounded-[36px] bg-[#081828] px-8 py-10 text-white shadow-[0_28px_80px_rgba(8,24,40,0.18)] md:px-12 md:py-14">
        <div className="relative max-w-xl">
          <div className="portal-badge !bg-white/10 !text-[#8be0d6]">{t("login.badge", "Creator Access")}</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.02] md:text-6xl">
            {t("login.hero_title", "Welcome back to Cele One")}
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-white/76">
            {t("login.hero_desc", "Manage your channel and content.")}
          </p>

          <div className="mt-8 grid gap-4">
            <HeroPoint title="Secure access" text="Connect to your existing portal identity and continue exactly where you left off." />
            <HeroPoint title="Creator workflow" text="Reach your channel, content, founder, and documentation tools from one cleaner interface." />
            <HeroPoint title="Portal continuity" text="Same Cele One data and pages, with a better visual experience." />
          </div>
        </div>
      </section>

      <form onSubmit={login} className="portal-card p-8 md:p-10">
        <div className="portal-badge">Sign in</div>
        <h2 className="mt-4 text-3xl font-bold text-[#081828]">{t("login.title", "Login")}</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
          Access your Cele One portal account securely.
        </p>

        <div className="mt-6 space-y-4">
          <input placeholder={t("login.email", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder={t("login.password", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button disabled={saving} className="portal-btn portal-btn-primary mt-6 w-full disabled:opacity-60">
          {saving ? t("login.loading", "Logging in...") : t("login.title", "Login")}
        </button>

        <div className="mt-5 text-center text-sm font-semibold text-slate-600">
          {t("login.no_account", "No account?")}{" "}
          <Link to="/register" className="font-extrabold text-teal-700 hover:text-teal-800">
            {t("login.create_one", "Create one")}
          </Link>
        </div>
      </form>
    </div>
  );
}

function HeroPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-7 text-white/72">{text}</div>
    </div>
  );
}
