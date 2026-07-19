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
    <div className="grid min-h-[78vh] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="space-y-5">
        <div className="portal-badge">{t("register.badge", "Start Creating")}</div>
        <h1 className="max-w-xl text-4xl font-bold leading-[1.05] text-[#081828] md:text-6xl">
          {t("register.hero_title", "Join Cele One")}
        </h1>
        <p className="max-w-xl text-base font-semibold leading-8 text-slate-600">
          {t("register.hero_desc", "Open your channel and publish content.")}
        </p>
        <div className="grid gap-4">
          <HeroPoint title="One portal access" text="Create your account once and move through the full Cele One public experience with the updated UI." />
          <HeroPoint title="Ready for launch" text="Use the same real routes and data structure while benefiting from a cleaner template-driven presentation." />
        </div>
      </section>

      <form onSubmit={register} className="portal-card bg-white p-8 md:p-10">
        <div className="text-sm font-black uppercase tracking-[0.18em] text-[#25b860]">{t("register.title", "Create account")}</div>
        <h2 className="mt-3 text-3xl font-bold text-[#081828]">Open your Cele One access</h2>
        <div className="mt-6 space-y-4">
          <input placeholder={t("register.email", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder={t("register.password", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={saving} className="portal-btn portal-btn-primary mt-6 w-full disabled:opacity-60">
          {saving ? t("register.loading", "Creating...") : t("register.signup", "Sign Up")}
        </button>
        <div className="mt-5 text-center text-sm font-semibold text-slate-600">
          {t("register.have_account", "Already have an account?")} <Link to="/login" className="font-extrabold text-[#25b860]">{t("register.login", "Login")}</Link>
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
