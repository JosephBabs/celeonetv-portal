import { signOut } from "firebase/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { APP } from "../lib/config";
import { useI18n } from "../lib/i18n";
import { useAuthUser } from "../lib/useAuthUser";
import { useUserRole } from "../lib/useUserRole";

export default function TopNav() {
  const { user } = useAuthUser();
  const { isAdmin } = useUserRole();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-[#081828]/92 text-white shadow-[0_18px_50px_rgba(8,24,40,0.16)] backdrop-blur-xl">
      <div className="portal-container py-4">
        <div className="rounded-[32px] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2">
                <img
                  src={APP.brand.logoWordmark}
                  alt="Celeone"
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7dd3c9]">Cele One</div>
                <div className="text-sm font-bold text-white/75">Portal experience</div>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-extrabold text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>

            <nav className="hidden items-center gap-2 lg:flex">
              <DesktopLinks user={user} isAdmin={isAdmin} t={t} />
            </nav>
          </div>

          {mobileOpen ? (
            <nav className="mt-4 grid gap-2 rounded-[24px] border border-white/10 bg-white/8 p-3 lg:hidden">
              <MobileLinks user={user} isAdmin={isAdmin} onClose={closeMobile} t={t} />
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function navLinkClass() {
  return "rounded-full px-4 py-3 text-sm font-extrabold text-white/82 transition hover:bg-white/10 hover:text-white";
}

function DesktopLinks({ user, isAdmin, t }: { user: unknown; isAdmin: boolean; t: (k: string, f?: string) => string }) {
  return (
    <>
      <Link to="/creator/request" className={navLinkClass()}>
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link to="/spiritual-program" className={navLinkClass()}>
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link to="/prelaunch-registration" className={navLinkClass()}>
        {t("nav.prelaunch_registration", "Prelaunch Registration")}
      </Link>
      <Link to="/founders" className={navLinkClass()}>
        Founder's Pass
      </Link>
      <Link to="/documentation" className={navLinkClass()}>
        {t("nav.documentation", "Documentation")}
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link to="/admin" className="portal-btn portal-btn-gold">
              {t("nav.admin", "Admin")}
            </Link>
          ) : null}
          <button
            onClick={() => signOut(auth)}
            className="portal-btn border border-white/14 bg-white/10 text-white"
          >
            {t("nav.logout", "Logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="portal-btn portal-btn-outline !border-white/14 !bg-white/8 !text-white">
            {t("nav.login", "Login")}
          </Link>
          <Link to="/register" className="portal-btn portal-btn-primary">
            {t("nav.signup", "Sign Up")}
          </Link>
        </>
      )}
    </>
  );
}

function MobileLinks({
  user,
  isAdmin,
  onClose,
  t,
}: {
  user: unknown;
  isAdmin: boolean;
  onClose: () => void;
  t: (k: string, f?: string) => string;
}) {
  const itemClass = "rounded-2xl px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10";
  return (
    <>
      <Link onClick={onClose} to="/creator/request" className={itemClass}>
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link onClick={onClose} to="/spiritual-program" className={itemClass}>
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link onClick={onClose} to="/prelaunch-registration" className={itemClass}>
        {t("nav.prelaunch_registration", "Prelaunch Registration")}
      </Link>
      <Link onClick={onClose} to="/founders" className={itemClass}>
        Founder's Pass
      </Link>
      <Link onClick={onClose} to="/documentation" className={itemClass}>
        {t("nav.documentation", "Documentation")}
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link onClick={onClose} to="/admin" className="portal-btn portal-btn-gold">
              {t("nav.admin", "Admin")}
            </Link>
          ) : null}
          <button
            onClick={() => {
              onClose();
              signOut(auth);
            }}
            className="portal-btn border border-white/14 bg-white/10 text-left text-white"
          >
            {t("nav.logout", "Logout")}
          </button>
        </>
      ) : (
        <>
          <Link onClick={onClose} to="/login" className="portal-btn portal-btn-outline !border-white/14 !bg-white/8 !text-white">
            {t("nav.login", "Login")}
          </Link>
          <Link onClick={onClose} to="/register" className="portal-btn portal-btn-primary">
            {t("nav.signup", "Sign Up")}
          </Link>
        </>
      )}
    </>
  );
}
