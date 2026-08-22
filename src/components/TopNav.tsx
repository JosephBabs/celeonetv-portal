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
    <header className="sticky top-0 z-40 border-b border-[#eef2f6] bg-white shadow-[0_8px_30px_rgba(8,24,40,0.04)]">
      <div className="portal-container py-3">
        <div className="flex items-center justify-between gap-5">
          <Link to="/" className="flex shrink-0 items-center gap-3" onClick={closeMobile}>
            <img
              src={APP.brand.logoWordmark}
              alt="Celeone"
              className="h-11 w-auto max-w-[170px] object-contain"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <DesktopLinks user={user} isAdmin={isAdmin} t={t} />
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
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
  return "inline-flex shrink-0 items-center whitespace-nowrap py-2 text-[15px] font-medium text-slate-800 transition hover:text-[#2ed06e]";
}

function navActionClass(variant: "primary" | "outline" | "dark") {
  const base =
    "inline-flex shrink-0 min-h-[50px] items-center justify-center whitespace-nowrap rounded-[999px] px-6 text-[15px] font-bold transition";
  if (variant === "primary") {
    return `${base} bg-[#2ed06e] text-white shadow-[0_10px_24px_rgba(46,208,110,0.2)] hover:bg-[#28c464]`;
  }
  if (variant === "dark") {
    return `${base} bg-[#081828] text-white shadow-[0_10px_24px_rgba(8,24,40,0.14)] hover:bg-[#0d2238]`;
  }
  return `${base} border border-[#d7e2ea] bg-[#f8fbfd] text-[#081828] hover:border-[#bfd0dc] hover:bg-white`;
}

function DesktopLinks({ t }: { user: unknown; isAdmin: boolean; t: (k: string, f?: string) => string }) {
  const moreLinks = [
    ["/founders", t("nav.founders_pass", "Founder's Pass")],
    ["/documentation", t("nav.documentation", "Documentation")],
    ["/app/privacy", t("nav.privacy_policy", "Privacy Policy")],
    ["/app/child-safety-standards", t("nav.child_safety", "Child Safety")],
    ["/account/request_delete", t("nav.account_deletion", "Account Deletion")],
  ];

  return (
    <nav className="flex min-w-0 items-center justify-center gap-5 xl:gap-7">
      <Link to="/creator/request" className={navLinkClass()}>
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link to="/spiritual-program" className={navLinkClass()}>
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link to="/parishes/register" className={navLinkClass()}>
        {t("nav.register_parish", "Register Parish")}
      </Link>
      <Link to="/prelaunch-registration" className={navLinkClass()}>
        {t("nav.prelaunch_registration", "Prelaunch Registration")}
      </Link>
      <details className="group relative">
        <summary className={`${navLinkClass()} cursor-pointer list-none`}>
          {t("nav.more", "More")}
        </summary>
        <div className="absolute right-0 top-full z-50 mt-3 grid min-w-[230px] gap-1 rounded-[12px] border border-[#e8edf3] bg-white p-2 shadow-[0_18px_45px_rgba(8,24,40,0.12)]">
          {moreLinks.map(([href, label]) => (
            <Link key={href} to={href} className="rounded-[8px] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-[#f4f7fa] hover:text-[#2ed06e]">
              {label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
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
      <Link onClick={onClose} to="/creator/request" className={itemClass}>
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link onClick={onClose} to="/spiritual-program" className={itemClass}>
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link onClick={onClose} to="/parishes/register" className={itemClass}>
        {t("nav.register_parish", "Register Parish")}
      </Link>
      <Link onClick={onClose} to="/prelaunch-registration" className={itemClass}>
        {t("nav.prelaunch_registration", "Prelaunch Registration")}
      </Link>
      <Link onClick={onClose} to="/founders" className={itemClass}>
        {t("nav.founders_pass", "Founder's Pass")}
      </Link>
      <Link onClick={onClose} to="/documentation" className={itemClass}>
        {t("nav.documentation", "Documentation")}
      </Link>
      <Link onClick={onClose} to="/app/privacy" className={itemClass}>
        {t("nav.privacy_policy", "Privacy Policy")}
      </Link>
      <Link onClick={onClose} to="/app/child-safety-standards" className={itemClass}>
        {t("nav.child_safety", "Child Safety")}
      </Link>
      <Link onClick={onClose} to="/account/request_delete" className={itemClass}>
        {t("nav.account_deletion", "Account Deletion")}
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
