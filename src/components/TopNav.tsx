import { signOut } from "firebase/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { APP } from "../lib/config";
import { useI18n } from "../lib/i18n";
import { useAuthUser } from "../lib/useAuthUser";
import { useUserRole } from "../lib/useUserRole";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopNav() {
  const { user } = useAuthUser();
  const { isAdmin } = useUserRole();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#eef2f6] bg-white shadow-[0_8px_30px_rgba(8,24,40,0.04)]">
      <div className="portal-container py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
            <img
              src={APP.brand.logoWordmark}
              alt="Celeone"
              className="h-10 w-auto max-w-[158px] object-contain"
            />
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-9 lg:flex">
            <DesktopLinks user={user} isAdmin={isAdmin} t={t} />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher compact />
            <DesktopActions user={user} isAdmin={isAdmin} t={t} />
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-[10px] border border-[#e8edf3] bg-white px-4 py-2 text-[15px] font-bold text-slate-800 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileOpen ? (
          <nav className="mt-4 grid gap-2 rounded-[16px] border border-[#f4eefb] bg-white p-3 lg:hidden">
            <MobileLinks user={user} isAdmin={isAdmin} onClose={closeMobile} t={t} />
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function navLinkClass() {
  return "inline-flex items-center py-2 text-[15px] font-medium text-slate-800 transition hover:text-[#2ed06e]";
}

function navActionClass(variant: "primary" | "outline" | "dark") {
  const base =
    "inline-flex min-h-[50px] items-center justify-center rounded-[999px] px-7 text-[15px] font-bold transition";
  if (variant === "primary") {
    return `${base} bg-[#2ed06e] text-white shadow-[0_10px_24px_rgba(46,208,110,0.2)] hover:bg-[#28c464]`;
  }
  if (variant === "dark") {
    return `${base} bg-[#081828] text-white hover:bg-[#0d2238]`;
  }
  return `${base} border border-[#e6ecf1] bg-white text-slate-800 hover:border-[#d3dce5] hover:bg-[#f8fbfd]`;
}

function DesktopLinks({ t }: { user: unknown; isAdmin: boolean; t: (k: string, f?: string) => string }) {
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
    </>
  );
}

function DesktopActions({ user, isAdmin, t }: { user: unknown; isAdmin: boolean; t: (k: string, f?: string) => string }) {
  return user ? (
    <>
      {isAdmin ? (
        <Link to="/admin" className={navActionClass("dark")}>
          {t("nav.admin", "Admin")}
        </Link>
      ) : null}
      <button onClick={() => signOut(auth)} className={navActionClass("outline")}>
        {t("nav.logout", "Logout")}
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className={navActionClass("outline")}>
        {t("nav.login", "Login")}
      </Link>
      <Link to="/register" className={navActionClass("primary")}>
        {t("nav.signup", "Sign Up")}
      </Link>
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
  const itemClass = "rounded-[12px] px-4 py-3 text-[15px] font-medium text-slate-800 hover:bg-[#f4f7fa]";
  return (
    <>
      <div className="px-1 pb-1">
        <LanguageSwitcher compact />
      </div>
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
            <Link onClick={onClose} to="/admin" className={navActionClass("dark")}>
              {t("nav.admin", "Admin")}
            </Link>
          ) : null}
          <button
            onClick={() => {
              onClose();
              signOut(auth);
            }}
            className={`${navActionClass("outline")} text-left`}
          >
            {t("nav.logout", "Logout")}
          </button>
        </>
      ) : (
        <>
          <Link onClick={onClose} to="/login" className={navActionClass("outline")}>
            {t("nav.login", "Login")}
          </Link>
          <Link onClick={onClose} to="/register" className={navActionClass("primary")}>
            {t("nav.signup", "Sign Up")}
          </Link>
        </>
      )}
    </>
  );
}
