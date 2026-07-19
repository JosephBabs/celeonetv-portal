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
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(t("register.failed", "Unable to create account."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-[78vh] items-center gap-8 lg:grid-cols-[0.98fr_0.82fr]">
      <section className="portal-grid-bg overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0d9488_0%,#14b8a6_50%,#f5c451_120%)] px-8 py-10 text-slate-950 shadow-[0_28px_80px_rgba(20,184,166,0.16)] md:px-12 md:py-14">
        <div className="relative max-w-xl">
          <div className="portal-badge !bg-white/50 !text-[#0f3d40]">{t("register.badge", "Start Creating")}</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.02] md:text-6xl">
            {t("register.hero_title", "Join Cele One")}
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-900/76">
            {t("register.hero_desc", "Open your channel and publish content.")}
          </p>

          <div className="mt-8 grid gap-4">
            <HeroPoint title="Portal access" text="Create your account once, then move through the full Cele One experience more easily." />
            <HeroPoint title="Publishing tools" text="Prepare your creator journey, community participation, and future founder actions in one place." />
            <HeroPoint title="Same platform, cleaner UI" text="All your current pages remain intact while the interface becomes more premium and readable." />
          </div>
        </div>
      </section>

      <form onSubmit={register} className="portal-card p-8 md:p-10">
        <div className="portal-badge">Create account</div>
        <h2 className="mt-4 text-3xl font-bold text-[#081828]">{t("register.title", "Create account")}</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
          Open your Cele One portal access with the updated interface.
        </p>

        <div className="mt-6 space-y-4">
          <input placeholder={t("register.email", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder={t("register.password", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button disabled={saving} className="portal-btn portal-btn-dark mt-6 w-full disabled:opacity-60">
          {saving ? t("register.loading", "Creating...") : t("register.signup", "Sign Up")}
        </button>

        <div className="mt-5 text-center text-sm font-semibold text-slate-600">
          {t("register.have_account", "Already have an account?")}{" "}
          <Link to="/login" className="font-extrabold text-teal-700 hover:text-teal-800">
            {t("register.login", "Login")}
          </Link>
        </div>
      </form>
    </div>
  );
}

function HeroPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-900/10 bg-white/52 p-5">
      <div className="text-sm font-bold text-slate-950">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-7 text-slate-800/74">{text}</div>
    </div>
  );
}
