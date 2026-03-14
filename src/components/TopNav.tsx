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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
            <img
              src={APP.brand.logoIcon}
              alt="Celeone icon"
              className="h-10 w-10 rounded-2xl object-cover"
            />
            <img
              src={APP.brand.logoWordmark}
              alt="Celeone"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            <DesktopLinks user={user} isAdmin={isAdmin} t={t} />
          </nav>
        </div>

        {mobileOpen ? (
          <nav className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:hidden">
            <MobileLinks user={user} isAdmin={isAdmin} onClose={closeMobile} t={t} />
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function DesktopLinks({ user, isAdmin, t }: { user: unknown; isAdmin: boolean; t: (k: string, f?: string) => string }) {
  return (
    <>
      <Link to="/creator/request" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link to="/creator" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.my_panel", "My Panel")}
      </Link>
      <Link to="/chatrooms/create" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.create_chatroom", "Create Chatroom")}
      </Link>
      <Link to="/jeunesse" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.amis_de_jesus", "Amis de Jesus")}
      </Link>
      <Link to="/spiritual-program" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link to="/documentation" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.documentation", "Documentation")}
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link to="/admin" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800">
              {t("nav.admin", "Admin")}
            </Link>
          ) : null}
          <button
            onClick={() => signOut(auth)}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
          >
            {t("nav.logout", "Logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
            {t("nav.login", "Login")}
          </Link>
          <Link to="/register" className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700">
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
  return (
    <>
      <Link onClick={onClose} to="/creator/request" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.create_tv", "Create TV Channel")}
      </Link>
      <Link onClick={onClose} to="/creator" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.my_panel", "My Panel")}
      </Link>
      <Link onClick={onClose} to="/chatrooms/create" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.create_chatroom", "Create Chatroom")}
      </Link>
      <Link onClick={onClose} to="/jeunesse" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.amis_de_jesus", "Amis de Jesus")}
      </Link>
      <Link onClick={onClose} to="/spiritual-program" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.spiritual_program", "Spiritual Program")}
      </Link>
      <Link onClick={onClose} to="/documentation" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        {t("nav.documentation", "Documentation")}
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link onClick={onClose} to="/admin" className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-extrabold text-white">
              {t("nav.admin", "Admin")}
            </Link>
          ) : null}
          <button
            onClick={() => {
              onClose();
              signOut(auth);
            }}
            className="rounded-xl bg-rose-600 px-3 py-3 text-left text-sm font-extrabold text-white"
          >
            {t("nav.logout", "Logout")}
          </button>
        </>
      ) : (
        <>
          <Link onClick={onClose} to="/login" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
            {t("nav.login", "Login")}
          </Link>
          <Link onClick={onClose} to="/register" className="rounded-xl bg-teal-600 px-3 py-3 text-sm font-extrabold text-white">
            {t("nav.signup", "Sign Up")}
          </Link>
        </>
      )}
    </>
  );
}
